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
        messages: [
          { role: "system", content: "You are a strategic planning agent." },
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

    return res.data.choices[0].message.content;
  } catch (e) {
    console.error("Planner LLM error:", e.message);
    return "{}";
  }
}

async function plannerLoop() {
  try {
    console.log("[Planner] Running...");

    const plans = loadPlans();

    // Pull relevant memory to guide new goals
    const relevant = await queryVector("long-term goals research strategy", 5);

    const prompt = `
You are an AI planner.

Relevant knowledge:
${relevant.join("\n---\n")}

Existing plans:
${JSON.stringify(plans, null, 2)}

Create ONE new high-level goal if useful.
Do not duplicate existing goals.

Respond ONLY JSON:
{
  "action": "create" | "none",
  "goal": "..."
}
`;

    const raw = await askLLM(prompt);
    console.log("[Planner] Decision:", raw);

    let decision;
    try {
      decision = JSON.parse(raw);
    } catch {
      return setTimeout(plannerLoop, 60000);
    }

    if (decision.action === "create") {
      console.log("[Planner] Creating plan for:", decision.goal);

      const plan = await createPlan(decision.goal);

      plans.push({
        goal: decision.goal,
        steps: plan.steps.map(s => ({
          ...s,
          status: "pending"
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
