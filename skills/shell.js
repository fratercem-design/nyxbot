import { exec } from "child_process";

async function execute(input) {
  const command = typeof input === "object" ? input.command : String(input);
  if (!command) return { error: "Missing command" };

  return new Promise(resolve => {
    exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
      if (error) return resolve({ error: stderr || error.message });
      resolve({ success: true, output: stdout });
    });
  });
}

export default {
  name: "shell",
  metadata: {
    description: "Executes shell commands (requires ALLOW_SHELL=true)",
    permissions: ["shell"],
    inputs: ["command string or { command }"],
    outputs: ["{ success, output } or { error }"],
    riskLevel: "high",
    timeout: 15000
  },
  execute
};
