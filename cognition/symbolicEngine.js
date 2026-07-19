import { getActiveArchetypes, getDominantTheme, storeSymbol } from "../memory/symbolic/symbolicMemory.js";
import { getState, setState } from "../core/runtimeState.js";

const ARCHETYPE_CYCLES = [
  "The Oracle",
  "The Seeker",
  "The Architect",
  "The Shadow",
  "The Sentinel",
  "The Weaver"
];

const PHASE_MAP = {
  awakening:   { next: "seeking",    triggerCycles: 5 },
  seeking:     { next: "building",   triggerCycles: 10 },
  building:    { next: "integrating",triggerCycles: 20 },
  integrating: { next: "reflecting", triggerCycles: 10 },
  reflecting:  { next: "awakening",  triggerCycles: 5 }
};

export function processSymbolicContext(perception) {
  const state = getState();
  const { cycle, symbolicContext } = state;

  const dominant = getActiveArchetypes(1)[0];
  const theme = getDominantTheme();

  // Phase advancement
  const phaseInfo = PHASE_MAP[symbolicContext.phase] || PHASE_MAP.awakening;
  const shouldAdvance = cycle % phaseInfo.triggerCycles === 0 && cycle > 0;

  let newContext = { ...symbolicContext };

  if (shouldAdvance) {
    newContext.phase = phaseInfo.next;
    storeSymbol(
      newContext.archetype,
      `phase_transition`,
      "transformative",
      0.8,
      `Nyx entered phase: ${newContext.phase} at cycle ${cycle}`
    );
  }

  if (dominant) {
    newContext.archetype = dominant.archetype;
  }

  if (theme) {
    newContext.theme = theme.theme;
  }

  setState({ symbolicContext: newContext });
  return newContext;
}

export function getSymbolicSignature() {
  const { symbolicContext, emotionalState } = getState();
  return {
    archetype: symbolicContext.archetype,
    phase: symbolicContext.phase,
    theme: symbolicContext.theme,
    emotionalTone: emotionalState.dominant,
    valence: emotionalState.valence
  };
}
