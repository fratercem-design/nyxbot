import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

// recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadSkills() {
  const dir = __dirname;
  const files = fs.readdirSync(dir);

  let skills = {};

  for (let file of files) {
    if (file !== "index.js" && file.endsWith(".js")) {
      const name = file.replace(".js", "");

      const modulePath = pathToFileURL(path.join(dir, file)).href;
      const mod = await import(modulePath);

      skills[name] = mod.default || mod;
    }
  }

  return skills;
}