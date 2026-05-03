console.log("ENV CHECK:", {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "loaded" : "missing",
  OTHER_API_KEY: process.env.OTHER_API_KEY ? "loaded" : "missing"
});
const axios = require("axios");
const fs = require("fs");

const { searchKnowledge } = require("./utils/memory.js");
const { createPlan } = require("./utils/planner.js");

const API_KEY = process.env.DEEPSEEK_API_KEY;

// ---------- JSON ----------
function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch {
    return [];
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ---------- DATA ----------
function loadPlans() {
  return loadJSON("plans.json");
}

function savePlans(plans) {
  saveJSON("plans.json", plans);
}

// ---------- LLM ----------
async function askLLM(prompt) {
  try {
    const res = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a strategic planner that builds on prior knowledge."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return JSON.parse(res.data.choices[0].message.content);

  } catch (err) {
    console.error("[Planner] Error:", err.message);
    return {};
  }
}

// ---------- LOOP ----------
async function plannerLoop() {
  try {
    console.log("[Planner] Running...");

    const plans = loadPlans();

    // ---------- GET MEMORY ----------
    const memory = searchKnowledge("AI");

    const decision = await askLLM(`
You are an AI planner.

Previous knowledge:
${JSON.stringify(memory, null, 2)}

Existing plans:
${JSON.stringify(plans, null, 2)}

Create ONE high-value goal that:
- builds on previous knowledge
- fills gaps or expands insights
- is NOT repetitive

Return JSON:
{
  "action": "create" | "none",
  "goal": "...",
  "priority": 1-10
}
`);

    if (decision.action === "create") {
      console.log("[Planner] New goal:", decision.goal);

      const plan = await createPlan(decision.goal);

      plans.push({
        goal: decision.goal,
        priority: decision.priority || 5,
        created_at: Date.now(),
        steps: plan.steps.map((s, i) => ({
          ...s,
          status: "pending",
          priority: 10 - i,
          run_at: Date.now(),
          retries: 0
        }))
      });

      savePlans(plans);
    }

  } catch (e) {
    console.error("[Planner] Loop error:", e.message);
  }

  setTimeout(plannerLoop, 60000);
}

plannerLoop();
