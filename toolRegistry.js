import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const registry = new Map();

export function register(tool) {
  if (!tool.name || typeof tool.execute !== "function") {
    throw new Error("Tool must have a name and execute function");
  }
  registry.set(tool.name, tool);
}

export function get(name) {
  return registry.get(name) || null;
}

export function list() {
  return [...registry.values()].map(t => ({
    name: t.name,
    description: t.metadata?.description,
    permissions: t.metadata?.permissions,
    riskLevel: t.metadata?.riskLevel || "low"
  }));
}

export async function autoLoad(skillsDir = path.join(__dirname, "skills")) {
  const files = fs.readdirSync(skillsDir).filter(f => f.endsWith(".js") && f !== "index.js");

  for (const file of files) {
    try {
      const mod = await import(pathToFileURL(path.join(skillsDir, file)).href);
      const tool = mod.default;

      if (tool && tool.name && typeof tool.execute === "function") {
        register(tool);
        console.log(`[ToolRegistry] Registered: ${tool.name}`);
      } else {
        console.warn(`[ToolRegistry] Skipped ${file}: missing name or execute()`);
      }
    } catch (err) {
      console.error(`[ToolRegistry] Failed to load ${file}:`, err.message);
    }
  }
}

export default { register, get, list, autoLoad };
