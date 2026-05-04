import axios from "axios";
import * as cheerio from "cheerio";

export default async function research(task) {
  try {
    const query = task.replace("research", "").trim();
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    const results = [];

    $(".result__a").each((i, el) => {
      results.push($(el).text());
    });

    return results.slice(0, 3);
  } catch {
    return "Research failed";
  }
}