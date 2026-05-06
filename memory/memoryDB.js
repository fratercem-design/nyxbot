import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../data");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "nyx.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS episodic_memory (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT    NOT NULL,
    content     TEXT    NOT NULL,
    source      TEXT    DEFAULT 'system',
    emotional_weight  REAL DEFAULT 0.0,
    relevance_score   REAL DEFAULT 1.0,
    recurrence_count  INTEGER DEFAULT 1,
    decay_factor      REAL DEFAULT 1.0,
    tags        TEXT    DEFAULT '[]',
    timestamp   INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS semantic_memory (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    concept     TEXT    NOT NULL UNIQUE,
    definition  TEXT,
    relationships TEXT DEFAULT '{}',
    confidence  REAL    DEFAULT 1.0,
    source      TEXT,
    timestamp   INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS procedural_memory (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_name    TEXT    NOT NULL UNIQUE,
    procedure     TEXT    NOT NULL,
    success_count INTEGER DEFAULT 0,
    fail_count    INTEGER DEFAULT 0,
    avg_duration_ms INTEGER DEFAULT 0,
    last_used     INTEGER,
    timestamp     INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS symbolic_memory (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    archetype   TEXT    NOT NULL,
    theme       TEXT,
    emotional_tag TEXT,
    intensity   REAL    DEFAULT 0.5,
    narrative   TEXT,
    timestamp   INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reflections (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    trigger_event   TEXT,
    summary         TEXT    NOT NULL,
    failures        TEXT    DEFAULT '[]',
    improvements    TEXT    DEFAULT '[]',
    lessons         TEXT    DEFAULT '[]',
    emotional_impact REAL   DEFAULT 0.0,
    cycle_number    INTEGER DEFAULT 0,
    timestamp       INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS goals (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    objective       TEXT    NOT NULL,
    type            TEXT    DEFAULT 'primary',
    priority        INTEGER DEFAULT 5,
    status          TEXT    DEFAULT 'active',
    dependencies    TEXT    DEFAULT '[]',
    steps           TEXT    DEFAULT '[]',
    completion_pct  REAL    DEFAULT 0.0,
    emotional_weight REAL   DEFAULT 0.5,
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL,
    completed_at    INTEGER
  );

  CREATE TABLE IF NOT EXISTS world_state (
    key         TEXT    PRIMARY KEY,
    value       TEXT    NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_episodic_timestamp ON episodic_memory(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_episodic_type ON episodic_memory(type);
  CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
  CREATE INDEX IF NOT EXISTS idx_goals_priority ON goals(priority DESC);
`);

export default db;
