const axios = require("axios");
const fs = require("fs");

const API_KEY = process.env.DEEPSEEK_API_KEY;

// ---------- VALIDATE ----------
async function validateSkill(code, task) {
  try {
    // write temp file
    const tempFile = "./skills/_temp_test.js";
    fs.writeFileSync(tempFile, code);

    const skill = require(tempFile);

    if (typeof skill !== "function") {
      throw new Error("Not a function export");
    }

    const result = await skill(task);

    if (!result) {
      throw new Error("Empty result");
    }

    fs.unlinkSync(tempFile);

    return true;

  } catch (err) {
    console.log("Skill validation failed:", err.message);
    return false;
  }
}

// ---------- GENERATE ----------
async function generateSkill(task) {
  try {
    const res = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You generate production-ready Node.js skills."
          },
          {
            role: "user",
            content: `
Create a reusable Node.js function.

Task:
${task}

Rules:
- Must be CommonJS
- Export a single function
- No external dependencies except axios
- Must return useful output
- Keep it simple and robust

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

    // validate before saving
    const isValid = await validateSkill(code, task);

    if (!isValid) {
      console.log("Retrying skill generation...");

      // try once more with stricter prompt
      return await retrySkill(task);
    }

    const fileName =
      task.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30) + ".js";

    fs.writeFileSync(`./skills/${fileName}`, code);

    console.log("Skill created:", fileName);

  } catch (err) {
    console.error("SKILL GEN ERROR:", err.message);
  }
}

// ---------- RETRY ----------
async function retrySkill(task) {
  try {
    const res = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You fix broken Node.js code."
          },
          {
            role: "user",
            content: `
Previous attempt failed.

Create a SIMPLE working function.

Task:
${task}

Rules:
- Must export function
- Must not crash
- Return string or JSON
- Keep minimal logic

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

    const isValid = await validateSkill(code, task);

    if (!isValid) {
      console.log("Skill failed twice. Skipping.");
      return;
    }

    const fileName =
      "fixed_" +
      task.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 25) + ".js";

    fs.writeFileSync(`./skills/${fileName}`, code);

    console.log("Fixed skill created:", fileName);

  } catch (err) {
    console.error("RETRY ERROR:", err.message);
  }
}

module.exports = { generateSkill };
