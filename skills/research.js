import axios from "axios";
import * as cheerio from "cheerio";

export default async function research(task) {
  try {
    const query = task.replace("research", "").trim();

    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    const results = [];

    $("a.result__a").each((i, el) => {
      const text = $(el).text().trim();
      const link = $(el).attr("href");

      if (text && link) {
        results.push(`${text} - ${link}`);
      }
    });

    if (results.length === 0) {
      return `No results found for: ${query}`;
    }

    return results.slice(0, 3).join("\n");
  } catch (err) {
    return "Research failed: " + err.message;
  }
}