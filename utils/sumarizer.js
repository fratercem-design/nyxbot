const axios = require("axios");
const { searchKnowledge } = require("./memory.js");

const API_KEY = process.env.DEEPSEEK_API_KEY;

async function summarize(text, topic) {
  try {
    // ---------- GET MEMORY ----------
    const memory = searchKnowledge(topic);

    const res = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You extract useful knowledge and build on prior memory."
          },
          {
            role: "user",
            content: `
You are analyzing new information.

Topic:
${topic}

Previous knowledge:
${JSON.stringify(memory, null, 2)}

New content:
${text.slice(0, 4000)}

Return JSON:
{
  "insights": ["..."],
  "facts": ["..."],
  "actions": ["..."]
}

Rules:
- Build on previous knowledge if relevant
- Avoid repeating past insights
- Focus on new value
- Be concise
`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return JSON.parse(res.data.choices[0].message.content);

  } catch (err) {
    console.error("[Summarizer] Error:", err.message);

    return {
      insights: [],
      facts: [],
      actions: []
    };
  }
}

module.exports = { summarize };
