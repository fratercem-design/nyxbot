import fs from "fs/promises";

async function execute(input) {
  if (typeof input === "object" && input.path && input.content) {
    await fs.writeFile(input.path, input.content, "utf-8");
    return `File written: ${input.path}`;
  }

  const match = String(input).match(/(?:write|save)\s+(?:to\s+)?(\S+)\s+(.+)/is);
  if (!match) return "fileWrite: provide { path, content } or 'write to <path> <content>'";

  await fs.writeFile(match[1], match[2], "utf-8");
  return `File written: ${match[1]}`;
}

export default {
  name: "fileWrite",
  metadata: {
    description: "Writes content to a local file",
    permissions: ["filesystem"],
    inputs: ["{ path, content } or 'write to <path> <content>'"],
    outputs: ["success message"],
    riskLevel: "medium",
    timeout: 10000
  },
  execute
};
