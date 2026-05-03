const fs = require("fs");

function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch {
    return [];
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function loadMissions() {
  return loadJSON("missions.json");
}

function saveMissions(missions) {
  saveJSON("missions.json", missions);
}

// pick highest priority active mission
function getActiveMission(missions) {
  const active = missions.filter(m => m.status === "active");

  active.sort((a, b) => b.priority - a.priority);

  return active[0];
}

// update progress
function updateMissionProgress(mission, delta = 1) {
  mission.progress += delta;
  mission.last_updated = Date.now();

  if (mission.progress >= 100) {
    mission.status = "completed";
  }
}

module.exports = {
  loadMissions,
  saveMissions,
  getActiveMission,
  updateMissionProgress
};
