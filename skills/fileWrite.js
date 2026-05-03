import fs from "fs/promises";

export default async function fileWrite(task) {
  const { path, content } = task;

  if (!path || !content) {
    return { error: "Missing path or content" };
  }

  await fs.writeFile(path, content, "utf-8");

  return { success: true, message: `File written: ${path}` };
}
