import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { searchKnowledge } from "./memory.js";

const API_KEY = process.env.DEEPSEEK_API_KEY;

// recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ensure outputs folder
const OUTPUT_DIR = path.join(__dirname, "..", "outputs");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ---------- BUILD PROMPT ----------
function buildPrompt(topic, memory) {
  return `
You are a high-level content creator.

Topic:
${topic}

Accumulated knowledge:
${JSON.stringify(memory, null, 2)}

Create high-value content.

Return JSON:
{
  "title": "...",
  "summary": "...",
  "content": "...",
  "bullets": ["...", "..."],
  "call_to_action": "..."
}

Rules:
- Use accumulated knowledge
- Avoid repetition
- Provide original insight
- Be clear and useful
`;
}

// ---------- GENERATE ----------
export async function generateContent(task) {
  try {
    const topic = task
      .replace("write", "")
      .replace("content", "")
      .trim();

    const memory = searchKnowledge(topic);

    const res = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You generate high-quality content from knowledge.",
          },
          {
            role: "user",
            content: buildPrompt(topic, memory),
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const output = JSON.parse(res.data.choices[0].message.content);

    const fileName =
      topic.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 40) + ".json";

    const filePath = path.join(OUTPUT_DIR, fileName);

    fs.writeFileSync(filePath, JSON.stringify(output, null, 2));

    console.log("[Content] Saved:", filePath);

    return JSON.stringify(output);
  } catch (err) {
    console.error("[Content] Error:", err.response?.data || err.message);

    return JSON.stringify({
      error: "Content generation failed",
    });
  }
}