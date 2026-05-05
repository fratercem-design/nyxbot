import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadSkills() {
  const files = fs.readdirSync(__dirname);
  const skills = {};

  for (const file of files) {
    if (file === "index.js" || !file.endsWith(".js")) continue;

    const name = file.replace(".js", "");
    const modulePath = pathToFileURL(path.join(__dirname, file)).href;

    const mod = await import(modulePath);
    skills[name] = mod.default;
  }

  return skills;
}

export function matchSkill(task, skills, memory) {
  const t = task.toLowerCase();

  // 🔥 if goal active → prioritize research
  if (memory.goals.some(g => g.status === "active")) {
    return skills.research || skills.basic;
  }

  if (t.includes("research")) return skills.research;
  if (t.includes("file")) return skills.fileReader;

  return skills.basic;
}