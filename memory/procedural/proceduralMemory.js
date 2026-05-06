import db from "../memoryDB.js";

export function recordSkillUse(skillName, procedure, durationMs, success) {
  const existing = db.prepare("SELECT * FROM procedural_memory WHERE skill_name = ?").get(skillName);

  if (!existing) {
    db.prepare(`
      INSERT INTO procedural_memory
        (skill_name, procedure, success_count, fail_count, avg_duration_ms, last_used, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      skillName,
      procedure,
      success ? 1 : 0,
      success ? 0 : 1,
      durationMs,
      Date.now(),
      Date.now()
    );
  } else {
    const total = existing.success_count + existing.fail_count + 1;
    const newAvg = Math.round(
      (existing.avg_duration_ms * (total - 1) + durationMs) / total
    );
    db.prepare(`
      UPDATE procedural_memory SET
        success_count = success_count + ?,
        fail_count    = fail_count + ?,
        avg_duration_ms = ?,
        last_used     = ?
      WHERE skill_name = ?
    `).run(
      success ? 1 : 0,
      success ? 0 : 1,
      newAvg,
      Date.now(),
      skillName
    );
  }
}

export function getSkillStats(skillName) {
  return db.prepare("SELECT * FROM procedural_memory WHERE skill_name = ?").get(skillName);
}

export function getMostReliableSkills(limit = 5) {
  return db.prepare(`
    SELECT *, CAST(success_count AS REAL) / (success_count + fail_count + 1) AS reliability
    FROM procedural_memory
    ORDER BY reliability DESC
    LIMIT ?
  `).all(limit);
}
