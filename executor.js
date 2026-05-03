const fs = require("fs");

const { loadSkills } = require("./skills/index.js");
const { generateSkill } = require("./utils/skillGenerator.js");
const { research } = require("./skills/research.js");
const { cleanAndRank } = require("./utils/knowledge.js");
const { addToVector } = require("./utils/vector.js");

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

function loadPlans() {
  return loadJSON("plans.json");
}

function savePlans(plans) {
  saveJSON("plans.json", plans);
}

function loadKnowledge() {
  return loadJSON("knowledge.json");
}

function saveKnowledge(data) {
  saveJSON("knowledge.json", data);
}

// ---------- SKILL EXECUTION ----------
async function runSkill(task) {
  const skills = loadSkills();

  for (let name in skills) {
    if (task.toLowerCase().includes(name)) {
      try {
        console.log("[Executor] Using skill:", name);
        return await skills[name](task);
      } catch {
        console.log("[Executor] Skill failed. Regenerating:", name);
        await generateSkill(task);
      }
    }
  }

  if (task.toLowerCase().includes("research")) {
    return await research(task);
  }

  console.log("[Executor] Generating new skill...");
  await generateSkill(task);

  return JSON.stringify({ message: "Skill generated" });
}

// ---------- PICK NEXT STEP ----------
function getNextStep(plans) {
  const now = Date.now();

  let candidates = [];

  for (let plan of plans) {
    for (let step of plan.steps) {
      if (
        step.status === "pending" &&
        step.run_at <= now
      ) {
        candidates.push({ plan, step });
      }
    }
  }

  // sort by priority
  candidates.sort((a, b) => b.step.priority - a.step.priority);

  return candidates[0];
}

// ---------- LOOP ----------
async function executorLoop() {
  try {
    console.log("[Executor] Running...");

    const plans = loadPlans();

    const next = getNextStep(plans);

    if (!next) {
      console.log("[Executor] No ready tasks.");
      return setTimeout(executorLoop, 30000);
    }

    const { plan, step } = next;

    console.log("[Executor] Executing:", step.task);

    step.status = "running";

    try {
      const result = await runSkill(step.task);

      console.log("[Executor] Result:", result);

      step.status = "done";

      // ---------- STORE KNOWLEDGE ----------
      try {
        const parsed = JSON.parse(result);
        const knowledge = loadKnowledge();

        for (let item of parsed) {
          const entry = {
            topic: step.task,
            source: item.url,
            insights: item.summary.insights,
            facts: item.summary.facts,
            actions: item.summary.actions,
            timestamp: Date.now()
          };

          knowledge.push(entry);
          await addToVector(entry);
        }

        saveKnowledge(cleanAndRank(knowledge));

      } catch {}

    } catch (err) {
      console.log("[Executor] Step failed:", err.message);

      step.retries += 1;

      if (step.retries >= 3) {
        step.status = "failed";
      } else {
        step.status = "pending";
        step.run_at = Date.now() + 60000 * step.retries; // retry delay
      }
    }

    savePlans(plans);

  } catch (e) {
    console.error("[Executor] Loop error:", e.message);
  }

  setTimeout(executorLoop, 30000);
}

executorLoop();
