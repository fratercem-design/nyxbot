import fs from "fs";

export default async function fileReader(task) {
  try {
    const match = task.match(/file\s+(.*)/i);
    if (!match) return "No file path";

    const filePath = match[1].trim();
    const content = fs.readFileSync(filePath, "utf-8");

    return content.slice(0, 1000);
  } catch (err) {
    return err.message;
  }
}