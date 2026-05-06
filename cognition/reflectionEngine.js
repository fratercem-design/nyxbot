import db from "../memory/memoryDB.js";
import { storeEpisode } from "../memory/episodic/episodicMemory.js";
import { storeConcept } from "../memory/semantic/semanticMemory.js";
import { processEmotionalEvent } from "./emotionalEngine.js";
import { getState, setState } from "../core/runtimeState.js";
import eventBus from "../core/eventBus.js";

export function reflect(executionResult) {
  const state = getState();
  const failures = [];
  const improvements = [];
  const lessons = [];
  let emotionalImpact = 0;

  if (!executionResult) {
    return storeReflection({
      trigger: "no_result",
      summary: "Cycle completed with no execution result.",
      failures, improvements, lessons, emotionalImpact: 0,
      cycleNumber: state.cycle
    });
  }

  const { success, skill, input, output, durationMs, error } = executionResult;

  if (!success) {
    failures.push(`Skill "${skill}" failed: ${error || "unknown error"}`);
    improvements.push(`Review inputs for skill "${skill}"`);
    lessons.push(`Failure pattern in ${skill} — consider alternative approach`);
    emotionalImpact = -0.3;
    processEmotionalEvent("failure", 0.7);
  } else {
    lessons.push(`Skill "${skill}" succeeded in ${durationMs}ms`);
    emotionalImpact = 0.2;
    processEmotionalEvent("success", 0.5);

    // Extract a concept if output is substantial
    if (output && typeof output === "string" && output.length > 50) {
      const concept = input?.slice(0, 60) || skill;
      storeConcept(concept, output.slice(0, 200), {}, `skill:${skill}`);
      lessons.push(`Learned concept: "${concept}"`);
      processEmotionalEvent("learning", 0.4);
    }
  }

  const summary = success
    ? `Executed "${skill}" on "${String(input).slice(0, 60)}" — completed in ${durationMs}ms`
    : `Failed to execute "${skill}" — ${error?.slice(0, 100)}`;

  const reflection = storeReflection({
    trigger: skill,
    summary,
    failures,
    improvements,
    lessons,
    emotionalImpact,
    cycleNumber: state.cycle
  });

  // Store as episodic event
  storeEpisode({
    type: "reflection",
    content: summary,
    source: "reflectionEngine",
    emotionalWeight: Math.abs(emotionalImpact),
    tags: [skill, success ? "success" : "failure"]
  });

  setState({ lastReflection: reflection });
  eventBus.emit("reflection:stored", reflection);

  return reflection;
}

function storeReflection({ trigger, summary, failures, improvements, lessons, emotionalImpact, cycleNumber }) {
  const result = db.prepare(`
    INSERT INTO reflections (trigger_event, summary, failures, improvements, lessons, emotional_impact, cycle_number, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    trigger,
    summary,
    JSON.stringify(failures),
    JSON.stringify(improvements),
    JSON.stringify(lessons),
    emotionalImpact,
    cycleNumber,
    Date.now()
  );

  return {
    id: result.lastInsertRowid,
    trigger,
    summary,
    failures,
    improvements,
    lessons,
    emotionalImpact
  };
}

export function getRecentReflections(limit = 5) {
  return db.prepare(`
    SELECT * FROM reflections ORDER BY timestamp DESC LIMIT ?
  `).all(limit).map(r => ({
    ...r,
    failures: JSON.parse(r.failures),
    improvements: JSON.parse(r.improvements),
    lessons: JSON.parse(r.lessons)
  }));
}
