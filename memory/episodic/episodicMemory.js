import db from "../memoryDB.js";

const insert = db.prepare(`
  INSERT INTO episodic_memory (type, content, source, emotional_weight, relevance_score, tags, timestamp)
  VALUES (@type, @content, @source, @emotional_weight, @relevance_score, @tags, @timestamp)
`);

const decayUpdate = db.prepare(`
  UPDATE episodic_memory
  SET decay_factor = decay_factor * 0.98, relevance_score = relevance_score * decay_factor
  WHERE timestamp < @cutoff
`);

const incrRecurrence = db.prepare(`
  UPDATE episodic_memory SET recurrence_count = recurrence_count + 1 WHERE id = @id
`);

export function storeEpisode(episode) {
  return insert.run({
    type: episode.type || "event",
    content: typeof episode.content === "string"
      ? episode.content
      : JSON.stringify(episode.content),
    source: episode.source || "system",
    emotional_weight: episode.emotionalWeight ?? 0,
    relevance_score: episode.relevanceScore ?? 1.0,
    tags: JSON.stringify(episode.tags || []),
    timestamp: Date.now()
  });
}

export function recallRecent(limit = 10, type = null) {
  const base = `SELECT * FROM episodic_memory ${type ? "WHERE type = ?" : ""} ORDER BY timestamp DESC LIMIT ?`;
  const stmt = db.prepare(base);
  const rows = type ? stmt.all(type, limit) : stmt.all(limit);
  return rows.map(deserialize);
}

export function recallByEmotionalWeight(minWeight = 0.5, limit = 5) {
  return db.prepare(`
    SELECT * FROM episodic_memory
    WHERE emotional_weight >= ?
    ORDER BY emotional_weight DESC, timestamp DESC
    LIMIT ?
  `).all(minWeight, limit).map(deserialize);
}

export function searchEpisodic(query, limit = 5) {
  return db.prepare(`
    SELECT * FROM episodic_memory
    WHERE content LIKE ?
    ORDER BY relevance_score DESC, timestamp DESC
    LIMIT ?
  `).all(`%${query}%`, limit).map(deserialize);
}

export function applyDecay() {
  const cutoff = Date.now() - 1000 * 60 * 60 * 6; // older than 6 hours
  decayUpdate.run({ cutoff });
}

function deserialize(row) {
  return {
    ...row,
    tags: JSON.parse(row.tags || "[]"),
    content: tryParse(row.content)
  };
}

function tryParse(str) {
  try { return JSON.parse(str); } catch { return str; }
}
