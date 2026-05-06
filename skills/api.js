async function execute(input) {
  const url = typeof input === "object"
    ? input.url
    : String(input).match(/https?:\/\/[^\s]+/)?.[0];

  if (!url) return { error: "No URL found in input" };

  const res = await fetch(url, {
    method: typeof input === "object" ? input.method || "GET" : "GET",
    headers: typeof input === "object" ? input.headers || {} : {}
  });

  const data = await res.json();
  return { success: true, status: res.status, data };
}

export default {
  name: "api",
  metadata: {
    description: "Makes HTTP requests to external APIs",
    permissions: ["web"],
    inputs: ["URL string or { url, method, headers, body }"],
    outputs: ["{ success, status, data }"],
    riskLevel: "medium",
    timeout: 15000
  },
  execute
};
