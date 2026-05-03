const fs = require("fs");

// ---------- LOAD ----------
function loadKnowledge() {
  try {
    return JSON.parse(fs.readFileSync("knowledge.json"));
  } catch {
    return [];
  }
}

// ---------- SAVE ----------
function saveKnowledge(data) {
  fs.writeFileSync("knowledge.json", JSON.stringify(data, null, 2));
}

// ---------- ADD ----------
function addKnowledge(entries, topic) {
  const knowledge = loadKnowledge();

  for (let item of entries) {
    knowledge.push({
      topic,
      url: item.url,
      insights: item.summary?.insights || [],
      facts: item.summary?.facts || [],
      actions: item.summary?.actions || [],
      timestamp: Date.now()
    });
  }

  saveKnowledge(knowledge);
}

// ---------- SIMPLE SEARCH ----------
function searchKnowledge(query) {
  const knowledge = loadKnowledge();

  return knowledge
    .filter(k =>
      k.topic.toLowerCase().includes(query.toLowerCase())
    )
    .slice(-5);
}

module.exports = {
  loadKnowledge,
  saveKnowledge,
  addKnowledge,
  searchKnowledge
};
