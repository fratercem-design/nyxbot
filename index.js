const axios = require("axios");
const fs = require("fs");

const API_KEY = process.env.DEEPSEEK_API_KEY;

async function generateSkill(task) {
  try {
    const res = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You generate reusable Node.js functions as skills."
          },
          {
            role: "user",
            content: `
Create a reusable JavaScript function for this task:

${task}

Rules:
- Must be CommonJS (module.exports)
- Function name = short and clear
- No external dependencies except axios if needed
- Return a string or JSON

Return ONLY code.
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

    const code = res.data.choices[0].message.content;

    const fileName =
      task.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30) + ".js";

    fs.writeFileSync(`./skills/${fileName}`, code);

    console.log("New skill created:", fileName);

  } catch (err) {
    console.error("SKILL GEN ERROR:", err.message);
  }
}

module.exports = { generateSkill };
