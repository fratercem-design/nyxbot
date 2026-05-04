import { matchSkill } from "./skills/index.js";

export async function runAgent(task, skills, soul) {
  const steps = [];
  let current = task;

  for (let i = 0; i < 3; i++) {
    const skill = matchSkill(current, skills);
    if (!skill) break;

    const output = await skill(current);

    steps.push({
      step: i + 1,
      skill: skill.name || "unknown",
      input: current,
      output
    });

    if (typeof output === "string") {
      current = output;
    } else {
      break;
    }
  }

  const final = steps[steps.length - 1]?.output || "No result";

  return {
    final: applySoul(final, soul),
    steps
  };
}

function applySoul(output, soul) {
  if (!soul) return output;

  if (typeof output !== "string") {
    return output;
  }

  return `[Nyx] ${output}`;
}