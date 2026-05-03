const axios = require("axios");
const fs = require("fs");

const { queryVector } = require("./utils/vector.js");
const { createPlan } = require("./utils/planner.js");

const API_KEY = process.env.DEEPSEEK_API_KEY;

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

function loadPlans() {
  return loadJSON("plans.json");
}

function savePlans(plans) {
  saveJSON("plans.json", plans);
}

async function askLLM(prompt) {
  try {
    const res = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a strategic planner." },
          { role: "user", content: prompt }
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

  } catch (e) {
    console.error("Planner error:", e.message);
    return {};
  }
}

async function plannerLoop() {
  try {
    console.log("[Planner] Running...");

    const plans = loadPlans();

    const relevant = await queryVector("strategy planning goals", 5);

    const decision = await askLLM(`
Relevant knowledge:
${relevant.join("\n---\n")}

Existing plans:
${JSON.stringify(plans, null, 2)}

Create ONE new high-value goal.

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
          priority: 10 - i, // earlier steps higher
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
