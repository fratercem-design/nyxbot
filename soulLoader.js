import fs from "fs";

export function loadSoul() {
  try {
    const raw = fs.readFileSync("./souls/nyx/SOUL.md", "utf-8");

    return {
      personality: extract("personality", raw),
      purpose: extract("purpose", raw)
    };
  } catch (err) {
    console.error("[SOUL ERROR]", err.message);
    return null;
  }
}

function extract(field, text) {
  const match = text.match(new RegExp(`${field}: (.*)`));
  return match ? match[1].trim() : "";
}