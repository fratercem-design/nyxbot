import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

// recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------
// LOAD ALL SKILLS
// --------------------
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
      console.error(`[Skills] Failed to load ${name}:`, err.message);
    }
  }

  return skills;
}

// --------------------
// MATCH SKILL (ROUTER)
// --------------------
export function matchSkill(task, skills) {
  if (!task || typeof task !== "string") return null;

  const t = task.toLowerCase();

  // FILE HANDLING
  if (
    t.includes("read file") ||
    t.includes("open file") ||
    t.includes("load file")
  ) {
    return skills.fileReader || skills.basic;
  }

  // RESEARCH
  if (
    t.includes("research") ||
    t.includes("search") ||
    t.includes("find") ||
    t.includes("look up")
  ) {
    return skills.research || skills.basic;
  }

  // ANALYSIS
  if (
    t.includes("analyze") ||
    t.includes("compare") ||
    t.includes("evaluate") ||
    t.includes("assess")
  ) {
    return skills.analysis || skills.basic;
  }

  // WRITING / CONTENT
  if (
    t.includes("write") ||
    t.includes("generate") ||
    t.includes("draft") ||
    t.includes("create content")
  ) {
    return skills.writer || skills.basic;
  }

  // PLANNING
  if (
    t.includes("plan") ||
    t.includes("strategy") ||
    t.includes("roadmap") ||
    t.includes("steps")
  ) {
    return skills.planner || skills.basic;
  }

  // ORGANIZATION
  if (
    t.includes("organize") ||
    t.includes("list") ||
    t.includes("structure") ||
    t.includes("break down")
  ) {
    return skills.organizer || skills.basic;
  }

  // LEARNING / SKILLS
  if (
    t.includes("learn") ||
    t.includes("study") ||
    t.includes("practice") ||
    t.includes("skill")
  ) {
    return skills.learning || skills.basic;
  }

  // MEMORY
  if (
    t.includes("remember") ||
    t.includes("store") ||
    t.includes("save")
  ) {
    return skills.memory || skills.basic;
  }

  // DEFAULT FALLBACK
  return skills.basic || null;
}