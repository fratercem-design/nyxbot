import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { loadSkills } from "./skills/index.js";
import { runAgent } from "./orchestrator.js";
import { loadSoul } from "./soulLoader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const skills = await loadSkills();
const soul = loadSoul();

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const result = await runAgent(message, skills, soul);
    res.json(result);
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});