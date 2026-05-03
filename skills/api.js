export default async function api(task) {
  if (!task.url) return { error: "Missing URL" };

  const res = await fetch(task.url, {
    method: task.method || "GET",
    headers: task.headers || {},
    body: task.body ? JSON.stringify(task.body) : undefined
  });

  const data = await res.json();
  return { success: true, data };
}
