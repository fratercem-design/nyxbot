export function classifyIntent(task) {
  const t = task.toLowerCase();

  if (t.includes("research") || t.includes("find")) return "research";
  if (t.includes("file") || t.includes("open")) return "file";
  if (t.includes("write") || t.includes("create")) return "write";
  if (t.includes("analyze") || t.includes("compare")) return "analyze";

  return "basic";
}