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

  console.log("[Executor] No skill found. Generating...");
  await generateSkill(task);

  return JSON.stringify({ message: "Skill generated" });
}

// ---------- LOOP ----------
async function executorLoop() {
  try {
    console.log("[Executor] Running...");

    const plans = loadPlans();

    for (let plan of plans) {
      const step = plan.steps.find(s => s.status === "pending");

      if (step) {
        console.log("[Executor] Executing:", step.task);

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

        } catch {
          console.log("[Executor] Knowledge parse failed.");
        }

        break; // one step per cycle
      }
    }

    savePlans(plans);

  } catch (e) {
    console.error("[Executor] Loop error:", e.message);
  }

  setTimeout(executorLoop, 30000);
}

executorLoop();
