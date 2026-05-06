import db from "../memoryDB.js";

export function storeSymbol(archetype, theme, emotionalTag, intensity = 0.5, narrative = "") {
  db.prepare(`
    INSERT INTO symbolic_memory (archetype, theme, emotional_tag, intensity, narrative, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(archetype, theme, emotionalTag, intensity, narrative, Date.now());
}

export function recallByArchetype(archetype, limit = 5) {
  return db.prepare(`
    SELECT * FROM symbolic_memory
    WHERE archetype = ?
    ORDER BY intensity DESC, timestamp DESC
    LIMIT ?
  `).all(archetype, limit);
}

export function getDominantTheme() {
  return db.prepare(`
    SELECT theme, COUNT(*) as count, AVG(intensity) as avg_intensity
    FROM symbolic_memory
    WHERE timestamp > ?
    GROUP BY theme
    ORDER BY count DESC, avg_intensity DESC
    LIMIT 1
  `).get(Date.now() - 1000 * 60 * 60 * 24); // last 24h
}

export function getActiveArchetypes(limit = 3) {
  return db.prepare(`
    SELECT archetype, COUNT(*) as count, AVG(intensity) as avg_intensity
    FROM symbolic_memory
    GROUP BY archetype
    ORDER BY avg_intensity DESC, count DESC
    LIMIT ?
  `).all(limit);
}
