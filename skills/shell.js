import { exec } from "child_process";

export default function shell(task) {
  return new Promise((resolve) => {
    if (!task.command) {
      return resolve({ error: "Missing command" });
    }

    exec(task.command, (error, stdout, stderr) => {
      if (error) {
        return resolve({ error: stderr || error.message });
      }
      resolve({ success: true, output: stdout });
    });
  });
}
