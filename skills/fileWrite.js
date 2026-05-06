import fs from "fs/promises";

export default async function fileWrite(task) {
  const filePath = typeof task === "string" ? task.path : task.path;
  const content = typeof task === "string" ? task.content : task.content;

  if (typeof task === "string") {
    const pathMatch = task.match(/(?:write|save)\s+(?:to\s+)?(\S+)/i);
    if (!pathMatch) return { error: "Missing file path in task" };

    await fs.writeFile(pathMatch[1], task, "utf-8");
    return { success: true, message: `File written: ${pathMatch[1]}` };
  }

  if (!filePath || !content) {
    return { error: "Missing path or content" };
  }

  await fs.writeFile(filePath, content, "utf-8");
  return { success: true, message: `File written: ${filePath}` };
}
