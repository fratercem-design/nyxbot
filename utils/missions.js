import fs from "fs";

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

export function loadMissions() {
  return loadJSON("missions.json");
}

export function saveMissions(missions) {
  saveJSON("missions.json", missions);
}

export function getActiveMission(missions) {
  const active = missions.filter(m => m.status === "active");
  active.sort((a, b) => b.priority - a.priority);
  return active[0];
}

export function updateMissionProgress(mission, delta = 1) {
  mission.progress += delta;
  mission.last_updated = Date.now();

  if (mission.progress >= 100) {
    mission.status = "completed";
  }
}
