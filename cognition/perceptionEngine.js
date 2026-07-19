import { recallRecent } from "../memory/episodic/episodicMemory.js";
import { getActive } from "../goals/goalManager.js";
import { getState } from "../core/runtimeState.js";
import { getDominantTheme } from "../memory/symbolic/symbolicMemory.js";

export async function perceive(externalInput = null) {
  const state = getState();

  const recentMemory = recallRecent(5);
  const activeGoals = getActive();
  const symbolicTheme = getDominantTheme();

  const perception = {
    timestamp: Date.now(),
    cycle: state.cycle,
    externalInput,
    emotionalState: { ...state.emotionalState },
    recentEvents: recentMemory.map(m => ({
      type: m.type,
      summary: typeof m.content === "string"
        ? m.content.slice(0, 120)
        : JSON.stringify(m.content).slice(0, 120),
      emotionalWeight: m.emotional_weight,
      age: Date.now() - m.timestamp
    })),
    activeGoalCount: activeGoals.length,
    topGoal: activeGoals[0] ? {
      id: activeGoals[0].id,
      objective: activeGoals[0].objective,
      progress: activeGoals[0].completion_pct
    } : null,
    symbolicContext: symbolicTheme || { theme: "undefined", avg_intensity: 0 },
    hasExternalInput: !!externalInput,
    idleMs: state.lastPerception
      ? Date.now() - state.lastPerception.timestamp
      : null
  };

  return perception;
}
