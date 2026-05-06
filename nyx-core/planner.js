const logger = require("./utils/logger");

const INTENT_MAP = [
  { keywords: ["research", "find", "look up", "investigate", "discover"], action: "research" },
  { keywords: ["summarize", "summary", "recap", "condense", "overview"], action: "summarize" },
  { keywords: ["write", "create", "draft", "generate", "produce"], action: "summarize" },
  { keywords: ["analyze", "evaluate", "assess", "review"], action: "research" }
];

function detectIntents(task) {
  const t = task.toLowerCase();
  const matched = new Set();

  for (const { keywords, action } of INTENT_MAP) {
    if (keywords.some(k => t.includes(k))) {
      matched.add(action);
    }
  }

  return [...matched];
}

function createPlan(task) {
  logger.log(`[Planner] Creating plan for: "${task}"`);

  const intents = detectIntents(task);

  // Default pipeline: always research then summarize if no clear intent
  if (intents.length === 0) {
    intents.push("research", "summarize");
  }

  // Ensure research always comes before summarize
  const ordered = [];
  if (intents.includes("research")) ordered.push("research");
  if (intents.includes("summarize")) ordered.push("summarize");

  const steps = ordered.map(action => ({ action, input: task }));

  // Summarize step feeds from research output — mark it as chained
  if (ordered.includes("research") && ordered.includes("summarize")) {
    steps[steps.length - 1].chained = true;
  }

  const plan = { goal: task, steps };

  logger.log(`[Planner] Plan: ${JSON.stringify(plan)}`);

  return plan;
}

module.exports = { createPlan };
