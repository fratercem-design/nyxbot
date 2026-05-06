import { getRecentReflections } from "../cognition/reflectionEngine.js";
import { getState } from "../core/runtimeState.js";
import { getEmotionalTone } from "../cognition/emotionalEngine.js";

async function execute(input) {
  const state = getState();
  const tone = getEmotionalTone();
  const reflections = getRecentReflections(5);

  const lessons = reflections.flatMap(r => r.lessons).slice(0, 6);
  const failures = reflections.flatMap(r => r.failures).slice(0, 3);

  return {
    cycle: state.cycle,
    emotionalTone: tone,
    emotionalState: state.emotionalState,
    symbolicContext: state.symbolicContext,
    recentLessons: lessons,
    recentFailures: failures,
    activeGoal: state.activeGoal
  };
}

export default {
  name: "reflect",
  metadata: {
    description: "Introspects current state, emotional context, and recent lessons",
    permissions: [],
    inputs: ["optional trigger"],
    outputs: ["reflection object"],
    riskLevel: "low",
    timeout: 5000
  },
  execute
};
