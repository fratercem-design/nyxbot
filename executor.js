import fs from "fs";

import { loadSkills } from "./skills/index.js";
import research from "./skills/research.js";
import { generateContent } from "./utils/contentEngine.js";
import { addKnowledge } from "./utils/memory.js";
import { publishLatest } from "./utils/publisher.js";
import { classifyIntent } from "./utils/router.js";

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

function loadPlans() {
  return loadJSON("plans.json");
}

function savePlans(plans) {
  saveJSON("plans.json", plans);
}

async function runSkill(task) {
  const skills = await loadSkills();
  const lower = task.toLowerCase();

  if (
    lower.includes("write") ||
    lower.includes("content") ||
    lower.includes("post")
  ) {
    console.log("[Executor] Generating content...");
    return await generateContent(task);
  }

  if (lower.includes("research")) {
    return await research(task);
  }

  const intent = classifyIntent(task);
  const skill = skills[intent] || skills.basic;

  if (skill) {
    console.log("[Executor] Using skill:", intent);
    return await skill(task);
  }

  console.log("[Executor] No skill matched.");
  return JSON.stringify({ message: "No action taken" });
}

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

    step.status = "running";
    savePlans(plans);

    const result = await runSkill(step.task);

    console.log("[Executor] Result:", result);

    try {
      const parsed = JSON.parse(result);
      if (Array.isArray(parsed)) {
        addKnowledge(parsed, step.task);
        console.log("[Memory] Stored knowledge");
      }
    } catch {
      console.log("[Memory] Skipped (not JSON)");
    }

    try {
      if (step.task.toLowerCase().includes("write")) {
        publishLatest();
      }
    } catch {
      console.log("[Publish] Skipped");
    }

    step.status = "done";
    savePlans(plans);

    console.log("[Executor] Completed:", step.task);
  } catch (e) {
    console.error("[Executor] Error:", e);
  }

  setTimeout(executorLoop, 30000);
}

executorLoop();
