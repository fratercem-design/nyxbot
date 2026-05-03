import fs from "fs";

import { loadSkills } from "./skills/index.js";
import research from "./skills/research.js";
import { generateContent } from "./utils/contentEngine.js";
import { addKnowledge } from "./utils/memory.js";
import { publishLatest } from "./utils/publisher.js";

// ---------- JSON ----------
function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ---------- DATA ----------
function loadPlans() {
  return loadJSON("plans.json");
}

function savePlans(plans) {
  saveJSON("plans.json", plans);
}

// ---------- SKILL EXECUTION ----------
async function runSkill(task) {
  const skills = loadSkills();
  const lower = task.toLowerCase();

  // ---------- CONTENT ----------
  if (
    lower.includes("write") ||
    lower.includes("content") ||
    lower.includes("post")
  ) {
    console.log("[Executor] Generating content...");
    return await generateContent(task);
  }

  // ---------- RESEARCH ----------
  if (lower.includes("research")) {
    return await research(task);
  }

  // ---------- CUSTOM SKILLS ----------
  for (let name in skills) {
    if (lower.includes(name)) {
      console.log("[Executor] Using skill:", name);
      return await skills[name](task);
    }
  }

  console.log("[Executor] No skill matched.");
  return JSON.stringify({ message: "No action taken" });
}

// ---------- PICK NEXT STEP ----------
function getNextStep(plans) {
  for (let plan of plans) {
    for (let step of plan.steps) {
      if (step.status === "pending") {
        return { plan, step };
      }
    }
  }
  return null;
}

// ---------- LOOP ----------
async function executorLoop() {
  try {
    console.log("[Executor] Running...");

    const plans = loadPlans();
    const next = getNextStep(plans);

    if (!next) {
      console.log("[Executor] No pending steps.");
      return setTimeout(executorLoop, 30000);
    }

    const { plan, step } = next;

    console.log("[Executor] Executing:", step.task);

    // mark running
    step.status = "running";
    savePlans(plans);

    // run task
    const result = await runSkill(step.task);

    console.log("[Executor] Result:", result);

    // ---------- STORE MEMORY ----------
    try {
      const parsed = JSON.parse(result);

      if (Array.isArray(parsed)) {
        addKnowledge(parsed, step.task);
        console.log("[Memory] Stored knowledge");
      }
    } catch {
      console.log("[Memory] Skipped (not JSON)");
    }

    // ---------- AUTO PUBLISH ----------
    try {
      if (step.task.toLowerCase().includes("write")) {
        publishLatest();
      }
    } catch {
      console.log("[Publish] Skipped");
    }

    // mark done
    step.status = "done";
    savePlans(plans);

    console.log("[Executor] Completed:", step.task);

  } catch (e) {
    console.error("[Executor] Error:", e);
  }

  setTimeout(executorLoop, 30000);
}

executorLoop();