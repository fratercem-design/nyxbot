const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.DEEPSEEK_API_KEY;

function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch {
    return [];
  }
}

function getTopKnowledge(limit = 5) {
  const knowledge = loadJSON("knowledge.json");
  return knowledge.slice(-limit);
}

function buildPrompt(topic, knowledge) {
  return `
You are a high-level content creator.

Topic:
${topic}

Knowledge:
${JSON.stringify(knowledge, null, 2)}

Create structured content:

Return JSON:
{
  "title": "...",
  "summary": "...",
  "content": "...",
  "bullets": ["...", "..."],
  "call_to_action": "..."
}

Rules:
- Clear, valuable, and original
- No fluff
- Actionable insights
`;
}

async function generateContent(task) {
  try {
    const knowledge = getTopKnowledge(5);

    const res = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You generate high-quality content." },
          { role: "user", content: buildPrompt(task, knowledge) }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const output = JSON.parse(res.data.choices[0].message.content);

    // ---------- SAVE FILE ----------
    const fileName =
      task.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 40) + ".json";

    const filePath = path.join("outputs", fileName);

    fs.writeFileSync(filePath, JSON.stringify(output, null, 2));

    console.log("[Content] Saved:", filePath);

    return JSON.stringify(output);

  } catch (err) {
    console.error("CONTENT ERROR:", err.message);
    return JSON.stringify({ error: "Content generation failed" });
  }
}

module.exports = { generateContent };
