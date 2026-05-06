import { exec } from "child_process";

export default function shell(task) {
  return new Promise((resolve) => {
    const command = typeof task === "string" ? task : task.command;

    if (!command) {
      return resolve({ error: "Missing command" });
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        return resolve({ error: stderr || error.message });
      }
      resolve({ success: true, output: stdout });
    });
  });
}
