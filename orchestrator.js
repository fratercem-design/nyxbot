import { matchSkill } from "./skills/index.js";
import { getActiveGoal, updateGoal } from "./memory.js";

export async function runAgent(task, skills, soul, memory) {
  const steps = [];

  const activeGoal = getActiveGoal(memory);

  let execution = "";

  // 🔥 if goal exists, run next step
  if (activeGoal) {
    const step = activeGoal.steps[activeGoal.currentStep];

    execution = `Executing goal step: ${step}`;

    // move forward
    activeGoal.currentStep++;

    if (activeGoal.currentStep >= activeGoal.steps.length) {
      activeGoal.status = "completed";
      execution += "\nGoal completed.";
    }

    updateGoal(memory, activeGoal);
  }

  const skill = matchSkill(task, skills, memory);

  if (!skill) {
    return { final: "No skill matched", steps: [] };
  }

  const output = await skill(task);

  steps.push({
    step: 1,
    skill: skill.name || "unknown",
    input: task,
    output
  });

  return {
    final: applyExecution(output, soul, execution, activeGoal),
    steps
  };
}

function applyExecution(output, soul, execution, goal) {
  if (typeof output !== "string") return output;

  let goalInfo = "";

  if (goal) {
    goalInfo = `Active goal: ${goal.goal}`;
  }

  return `${output}
→ ${soul?.personality || ""}
→ purpose: ${soul?.purpose || ""}
${execution}
${goalInfo}`;
}