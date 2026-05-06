import axios from "axios";
import * as cheerio from "cheerio";

async function execute(input) {
  try {
    const query = typeof input === "string"
      ? input.replace(/^research\s*/i, "").trim()
      : String(input);

    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await axios.get(url, { timeout: 10000, headers: { "User-Agent": "Mozilla/5.0" } });
    const $ = cheerio.load(res.data);

    const results = [];
    $("a.result__a").each((i, el) => {
      const text = $(el).text().trim();
      const link = $(el).attr("href");
      if (text && link && results.length < 5) results.push(`${text} — ${link}`);
    });

    if (results.length === 0) return `No results found for: ${query}`;
    return results.join("\n");
  } catch (err) {
    return `Research error: ${err.message}`;
  }
}

export default {
  name: "research",
  metadata: {
    description: "Searches the web and returns relevant results",
    permissions: ["web"],
    inputs: ["query"],
    outputs: ["search results"],
    riskLevel: "low",
    timeout: 15000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000 }
  },
  execute
};
