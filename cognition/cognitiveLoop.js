import { perceive } from "./perceptionEngine.js";
import { reason } from "./reasoningEngine.js";
import { plan } from "./planningEngine.js";
import { reflect } from "./reflectionEngine.js";
import { processSymbolicContext } from "./symbolicEngine.js";
import { decayToNeutral } from "./emotionalEngine.js";
import { executeAction } from "../executor/index.js";
import { getState, setState, incrementCycle } from "../core/runtimeState.js";
import { applyDecay } from "../memory/episodic/episodicMemory.js";
import eventBus from "../core/eventBus.js";

const CYCLE_INTERVAL_MS = parseInt(process.env.CYCLE_INTERVAL_MS || "60000"); // 1 min default
const DECAY_EVERY_N_CYCLES = 10;

let running = false;
let loopTimer = null;

export async function startLoop() {
  if (running) return;
  running = true;
  setState({ online: true });
  console.log("[CognitiveLoop] Starting autonomous cognition loop");
  eventBus.emit("loop:started");
  scheduleNext(0);
}

export function stopLoop() {
  running = false;
  if (loopTimer) clearTimeout(loopTimer);
  setState({ online: false });
  eventBus.emit("loop:stopped");
  console.log("[CognitiveLoop] Loop stopped");
}

export async function triggerCycle(externalInput = null) {
  // Force an immediate cycle with optional external input (from chat, webhook, etc.)
  return await runCycle(externalInput);
}

function scheduleNext(delay = CYCLE_INTERVAL_MS) {
  if (!running) return;
  loopTimer = setTimeout(async () => {
    await runCycle(null);
    scheduleNext();
  }, delay);
}

async function runCycle(externalInput) {
  const cycleNum = incrementCycle();
  const cycleId = `cycle_${cycleNum}`;

  eventBus.emit("cycle:start", { cycle: cycleNum, hasInput: !!externalInput });

  let executionResult = null;

  try {
    // ── 1. OBSERVE ────────────────────────────────────────────
    const perception = await perceive(externalInput);
    setState({ lastPerception: perception });

    // ── 2. SYMBOLIC CONTEXT ───────────────────────────────────
    processSymbolicContext(perception);

    // ── 3. REASON ─────────────────────────────────────────────
    const reasoning = await reason(perception, externalInput);

    // ── 4. PLAN ───────────────────────────────────────────────
    const executionPlan = await plan(perception, reasoning);

    eventBus.emit("cycle:planned", { cycle: cycleNum, plan: executionPlan });

    // ── 5. EXECUTE ────────────────────────────────────────────
    if (executionPlan.action && executionPlan.action !== "reflect") {
      executionResult = await executeAction(executionPlan);
      eventBus.emit("cycle:executed", { cycle: cycleNum, result: executionResult });
    }

    // ── 6. REFLECT ────────────────────────────────────────────
    const reflection = reflect(executionResult);
    setState({ lastReflection: reflection });

    // ── 7. DECAY / MAINTENANCE (every N cycles) ───────────────
    if (cycleNum % DECAY_EVERY_N_CYCLES === 0) {
      applyDecay();
      decayToNeutral(0.03);
    }

    // ── 8. UPDATE STATE ───────────────────────────────────────
    setState({
      activeGoal: executionPlan.goalObjective || null,
      metrics: {
        ...getState().metrics,
        tasksCompleted: getState().metrics.tasksCompleted + (executionResult?.success ? 1 : 0),
        tasksFailed: getState().metrics.tasksFailed + (executionResult && !executionResult.success ? 1 : 0),
        reflections: getState().metrics.reflections + 1
      }
    });

    eventBus.emit("cycle:complete", {
      cycle: cycleNum,
      success: executionResult?.success ?? true,
      action: executionPlan.action,
      output: executionResult?.output
    });

    return {
      cycle: cycleNum,
      perception,
      reasoning,
      executionPlan,
      executionResult,
      reflection
    };

  } catch (err) {
    console.error(`[CognitiveLoop] Cycle ${cycleNum} error:`, err.message);
    eventBus.emit("cycle:error", { cycle: cycleNum, error: err.message });
    return { cycle: cycleNum, error: err.message };
  }
}
