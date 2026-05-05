import fs from "fs";

const FILE = "./memory.json";

export function loadMemory() {
  try {
    if (!fs.existsSync(FILE)) return createEmpty();
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
  } catch {
    return createEmpty();
  }
}

export function saveMemory(memory) {
  fs.writeFileSync(FILE, JSON.stringify(memory, null, 2));
}

export function addMemory(memory, entry) {
  const type = classify(entry.input);

  memory[type].push({
    ...entry,
    time: Date.now()
  });

  detectGoal(memory, entry.input);

  saveMemory(memory);
}

export function getActiveGoal(memory) {
  return memory.goals.find(g => g.status === "active");
}

export function updateGoal(memory, goal) {
  const index = memory.goals.findIndex(g => g.goal === goal.goal);
  if (index !== -1) {
    memory.goals[index] = goal;
    saveMemory(memory);
  }
}

// ------------------------

function detectGoal(memory, input) {
  const t = input.toLowerCase();

  if (t.includes("build") || t.includes("create") || t.includes("develop")) {
    memory.goals.push({
      goal: input,
      status: "active",
      steps: generateSteps(input),
      currentStep: 0,
      created: Date.now()
    });
  }

  memory.goals = dedupe(memory.goals);
}

function generateSteps(goal) {
  return [
    "define objective",
    "research requirements",
    "design structure",
    "implement core system",
    "test and refine"
  ];
}

function dedupe(goals) {
  const seen = new Set();
  return goals.filter(g => {
    if (seen.has(g.goal)) return false;
    seen.add(g.goal);
    return true;
  });
}

function classify(input) {
  const t = input.toLowerCase();

  if (t.includes("research")) return "knowledge";
  if (t.includes("file")) return "files";

  return "conversations";
}

function createEmpty() {
  return {
    conversations: [],
    knowledge: [],
    files: [],
    goals: []
  };
}