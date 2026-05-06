import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_FILE = path.join(__dirname, "../../data/vectors.json");

let store = loadStore();

function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveStore() {
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
}

// TF-IDF style sparse vector from text
function vectorize(text) {
  const tokens = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 2);

  const freq = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;

  const len = tokens.length || 1;
  const vec = {};
  for (const [term, count] of Object.entries(freq)) {
    vec[term] = count / len;
  }
  return vec;
}

function cosineSimilarity(a, b) {
  const keysA = Object.keys(a);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const k of keysA) {
    dot += (a[k] || 0) * (b[k] || 0);
    normA += a[k] ** 2;
  }
  for (const v of Object.values(b)) normB += v ** 2;

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function addVector(id, text, metadata = {}) {
  const existing = store.findIndex(e => e.id === id);
  const entry = { id, text, vector: vectorize(text), metadata, timestamp: Date.now() };

  if (existing !== -1) {
    store[existing] = entry;
  } else {
    store.push(entry);
  }
  saveStore();
}

export function queryVector(queryText, topK = 5) {
  const qVec = vectorize(queryText);

  return store
    .map(entry => ({
      ...entry,
      score: cosineSimilarity(qVec, entry.vector)
    }))
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ vector: _, ...rest }) => rest);
}

export function removeVector(id) {
  store = store.filter(e => e.id !== id);
  saveStore();
}

export function vectorCount() {
  return store.length;
}
