const { createPlan } = require("./utils/planner.js");
const axios = require("axios");
const fs = require("fs");

const { research } = require("./skills/research.js");
const { cleanAndRank } = require("./utils/knowledge.js");
const { addToVector, queryVector } = require("./utils/vector.js");

const API_KEY = process.env.DEEPSEEK_API_KEY;

console.log("Starting agent...");

// ---------- UTILS ----------
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

    // -------- VECTOR QUERY --------
    const queryText = tasks.map(t => t.task).join(" ");
    const relevantMemory = await queryVector(
      queryText || "general research",
      5
    );

    const prompt = `
You are an autonomous AI agent.

Relevant knowledge:
${relevantMemory.join("\n---\n")}

Current tasks:
${JSON.stringify(tasks, null, 2)}

Goals:
- Build knowledge
- Avoid repetition
- Expand insights

Rules:
- Create "research" tasks for learning
- Use memory to guide decisions
- Do not duplicate tasks

Respond ONLY in JSON:
{
  "action": "create" | "complete" | "none",
  "task": "task description"
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

    // -------- DECISION --------
    if (decision.action === "create") {
      tasks.push({ task: decision.task, status: "pending" });
    }

    if (decision.action === "complete") {
      const t = tasks.find(t => t.task === decision.task);
      if (t) t.status = "done";
    }

    // -------- EXECUTE --------
    for (let t of tasks) {
      if (t.status === "pending") {
        const result = await runSkill(t.task);

        console.log("Task result:", result);

        try {
          const parsed = JSON.parse(result);
          const knowledge = loadKnowledge();

          for (let item of parsed) {
            const entry = {
              topic: t.task,
              source: item.url,
              insights: item.summary.insights,
              facts: item.summary.facts,
              actions: item.summary.actions,
              timestamp: Date.now()
            };

            knowledge.push(entry);

            await addToVector(entry);
          }

          const cleaned = cleanAndRank(knowledge);
          saveKnowledge(cleaned);

        } catch {
          console.log("Could not store knowledge.");
        }

        t.status = "done";
      }
    }

    saveTasks(tasks);

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
