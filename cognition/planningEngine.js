import axios from "axios";
import { getTopGoal, createGoal, advanceStep } from "../goals/goalManager.js";
import { getState } from "../core/runtimeState.js";
import { searchSemantic } from "../memory/semantic/semanticMemory.js";

const API_KEY = process.env.DEEPSEEK_API_KEY;

export async function plan(perception, reasoning) {
  const topGoal = getTopGoal();
  const state = getState();

  if (reasoning.decision === "pursue_goal" && topGoal) {
    const nextStep = topGoal.steps.find(s => s.status === "pending");
    if (nextStep) {
      return {
        goalId: topGoal.id,
        goalObjective: topGoal.objective,
        action: nextStep.task || nextStep.action,
        input: nextStep.input || topGoal.objective,
        source: "goal_step"
      };
    }
  }

  if (reasoning.decision === "execute_skill") {
    return {
      goalId: null,
      action: reasoning.action,
      input: reasoning.input || perception.externalInput,
      source: "reasoning"
    };
  }

  // Generate a new goal plan if we have external input and no active goal
  if (perception.hasExternalInput && !topGoal && API_KEY) {
    const steps = await generateSteps(perception.externalInput);
    if (steps.length > 0) {
      const newGoal = createGoal({
        objective: perception.externalInput,
        type: "temporary",
        priority: 6,
        steps
      });
      return {
        goalId: newGoal.id,
        goalObjective: newGoal.objective,
        action: steps[0].action,
        input: steps[0].input || perception.externalInput,
        source: "new_goal"
      };
    }
  }

  return {
    goalId: null,
    action: reasoning.action || "reflect",
    input: perception.externalInput,
    source: "fallback"
  };
}

async function generateSteps(goal) {
  try {
    const knownContext = searchSemantic(goal, 2).map(s => s.concept).join(", ");

    const res = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You create minimal, focused execution plans for an autonomous AI agent."
          },
          {
            role: "user",
            content: `Goal: "${goal}"
Known context: ${knownContext || "none"}

Return JSON: { "steps": [ { "action": "research"|"generate"|"reflect", "input": "...", "status": "pending" } ] }
Max 3 steps.`
          }
        ]
      },
      {
        headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
        timeout: 10000
      }
    );

    const parsed = JSON.parse(res.data.choices[0].message.content);
    return parsed.steps || [];
  } catch {
    return [
      { action: "research", input: goal, status: "pending" },
      { action: "generate", input: goal, status: "pending" }
    ];
  }
}
