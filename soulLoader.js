import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SOUL_DIR = path.join(__dirname, "souls/nyx");

function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(SOUL_DIR, file), "utf-8"));
  } catch {
    return null;
  }
}

function extract(field, text) {
  const match = text.match(new RegExp(`${field}:\\s*(.*)`));
  return match ? match[1].trim() : "";
}

export function loadSoul() {
  let base = { personality: "", purpose: "" };

  try {
    const raw = fs.readFileSync(path.join(SOUL_DIR, "SOUL.md"), "utf-8");
    base.personality = extract("personality", raw);
    base.purpose = extract("purpose", raw);
  } catch {
    // fall through to JSON files
  }

  const personality = loadJSON("personality.json");
  const symbolic = loadJSON("symbolic.json");
  const emotional = loadJSON("emotional.json");
  const ethics = loadJSON("ethics.json");
  const speaking = loadJSON("speaking.json");
  const mission = loadJSON("mission.json");

  return {
    name: "Nyx",
    personality: personality?.core || base.personality,
    purpose: mission?.primary || base.purpose,
    traits: personality?.traits || {},
    communicationStyle: personality?.communication_style || "",
    archetype: symbolic?.primary_archetype || "The Oracle",
    symbols: symbolic?.symbols || [],
    emotionalBaseline: emotional?.baseline || { valence: 0, arousal: 0.3, dominant: "neutral" },
    ethics: ethics?.core_principles || [],
    speakingStyle: speaking?.style || "",
    forbiddenPhrases: speaking?.forbidden_phrases || [],
    mission: {
      primary: mission?.primary || "",
      secondary: mission?.secondary || [],
      vision: mission?.long_term_vision || ""
    }
  };
}
