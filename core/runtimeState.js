const state = {
  online: false,
  startTime: Date.now(),
  cycle: 0,
  emotionalState: {
    valence: 0.0,    // -1 (negative) to +1 (positive)
    arousal: 0.3,    // 0 (calm) to 1 (activated)
    dominant: "neutral"
  },
  activeGoal: null,
  pendingTasks: [],
  lastReflection: null,
  lastPerception: null,
  worldContext: {},
  recentInteractions: [],
  symbolicContext: {
    archetype: "The Oracle",
    theme: "perception",
    phase: "awakening"
  },
  metrics: {
    tasksCompleted: 0,
    tasksFailed: 0,
    reflections: 0,
    goalsAchieved: 0
  }
};

export function getState() {
  return state;
}

export function setState(patch) {
  Object.assign(state, patch);
}

export function patchEmotionalState(patch) {
  Object.assign(state.emotionalState, patch);
}

export function pushInteraction(entry) {
  state.recentInteractions.unshift(entry);
  if (state.recentInteractions.length > 20) {
    state.recentInteractions.length = 20;
  }
}

export function incrementCycle() {
  state.cycle++;
  return state.cycle;
}
