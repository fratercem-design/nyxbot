const fs = require("fs");

function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch {
    return [];
  }
}

function executorLoop() {
  console.log("[Executor] Running...");

  const plans = loadJSON("plans.json");

  console.log("[Executor] Plans:", plans.length);

  setTimeout(executorLoop, 30000);
}

executorLoop();
