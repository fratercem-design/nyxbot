import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { loadSoul } from "./soulLoader.js";
import { loadMemory, addMemory } from "./memory.js";
import { startLoop, stopLoop, triggerCycle } from "./cognition/cognitiveLoop.js";
import { getState, pushInteraction } from "./core/runtimeState.js";
import { storeEpisode } from "./memory/episodic/episodicMemory.js";
import { createGoal, getActive, getTopGoal } from "./goals/goalManager.js";
import { getEnvironmentalState, recordInteraction } from "./world/worldState.js";
import { getRecentReflections } from "./cognition/reflectionEngine.js";
import { buildNarrativeContext } from "./cognition/narrativeEngine.js";
import toolRegistry from "./toolRegistry.js";
import eventBus from "./core/eventBus.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── Bootstrap ─────────────────────────────────────────────────
const soul = loadSoul();
const legacyMemory = loadMemory();

await toolRegistry.autoLoad(path.join(__dirname, "skills"));

if (process.env.DISABLE_LOOP !== "true") {
  startLoop();
}

// ── Event logging ─────────────────────────────────────────────
eventBus.on("goal:created",    g  => console.log(`[Event] Goal created: "${g.objective}"`));
eventBus.on("goal:completed",  e  => console.log(`[Event] Goal completed: ${e.id}`));
eventBus.on("cycle:complete",  e  => console.log(`[Event] Cycle ${e.cycle}: ${e.action} → ${e.success ? "ok" : "fail"}`));
eventBus.on("emotion:updated", em => console.log(`[Event] Emotion: ${em.dominant} (v:${em.valence.toFixed(2)})`));

// ── Routes ────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Primary chat endpoint — triggers a full cognitive cycle
app.post("/api/chat", async (req, res) => {
  const { message, userId = "anonymous" } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    recordInteraction(userId, message);

    storeEpisode({
      type: "interaction",
      content: message,
      source: `user:${userId}`,
      emotionalWeight: 0.2,
      tags: ["user_input"]
    });

    pushInteraction({ role: "user", content: message, timestamp: Date.now() });

    // Run a full cognitive cycle with the user's message as external input
    const cycleResult = await triggerCycle(message);

    const narrativeCtx = buildNarrativeContext();
    const state = getState();

    const response = {
      final: formatFinalOutput(cycleResult, soul, narrativeCtx),
      cycle: cycleResult.cycle,
      action: cycleResult.executionPlan?.action,
      emotionalState: state.emotionalState,
      symbolicContext: state.symbolicContext,
      steps: cycleResult.executionResult
        ? [cycleResult.executionResult]
        : []
    };

    // Legacy memory for backwards compat
    addMemory(legacyMemory, { input: message, output: response.final });

    res.json(response);
  } catch (err) {
    console.error("[Server] Chat error:", err);
    res.status(500).json({ error: err.message });
  }
});

// State / status
app.get("/api/state", (req, res) => {
  const state = getState();
  const env = getEnvironmentalState();
  res.json({ ...state, world: env });
});

// Goals
app.get("/api/goals", (req, res) => {
  res.json(getActive());
});

app.post("/api/goals", (req, res) => {
  const { objective, type, priority } = req.body;
  if (!objective) return res.status(400).json({ error: "objective required" });
  const goal = createGoal({ objective, type, priority });
  res.json(goal);
});

// Memory
app.get("/api/reflections", (req, res) => {
  res.json(getRecentReflections(10));
});

// Tools
app.get("/api/tools", (req, res) => {
  res.json(toolRegistry.list());
});

// Narrative
app.get("/api/narrative", (req, res) => {
  res.json(buildNarrativeContext());
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] Nyx OS running on port ${PORT}`);
  console.log(`[Soul]   ${soul.name} — "${soul.purpose}"`);
  console.log(`[Tools]  ${toolRegistry.list().map(t => t.name).join(", ")}`);
});

function formatFinalOutput(cycleResult, soul, narrativeCtx) {
  if (!cycleResult) return "(no output)";

  const output = cycleResult.executionResult?.output;

  if (!output) {
    const reflection = cycleResult.reflection;
    return reflection?.summary || "Cycle complete. No action taken.";
  }

  if (typeof output === "string") return output;
  if (typeof output === "object") return JSON.stringify(output, null, 2);
  return String(output);
}
