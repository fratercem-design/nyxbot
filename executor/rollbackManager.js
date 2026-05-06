import fs from "fs";

const checkpoints = new Map();

export function checkpoint(id, state) {
  checkpoints.set(id, {
    state: JSON.parse(JSON.stringify(state)),
    timestamp: Date.now()
  });
}

export function rollback(id) {
  const cp = checkpoints.get(id);
  if (!cp) return null;
  checkpoints.delete(id);
  return cp.state;
}

export function fileCheckpoint(id, filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, "utf-8");
    checkpoints.set(`file:${id}:${filePath}`, { content, timestamp: Date.now() });
  } catch {
    // file may not exist yet
  }
}

export function fileRollback(id, filePath) {
  const key = `file:${id}:${filePath}`;
  const cp = checkpoints.get(key);
  if (!cp) return false;
  fs.writeFileSync(filePath, cp.content, "utf-8");
  checkpoints.delete(key);
  return true;
}

export function clearCheckpoints(id) {
  for (const key of checkpoints.keys()) {
    if (key.startsWith(id) || key === id) checkpoints.delete(key);
  }
}
