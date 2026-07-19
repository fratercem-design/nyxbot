import db from "../memoryDB.js";

export function storeConcept(concept, definition, relationships = {}, source = "inference") {
  db.prepare(`
    INSERT INTO semantic_memory (concept, definition, relationships, confidence, source, timestamp)
    VALUES (?, ?, ?, 1.0, ?, ?)
    ON CONFLICT(concept) DO UPDATE SET
      definition  = excluded.definition,
      relationships = excluded.relationships,
      confidence  = MIN(confidence + 0.1, 1.0),
      timestamp   = excluded.timestamp
  `).run(concept, definition, JSON.stringify(relationships), source, Date.now());
}

export function recall(concept) {
  const row = db.prepare("SELECT * FROM semantic_memory WHERE concept = ?").get(concept);
  if (!row) return null;
  return { ...row, relationships: JSON.parse(row.relationships || "{}") };
}

export function searchSemantic(query, limit = 5) {
  return db.prepare(`
    SELECT * FROM semantic_memory
    WHERE concept LIKE ? OR definition LIKE ?
    ORDER BY confidence DESC
    LIMIT ?
  `).all(`%${query}%`, `%${query}%`, limit)
    .map(r => ({ ...r, relationships: JSON.parse(r.relationships || "{}") }));
}

export function getTopConcepts(limit = 10) {
  return db.prepare(`
    SELECT * FROM semantic_memory ORDER BY confidence DESC LIMIT ?
  `).all(limit).map(r => ({ ...r, relationships: JSON.parse(r.relationships || "{}") }));
}
