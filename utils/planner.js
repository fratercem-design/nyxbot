const axios = require("axios");

const API_KEY = process.env.DEEPSEEK_API_KEY;

async function createPlan(goal) {
  try {
    const res = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You create step-by-step execution plans."
          },
          {
            role: "user",
            content: `
Break this goal into clear steps.

Goal:
${goal}

Return JSON:
{
  "steps": [
    { "task": "...", "type": "research" | "action" }
  ]
}
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
    console.error("PLAN ERROR:", err.message);
    return { steps: [] };
  }
}

module.exports = { createPlan };
