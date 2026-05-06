export default async function api(task) {
  const urlMatch = typeof task === "string"
    ? task.match(/https?:\/\/[^\s]+/)
    : null;

  const url = urlMatch ? urlMatch[0] : task.url;

  if (!url) return { error: "Missing URL" };

  const res = await fetch(url, {
    method: task.method || "GET",
    headers: task.headers || {},
    body: task.body ? JSON.stringify(task.body) : undefined
  });

  const data = await res.json();
  return { success: true, data };
}
