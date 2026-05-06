import fs from "fs";

async function execute(input) {
  try {
    const match = String(input).match(/(?:file|read|open|load)\s+(.*)/i);
    const filePath = match ? match[1].trim() : input.trim();
    const content = fs.readFileSync(filePath, "utf-8");
    return content.slice(0, 2000);
  } catch (err) {
    return `File read error: ${err.message}`;
  }
}

export default {
  name: "fileReader",
  metadata: {
    description: "Reads the contents of a local file",
    permissions: ["filesystem"],
    inputs: ["file path or 'read file <path>' string"],
    outputs: ["file contents (up to 2000 chars)"],
    riskLevel: "low",
    timeout: 5000
  },
  execute
};
