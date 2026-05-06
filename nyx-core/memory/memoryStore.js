const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "memory.json");

function loadAll() {
  try {
    if (!fs.existsSync(FILE)) return {};
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeAll(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function save(key, value) {
  const data = loadAll();
  data[key] = { value, timestamp: Date.now() };
  writeAll(data);
}

function load(key) {
  const data = loadAll();
  return data[key]?.value || null;
}

function search(query) {
  const data = loadAll();
  const q = query.toLowerCase();

  return Object.entries(data)
    .filter(([key, entry]) => {
      const val = JSON.stringify(entry.value).toLowerCase();
      return key.toLowerCase().includes(q) || val.includes(q);
    })
    .map(([key, entry]) => ({ key, ...entry }));
}

module.exports = { save, load, search };
