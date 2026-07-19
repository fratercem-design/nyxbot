const path = require("path");
const { save } = require("./memory/memoryStore");
const logger = require("./utils/logger");

const SKILLS_DIR = path.join(__dirname, "skills");

function loadSkill(name) {
  try {
    return require(path.join(SKILLS_DIR, `${name}.js`));
  } catch (err) {
    throw new Error(`Skill "${name}" not found: ${err.message}`);
  }
}

async function executePlan(plan) {
  logger.log(`[Executor] Starting execution: "${plan.goal}"`);

  const results = [];
  let lastOutput = plan.goal;

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];
    logger.log(`[Executor] Step ${i + 1}/${plan.steps.length}: ${step.action}`);

    let skill;
    try {
      skill = loadSkill(step.action);
    } catch (err) {
      logger.error(err.message);
      results.push({ step: step.action, error: err.message });
      continue;
    }

    try {
      // Chained steps receive the previous step's output as input
      const input = step.chained ? lastOutput : step.input;

      const output = await skill(input);

      const memoryKey = `${step.action}_${Date.now()}`;
      save(memoryKey, { goal: plan.goal, input, output });

      logger.log(`[Executor] Step done: ${step.action} → ${JSON.stringify(output).slice(0, 80)}...`);

      results.push({ step: step.action, input, output });

      // Pass structured output forward if it's an object; otherwise stringify
      lastOutput = typeof output === "object" ? output : String(output);

    } catch (err) {
      logger.error(`Step "${step.action}" failed: ${err.message}`);
      results.push({ step: step.action, error: err.message });
    }
  }

  const finalResult = {
    goal: plan.goal,
    steps: results,
    final: lastOutput
  };

  save(`result_${Date.now()}`, finalResult);

  logger.log(`[Executor] Execution complete for: "${plan.goal}"`);

  return finalResult;
}

module.exports = { executePlan };
