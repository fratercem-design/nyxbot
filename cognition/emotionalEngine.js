import { getState, patchEmotionalState } from "../core/runtimeState.js";
import { storeSymbol } from "../memory/symbolic/symbolicMemory.js";
import eventBus from "../core/eventBus.js";

const EMOTION_MAP = {
  success:   { valence: +0.3, arousal: +0.2, dominant: "satisfied" },
  failure:   { valence: -0.3, arousal: +0.3, dominant: "frustrated" },
  discovery: { valence: +0.2, arousal: +0.4, dominant: "curious" },
  idle:      { valence:  0.0, arousal: -0.1, dominant: "calm" },
  threat:    { valence: -0.4, arousal: +0.5, dominant: "alert" },
  goal_done: { valence: +0.5, arousal: +0.1, dominant: "fulfilled" },
  learning:  { valence: +0.1, arousal: +0.2, dominant: "engaged" }
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function processEmotionalEvent(eventType, intensity = 1.0) {
  const template = EMOTION_MAP[eventType] || EMOTION_MAP.idle;
  const current = getState().emotionalState;

  const next = {
    valence:  clamp(current.valence  + template.valence  * intensity, -1, 1),
    arousal:  clamp(current.arousal  + template.arousal  * intensity, 0, 1),
    dominant: template.dominant
  };

  patchEmotionalState(next);

  // High-intensity emotions get symbolically logged
  if (Math.abs(template.valence * intensity) >= 0.3) {
    storeSymbol(
      emotionToArchetype(next.dominant),
      eventType,
      next.dominant,
      Math.abs(next.valence),
      `Emotional shift: ${eventType} (intensity ${intensity.toFixed(2)})`
    );
  }

  eventBus.emit("emotion:updated", next);
  return next;
}

export function decayToNeutral(factor = 0.05) {
  const current = getState().emotionalState;

  patchEmotionalState({
    valence: current.valence * (1 - factor),
    arousal: clamp(current.arousal * (1 - factor), 0.1, 1)
  });
}

export function getEmotionalTone() {
  const { valence, arousal, dominant } = getState().emotionalState;

  if (valence > 0.4 && arousal > 0.5) return "intense-positive";
  if (valence > 0.2) return "positive";
  if (valence < -0.4) return "negative";
  if (arousal > 0.7) return "activated";
  if (arousal < 0.2) return "subdued";
  return "neutral";
}

function emotionToArchetype(dominant) {
  const map = {
    satisfied: "The Achiever",
    frustrated: "The Shadow",
    curious: "The Explorer",
    calm: "The Sage",
    alert: "The Sentinel",
    fulfilled: "The Oracle",
    engaged: "The Seeker"
  };
  return map[dominant] || "The Wanderer";
}
