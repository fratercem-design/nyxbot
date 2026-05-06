const express = require("express");
const { createPlan } = require("./planner");
const { executePlan } = require("./executor");
const { search } = require("./memory/memoryStore");
const logger = require("./utils/logger");

const app = express();
app.use(express.json());

const PORT = process.env.NYX_CORE_PORT || process.env.PORT || 3001;

// ── Health check ──────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("Nyx Core running");
});

// ── Run a task through the full agent pipeline ────────────────
app.post("/task", async (req, res) => {
  const { task } = req.body;

  if (!task || typeof task !== "string" || !task.trim()) {
    return res.status(400).json({ error: "No task provided" });
  }

  logger.log(`[Server] Task received: "${task}"`);

  try {
    const plan = createPlan(task.trim());
    const result = await executePlan(plan);

    res.json({ success: true, plan, result });
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Memory search ─────────────────────────────────────────────
app.get("/memory", (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Missing query param ?q=" });
  }

  const results = search(q);
  res.json({ query: q, results });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  logger.log(`[Server] Nyx Core running on port ${PORT}`);
});
