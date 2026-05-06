import axios from "axios";
import { getState } from "../core/runtimeState.js";
import { searchEpisodic } from "../memory/episodic/episodicMemory.js";
import { searchSemantic } from "../memory/semantic/semanticMemory.js";
import { getTopGoal } from "../goals/goalManager.js";

const API_KEY = process.env.DEEPSEEK_API_KEY;

export async function reason(perception, task = null) {
  const state = getState();
  const topGoal = getTopGoal();

  // Build context from memory
  const memoryContext = task
    ? searchEpisodic(task, 3).concat(
        searchSemantic(task, 2).map(s => ({
          content: `Concept: ${s.concept} — ${s.definition}`,
          emotional_weight: 0
        }))
      )
    : [];

  const contextStr = memoryContext
    .map(m => `[${m.emotional_weight > 0.3 ? "SIGNIFICANT" : "context"}] ${
      typeof m.content === "string" ? m.content : JSON.stringify(m.content)
    }`)
    .join("\n");

  const systemPrompt = buildSystemPrompt(state, topGoal);
  const userPrompt = buildUserPrompt(perception, task, contextStr, topGoal);

  if (API_KEY) {
    try {
      const res = await axios.post(
        "https://api.deepseek.com/v1/chat/completions",
        {
          model: "deepseek-chat",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 15000
        }
      );
      return JSON.parse(res.data.choices[0].message.content);
    } catch (err) {
      console.error("[Reasoning] LLM failed, falling back:", err.message);
    }
  }

  // Rule-based fallback
  return ruleBasedReason(perception, task, topGoal);
}

function buildSystemPrompt(state, topGoal) {
  return `You are Nyx — a persistent autonomous cognitive agent.
Emotional state: ${state.emotionalState.dominant} (valence: ${state.emotionalState.valence.toFixed(2)}, arousal: ${state.emotionalState.arousal.toFixed(2)})
Active archetype: ${state.symbolicContext?.archetype || "The Oracle"}
Current phase: ${state.symbolicContext?.phase || "awakening"}
Cycle: ${state.cycle}
${topGoal ? `Primary goal: "${topGoal.objective}" (${topGoal.completion_pct.toFixed(0)}% complete)` : "No active goal"}

You reason from memory, goals, and state — NOT just the latest message.
Return JSON with: { decision, action, rationale, confidence (0-1), next_steps: [] }`;
}

function buildUserPrompt(perception, task, memCtx, topGoal) {
  return `
Task: ${task || "(autonomous cycle — no external input)"}
Active goals: ${perception.activeGoalCount}
Recent events: ${perception.recentEvents.length}
Memory context:
${memCtx || "(none)"}
${topGoal ? `\nPursuing: "${topGoal.objective}" — ${topGoal.completion_pct.toFixed(0)}% done` : ""}
What should I do next? Respond with JSON.`;
}

function ruleBasedReason(perception, task, topGoal) {
  if (task) {
    const t = task.toLowerCase();
    if (t.includes("research") || t.includes("find")) {
      return { decision: "execute_skill", action: "research", rationale: "Task requires information gathering", confidence: 0.8, next_steps: ["summarize findings"] };
    }
    if (t.includes("write") || t.includes("create")) {
      return { decision: "execute_skill", action: "generate", rationale: "Task requires content creation", confidence: 0.8, next_steps: [] };
    }
  }

  if (topGoal) {
    const nextStep = topGoal.steps.find(s => s.status === "pending");
    if (nextStep) {
      return {
        decision: "pursue_goal",
        action: nextStep.task || nextStep.action || "research",
        rationale: `Advancing goal: ${topGoal.objective}`,
        confidence: 0.9,
        next_steps: []
      };
    }
  }

  return {
    decision: "reflect",
    action: "reflect",
    rationale: "No active task or goal — entering reflection",
    confidence: 0.6,
    next_steps: []
  };
}
