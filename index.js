import fs from "fs";
import path from "path";

// Load memory
let memory = JSON.parse(fs.readFileSync("./memory.json", "utf8"));

// Load tasks
let tasks = JSON.parse(fs.readFileSync("./tasks.json", "utf8"));

// Save helpers
function saveMemory() {
  fs.writeFileSync("./memory.json", JSON.stringify(memory, null, 2));
}

function saveTasks() {
  fs.writeFileSync("./tasks.json", JSON.stringify(tasks, null, 2));
}

import axios from "axios";
import fs from "fs";

const API_KEY = process.env.DEEPSEEK_API_KEY;

console.log("Starting agent...");

if (!API_KEY) {
  console.error("❌ Missing DEEPSEEK_API_KEY");
}

let memory = [];

try {
  if (fs.existsSync("memory.json")) {
    memory = JSON.parse(fs.readFileSync("memory.json"));
  }
} catch (e) {
  console.error("Memory load error:", e.message);
  memory = [];
}

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
        },
        timeout: 20000
      }
    );

    return res.data?.choices?.[0]?.message?.content || "No response";
  } catch (err) {
    console.error("🔥 API ERROR:", err.response?.data || err.message);
    return "API failed.";
  }
}

async function loop() {
  try {
    console.log("Running loop...");

    const input = "Check for tasks and think.";
    const reply = await askDeepSeek(input);

    console.log("Agent:", reply);

    memory.push({ role: "user", content: input });
    memory.push({ role: "assistant", content: reply });

    fs.writeFileSync("memory.json", JSON.stringify(memory, null, 2));
  } catch (e) {
    console.error("🔥 LOOP ERROR:", e.message);
  }

  setTimeout(loop, 30000);
}

// NEVER let process die
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED:", err);
});

loop();
