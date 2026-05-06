import db from "../memory/memoryDB.js";
import eventBus from "../core/eventBus.js";

function set(key, value) {
  db.prepare(`
    INSERT INTO world_state (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, JSON.stringify(value), Date.now());
}

function get(key) {
  const row = db.prepare("SELECT value FROM world_state WHERE key = ?").get(key);
  if (!row) return null;
  try { return JSON.parse(row.value); } catch { return row.value; }
}

function getAll() {
  const rows = db.prepare("SELECT key, value, updated_at FROM world_state ORDER BY updated_at DESC").all();
  const result = {};
  for (const row of rows) {
    try { result[row.key] = JSON.parse(row.value); } catch { result[row.key] = row.value; }
  }
  return result;
}

function patch(updates) {
  for (const [key, value] of Object.entries(updates)) {
    set(key, value);
  }
  eventBus.emit("world:updated", updates);
}

export function recordInteraction(userId, message, channel = "web") {
  const users = get("active_users") || {};
  users[userId] = {
    lastSeen: Date.now(),
    channel,
    messageCount: (users[userId]?.messageCount || 0) + 1
  };
  set("active_users", users);

  const recent = get("recent_events") || [];
  recent.unshift({ type: "interaction", userId, channel, summary: message.slice(0, 80), timestamp: Date.now() });
  set("recent_events", recent.slice(0, 50));
}

export function recordTopicActivity(topic) {
  const topics = get("recurring_topics") || {};
  topics[topic] = (topics[topic] || 0) + 1;
  set("recurring_topics", topics);
}

export function getTopTopics(n = 5) {
  const topics = get("recurring_topics") || {};
  return Object.entries(topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([topic, count]) => ({ topic, count }));
}

export function getActiveUsers() {
  return get("active_users") || {};
}

export function getEnvironmentalState() {
  return {
    uptime: Date.now() - (get("start_time") || Date.now()),
    activeUsers: Object.keys(get("active_users") || {}).length,
    topTopics: getTopTopics(3),
    recentEventCount: (get("recent_events") || []).length,
    currentProjects: get("current_projects") || []
  };
}

export default { set, get, getAll, patch, recordInteraction, recordTopicActivity, getTopTopics, getActiveUsers, getEnvironmentalState };
