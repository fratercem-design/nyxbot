import axios from "axios";
import { searchSemantic } from "../memory/semantic/semanticMemory.js";

const API_KEY = process.env.DEEPSEEK_API_KEY;

async function execute(input) {
  const topic = typeof input === "string"
    ? input.replace(/^(write|create|generate|draft)\s*/i, "").trim()
    : String(input);

  const memCtx = searchSemantic(topic, 3).map(s => `${s.concept}: ${s.definition}`).join("\n");

  if (!API_KEY) {
    return `[Generated] Topic: ${topic}\n\nThis is a placeholder output. Set DEEPSEEK_API_KEY to enable LLM generation.\nKnown context:\n${memCtx || "none"}`;
  }

  try {
    const res = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You generate high-quality, concise content." },
          {
            role: "user",
            content: `Create content about: "${topic}"\n\nKnown context:\n${memCtx || "none"}\n\nBe direct, insightful, and specific.`
          }
        ]
      },
      {
        headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
        timeout: 20000
      }
    );
    return res.data.choices[0].message.content.trim();
  } catch (err) {
    return `Generation error: ${err.message}`;
  }
}

export default {
  name: "generate",
  metadata: {
    description: "Generates content using LLM, informed by semantic memory",
    permissions: ["llm"],
    inputs: ["topic or prompt"],
    outputs: ["generated text"],
    riskLevel: "low",
    timeout: 25000
  },
  execute
};
