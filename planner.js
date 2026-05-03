const axios = require("axios");
const fs = require("fs");

const { queryVector } = require("./utils/vector.js");
const { createPlan } = require("./utils/planner.js");
const {
  loadMissions,
  getActiveMission
} = require("./utils/missions.js");

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
          { role: "system", content: "You are a mission-driven planner." },
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

  } catch {
    return {};
  }
}

async function plannerLoop() {
  try {
    console.log("[Planner] Running...");

    const plans = loadPlans();
    const missions = loadMissions();
    const mission = getActiveMission(missions);

    if (!mission) {
      console.log("[Planner] No active mission.");
      return setTimeout(plannerLoop, 60000);
    }

    const relevant = await queryVector(mission.mission, 5);

    const decision = await askLLM(`
Mission:
${mission.mission}

Relevant knowledge:
${relevant.join("\n---\n")}

Existing plans:
${JSON.stringify(plans, null, 2)}

Create ONE goal that advances the mission.

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
        mission: mission.mission,
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
    console.error("[Planner] Error:", e.message);
  }

  setTimeout(plannerLoop, 60000);
}

plannerLoop();
