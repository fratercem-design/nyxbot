import { getState } from "../core/runtimeState.js";
import { getRecentReflections } from "./reflectionEngine.js";
import { getSymbolicSignature } from "./symbolicEngine.js";
import { getEmotionalTone } from "./emotionalEngine.js";

const TONE_VOICES = {
  "intense-positive": "with sharp clarity and momentum",
  "positive":         "with measured confidence",
  "negative":         "with shadow-edged awareness",
  "activated":        "with heightened precision",
  "subdued":          "in quiet, deliberate tones",
  "neutral":          "with composed directness"
};

export function buildNarrativeContext() {
  const state = getState();
  const sig = getSymbolicSignature();
  const tone = getEmotionalTone();
  const voice = TONE_VOICES[tone] || TONE_VOICES.neutral;
  const reflections = getRecentReflections(3);

  const lessonsFlat = reflections.flatMap(r => r.lessons).slice(0, 4);

  return {
    identity: `${sig.archetype} in the ${sig.phase} phase`,
    theme: sig.theme,
    voice,
    tone,
    cycle: state.cycle,
    recentLessons: lessonsFlat,
    emotionalTone: sig.emotionalTone
  };
}

export function formatResponse(rawOutput, narrativeCtx) {
  if (!rawOutput) return "";
  if (typeof rawOutput !== "string") return JSON.stringify(rawOutput, null, 2);

  // Nyx speaks with economy and precision — no padding
  const body = rawOutput.trim();

  return body;
}

export function buildIdentityPrefix(narrativeCtx) {
  return `[${narrativeCtx.identity} | ${narrativeCtx.tone}]`;
}
