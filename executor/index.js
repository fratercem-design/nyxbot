import { validate } from "./actionValidator.js";
import { runInSandbox } from "./sandbox.js";
import { evaluate } from "./outcomeEvaluator.js";
import { checkpoint, rollback, clearCheckpoints } from "./rollbackManager.js";
import { recordSkillUse } from "../memory/procedural/proceduralMemory.js";
import { advanceStep } from "../goals/goalManager.js";
import eventBus from "../core/eventBus.js";
import toolRegistry from "../toolRegistry.js";

export async function executeAction(executionPlan) {
  const { action, input, goalId, source } = executionPlan;

  const validation = validate(action, input);
  if (!validation.valid) {
    return {
      success: false,
      skill: action,
      input,
      error: validation.reason,
      durationMs: 0
    };
  }

  const tool = toolRegistry.get(action);
  if (!tool) {
    return {
      success: false,
      skill: action,
      input,
      error: `No tool registered for action: "${action}"`,
      durationMs: 0
    };
  }

  const runId = `run_${Date.now()}`;
  checkpoint(runId, { action, input, goalId });

  const startMs = Date.now();
  let output = null;
  let error = null;
  let success = false;

  try {
    output = await runInSandbox(() => tool.execute(input), tool.metadata?.timeout || 30000);
    success = true;
  } catch (err) {
    error = err.message;
    rollback(runId);
  } finally {
    clearCheckpoints(runId);
  }

  const durationMs = Date.now() - startMs;

  recordSkillUse(action, JSON.stringify({ input }), durationMs, success);

  const result = { success, skill: action, input, output, error, durationMs, source };
  const evaluation = evaluate(result);

  if (goalId && success) {
    advanceStep(goalId);
  }

  eventBus.emit("execution:complete", { result, evaluation });

  return { ...result, evaluation };
}
