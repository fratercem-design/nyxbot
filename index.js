const axios = require("axios");
const fs = require("fs");

const { research } = require("./skills/research.js");
const { cleanAndRank } = require("./utils/knowledge.js");
const { addToVector, queryVector } = require("./utils/vector.js");
const { createPlan } = require("./utils/planner.js");

const API_KEY = process.env.DEEPSEEK_API_KEY;

console.log("Starting agent...");

// ---------- JSON UTILS ----------
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
let memory = loadJSON("memory.json");

function loadTasks() {
  return loadJSON("tasks.json");
}

function saveTasks(tasks) {
  saveJSON("tasks.json", tasks);
}

function loadKnowledge() {
  return loadJSON("knowledge.json");
}

function saveKnowledge(data) {
  saveJSON("knowledge.json", data);
}

// ---------- PLAN HELPERS ----------
function loadPlans() {
  return loadJSON("plans.json");
}

function savePlans(plans) {
  saveJSON("plans.json", plans);
}

// ---------- LLM ----------
async function askDeepSeek(prompt) {
  try {
    const res = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are Psyche's AI operator." },
          ...memory.slice(-10),
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

  } catch (err) {
    console.error("API ERROR:", err.response?.data || err.message);
    return "{}";
  }
}

// ---------- SKILLS ----------
async function runSkill(task) {
  if (task.toLowerCase().includes("research")) {
    return await research(task);
  }
  return JSON.stringify({ message: "No matching skill" });
}

// ---------- MAIN LOOP ----------
async function loop() {
  try {
    console.log("Running agent loop...");

    const tasks = loadTasks();
    const plans = loadPlans();

    // ---------- VECTOR MEMORY ----------
    const queryText = tasks.map(t => t.task).join(" ");
    const relevantMemory = await queryVector(
      queryText || "general research",
      5
    );

    // ---------- PROMPT ----------
    const prompt = `
You are an autonomous AI agent.

Relevant knowledge:
${relevantMemory.join("\n---\n")}

Existing plans:
${JSON.stringify(plans, null, 2)}

Current tasks:
${JSON.stringify(tasks, null, 2)}

Rules:
- Create ONLY high-level goals
- Do not create step-by-step tasks
- Plans will handle execution
- Avoid duplicates

Respond ONLY in JSON:
{
  "action": "create" | "none",
  "task": "high-level goal"
}
`;

    const decisionRaw = await askDeepSeek(prompt);

    console.log("Decision raw:", decisionRaw);

    let decision;
    try {
      decision = JSON.parse(decisionRaw);
    } catch {
      console.log("Invalid JSON decision.");
      return setTimeout(loop, 30000);
    }

    // ---------- CREATE PLAN ----------
    if (decision.action === "create") {
      console.log("Creating plan for:", decision.task);

      const plan = await createPlan(decision.task);

      plans.push({
        goal: decision.task,
        steps: plan.steps.map(s => ({
          ...s,
          status: "pending"
        }))
      });

      savePlans(plans);
    }

    // ---------- EXECUTE PLAN ----------
    for (let plan of plans) {
      const nextStep = plan.steps.find(s => s.status === "pending");

      if (nextStep) {
        console.log("Executing step:", nextStep.task);

        const result = await runSkill(nextStep.task);

        console.log("Step result:", result);

        nextStep.status = "done";

        // ---------- STORE KNOWLEDGE ----------
        try {
          const parsed = JSON.parse(result);
          const knowledge = loadKnowledge();

          for (let item of parsed) {
            const entry = {
              topic: nextStep.task,
              source: item.url,
              insights: item.summary.insights,
              facts: item.summary.facts,
              actions: item.summary.actions,
              timestamp: Date.now()
            };

            knowledge.push(entry);

            await addToVector(entry);
          }

          saveKnowledge(cleanAndRank(knowledge));

        } catch {
          console.log("Knowledge store failed.");
        }

        break; // run one step per loop
      }
    }

    savePlans(plans);

  } catch (e) {
    console.error("Loop error:", e.message);
  }

  setTimeout(loop, 30000);
}

// ---------- SAFETY ----------
process.on("uncaughtException", err => {
  console.error("UNCAUGHT:", err);
});

process.on("unhandledRejection", err => {
  console.error("UNHANDLED:", err);
});

loop();
