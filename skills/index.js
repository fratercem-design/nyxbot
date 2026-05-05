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

    try {
      const mod = await import(modulePath);
      skills[name] = mod.default;
      console.log(`[Skills] Loaded: ${name}`);
    } catch (err) {
      console.error(`[Skills] Failed: ${name}`, err.message);
    }
  }

  return skills;
}

export function matchSkill(task, skills) {
  const t = task.toLowerCase();

  if (t.includes("file")) return skills.fileReader || skills.basic;
  if (t.includes("research") || t.includes("search")) return skills.research || skills.basic;

  return skills.basic || null;
}