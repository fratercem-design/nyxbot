import db from "../memory/memoryDB.js";
import eventBus from "../core/eventBus.js";

const TYPES = ["primary", "secondary", "temporary", "interrupted", "abandoned"];

export function createGoal(goal) {
  const now = Date.now();
  const result = db.prepare(`
    INSERT INTO goals
      (objective, type, priority, status, dependencies, steps, completion_pct, emotional_weight, created_at, updated_at)
    VALUES
      (@objective, @type, @priority, 'active', @dependencies, @steps, 0, @emotional_weight, @created_at, @updated_at)
  `).run({
    objective: goal.objective,
    type: goal.type || "secondary",
    priority: goal.priority ?? 5,
    dependencies: JSON.stringify(goal.dependencies || []),
    steps: JSON.stringify(goal.steps || []),
    emotional_weight: goal.emotionalWeight ?? 0.5,
    created_at: now,
    updated_at: now
  });

  const created = getGoal(result.lastInsertRowid);
  eventBus.emit("goal:created", created);
  return created;
}

export function getGoal(id) {
  const row = db.prepare("SELECT * FROM goals WHERE id = ?").get(id);
  return row ? deserialize(row) : null;
}

export function getActive() {
  return db.prepare(`
    SELECT * FROM goals WHERE status = 'active' ORDER BY priority DESC, emotional_weight DESC
  `).all().map(deserialize);
}

export function getByType(type) {
  return db.prepare("SELECT * FROM goals WHERE type = ? ORDER BY priority DESC").all(type).map(deserialize);
}

export function getTopGoal() {
  const row = db.prepare(`
    SELECT * FROM goals WHERE status = 'active' ORDER BY priority DESC, emotional_weight DESC LIMIT 1
  `).get();
  return row ? deserialize(row) : null;
}

export function updateProgress(id, pct) {
  const clamped = Math.max(0, Math.min(100, pct));
  db.prepare(`
    UPDATE goals SET completion_pct = ?, updated_at = ? WHERE id = ?
  `).run(clamped, Date.now(), id);

  if (clamped >= 100) completeGoal(id);
}

export function advanceStep(id) {
  const goal = getGoal(id);
  if (!goal) return;

  const steps = goal.steps;
  const currentIdx = steps.findIndex(s => s.status === "pending");
  if (currentIdx === -1) return;

  steps[currentIdx].status = "done";
  steps[currentIdx].completedAt = Date.now();

  const done = steps.filter(s => s.status === "done").length;
  const pct = (done / steps.length) * 100;

  db.prepare(`
    UPDATE goals SET steps = ?, completion_pct = ?, updated_at = ? WHERE id = ?
  `).run(JSON.stringify(steps), pct, Date.now(), id);

  if (pct >= 100) completeGoal(id);
}

export function completeGoal(id) {
  db.prepare(`
    UPDATE goals SET status = 'completed', completion_pct = 100, completed_at = ?, updated_at = ? WHERE id = ?
  `).run(Date.now(), Date.now(), id);
  eventBus.emit("goal:completed", { id });
}

export function interruptGoal(id) {
  db.prepare(`
    UPDATE goals SET status = 'interrupted', updated_at = ? WHERE id = ?
  `).run(Date.now(), id);
}

export function abandonGoal(id) {
  db.prepare(`
    UPDATE goals SET status = 'abandoned', updated_at = ? WHERE id = ?
  `).run(Date.now(), id);
}

export function getAllByStatus(status) {
  return db.prepare("SELECT * FROM goals WHERE status = ? ORDER BY updated_at DESC").all(status).map(deserialize);
}

function deserialize(row) {
  return {
    ...row,
    dependencies: JSON.parse(row.dependencies || "[]"),
    steps: JSON.parse(row.steps || "[]")
  };
}
