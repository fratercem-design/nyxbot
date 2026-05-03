import axios from "axios";
import cheerio from "cheerio";
import { summarize } from "../utils/summarizer.js";

// extract clean text
function extractText(html) {
  const $ = cheerio.load(html);

  $("script, style, noscript").remove();

  return $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);
}

// search
async function search(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const res = await axios.get(url);

  const $ = cheerio.load(res.data);

  const links = [];

  $(".result__a").each((i, el) => {
    const href = $(el).attr("href");
    if (href) links.push(href);
  });

  return links.slice(0, 3);
}

// main
export default async function research(task) {
  try {
    const query = task.replace("research", "").trim();

    console.log("[Research] Searching:", query);

    const links = await search(query);

    let results = [];

    for (let url of links) {
      try {
        const res = await axios.get(url, { timeout: 5000 });

        const text = extractText(res.data);

        const summary = await summarize(text, task);

        results.push({
          url,
          summary
        });

      } catch {
        console.log("[Research] Failed:", url);
      }
    }

    return JSON.stringify(results);

  } catch (err) {
    console.error("[Research] Error:", err.message);
    return JSON.stringify([]);
  }
}