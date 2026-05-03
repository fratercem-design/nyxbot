const axios = require("axios");
const fs = require("fs");

const { research } = require("./skills/research.js");

const API_KEY = process.env.DEEPSEEK_API_KEY;

console.log("Starting agent...");

// ---------- MEMORY ----------
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

let memory = loadJSON("memory.json");

// ---------- TASKS ----------
function loadTasks() {
  return loadJSON("tasks.json");
}

function saveTasks(tasks) {
  saveJSON("tasks.json", tasks);
}

// ---------- KNOWLEDGE ----------
function loadKnowledge() {
  return loadJSON("knowledge.json");
}

function saveKnowledge(data) {
  saveJSON("knowledge.json", data);
}

// ---------- DEEPSEEK ----------
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

// ---------- SKILL EXECUTION ----------
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
    const knowledge = loadKnowledge();

    const prompt = `
You are an autonomous AI agent.

Known knowledge:
${JSON.stringify(knowledge.slice(-5), null, 2)}

Current tasks:
${JSON.stringify(tasks, null, 2)}

If something requires learning or analysis, create a task with "research".

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

    // ---------- HANDLE DECISION ----------
    if (decision.action === "create") {
      tasks.push({ task: decision.task, status: "pending" });
    }

    if (decision.action === "complete") {
      const t = tasks.find(t => t.task === decision.task);
      if (t) t.status = "done";
    }

    // ---------- EXECUTE TASKS ----------
    for (let t of tasks) {
      if (t.status === "pending") {
        const result = await runSkill(t.task);

        console.log("Task result:", result);

        try {
          const parsed = JSON.parse(result);
          const knowledge = loadKnowledge();

          for (let item of parsed) {
            knowledge.push({
              topic: t.task,
              source: item.url,
              insights: item.summary.insights,
              facts: item.summary.facts,
              actions: item.summary.actions,
              timestamp: Date.now()
            });
          }

          saveKnowledge(knowledge);
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
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED:", err);
});

loop();
