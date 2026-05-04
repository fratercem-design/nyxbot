import fs from "fs";

export function loadSoul() {
  try {
    const raw = fs.readFileSync("./souls/nyx/SOUL.md", "utf-8");

    return {
      raw,
      personality: extract("personality", raw),
      tone: extract("tone", raw),
      purpose: extract("purpose", raw)
    };
  } catch (err) {
    console.error("[SOUL LOAD ERROR]", err.message);
    return null;
  }
}

function extract(field, text) {
  const match = text.match(new RegExp(`${field}: (.*)`));
  return match ? match[1] : "";
}