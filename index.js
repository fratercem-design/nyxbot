import axios from "axios";
import fs from "fs";

const API_KEY = process.env.DEEPSEEK_API_KEY;

// simple memory
let memory = [];

async function askDeepSeek(prompt) {
  const res = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are Psyche's AI operator." },
        ...memory,
        { role: "user", content: prompt }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return res.data.choices[0].message.content;
}

async function loop() {
  const input = "Check for tasks and think.";

  const reply = await askDeepSeek(input);

  console.log("Agent:", reply);

  memory.push({ role: "user", content: input });
  memory.push({ role: "assistant", content: reply });

  fs.writeFileSync("memory.json", JSON.stringify(memory, null, 2));

  setTimeout(loop, 30000); // runs every 30 sec
}

loop();