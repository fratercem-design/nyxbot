const fs = require("fs");

const { loadSkills } = require("./skills/index.js");
const research = require("./skills/research.js");
const { addKnowledge } = require("./utils/memory.js");

// ---------- JSON ----------
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
function loadPlans() {
  return loadJSON("plans.json");
}

function savePlans(plans) {
  saveJSON("plans.json", plans);
}

// ---------- SKILL EXECUTION ----------
async function runSkill(task) {
  const skills = loadSkills();

  // research override
  if (task.toLowerCase().includes("research")) {
    return await research(task);
  }

  // try matching skill
  for (let name in skills) {
    if (task.toLowerCase().includes(name)) {
      console.log("[Executor] Using skill:", name);
      return await skills[name](task);
    }
  }

  console.log("[Executor] No skill matched. Using basic.");
  return await skills["basic"](task);
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

    // mark done
    step.status = "done";
    savePlans(plans);

    console.log("[Executor] Completed:", step.task);

  } catch (e) {
    console.error("[Executor] Error:", e.message);
  }

  setTimeout(executorLoop, 30000);
}

executorLoop();
