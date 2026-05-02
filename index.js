import fs from "fs";
import path from "path";

// -------------------------
// Load Memory + Tasks
// -------------------------

let memory = JSON.parse(fs.readFileSync("./memory.json", "utf8"));
let tasks = JSON.parse(fs.readFileSync("./tasks.json", "utf8"));

function saveMemory() {
  fs.writeFileSync("./memory.json", JSON.stringify(memory, null, 2));
}

function saveTasks() {
  fs.writeFileSync("./tasks.json", JSON.stringify(tasks, null, 2));
}

// -------------------------
// Memory + Task Helpers
// -------------------------

function remember(type, value) {
  if (!memory[type]) memory[type] = [];
  memory[type].push(value);
  saveMemory();
}

function addTask(task) {
  if (!tasks.tasks) tasks.tasks = [];
  tasks.tasks.push(task);
  saveTasks();
}

function getNextTask() {
  if (!tasks.tasks || tasks.tasks.length === 0) return null;
  return tasks.tasks[0];
}

function completeTask() {
  if (!tasks.tasks || tasks.tasks.length === 0) return;
  tasks.tasks.shift();
  saveTasks();
}

// -------------------------
// Dynamic Skill Loader
// -------------------------

const skills = {};
const skillsPath = "./skills";

const skillFiles = fs.readdirSync(skillsPath);
for (const file of skillFiles) {
  if (file.endsWith(".js")) {
    const name = file.replace(".js", "");
    skills[name] = await import(`${skillsPath}/${file}`);
  }
}

// -------------------------
// DeepSeek Placeholder
// (Step 3 will replace this)
// -------------------------

async function askDeepSeek(prompt) {
  return `DeepSeek placeholder response for: ${prompt}`;
}

// -------------------------
// Skill Router
// -------------------------

async function handleSkillCommand(prompt) {
  if (!prompt.startsWith("skill:")) return null;

  const [_, skillName, ...rest] = prompt.split(" ");
  const arg = rest.join(" ");

  if (!skills[skillName]) {
    return `Skill '${skillName}' not found.`;
  }

  const fn = skills[skillName][skillName];
  if (!fn) {
    return `Skill '${skillName}' exists but has no callable function.`;
  }

  return await fn(arg);
}

// -------------------------
// Input Logic
// -------------------------

const nextTask = getNextTask();

const input = nextTask
  ? `Task: ${nextTask}. Think and act.`
  : "Check for tasks and think.";

// -------------------------
// Main Execution
// -------------------------

async function main() {
  const skillResult = await handleSkillCommand(input);

  if (skillResult) {
    console.log("Skill result:", skillResult);
    return;
  }

  const response = await askDeepSeek(input);
  console.log("DeepSeek:", response);
}

main();
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

