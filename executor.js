const fs = require("fs");

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

    // simulate work (no AI yet)
    await new Promise(resolve => setTimeout(resolve, 2000));

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
