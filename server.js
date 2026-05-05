import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { loadSkills } from "./skills/index.js";
import { runAgent } from "./orchestrator.js";
import { loadSoul } from "./soulLoader.js";
import { loadMemory, addMemory } from "./memory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const skills = await loadSkills();
const soul = loadSoul();
const memory = loadMemory();

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ error: "No message provided" });
  }

  try {
    const result = await runAgent(message, skills, soul, memory);

    addMemory(memory, {
      input: message,
      output: result.final
    });

    res.json(result);

  } catch (err) {
    console.error(err);
    res.json({ error: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] Running on port ${PORT}`);
});