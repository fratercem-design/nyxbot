const axios = require("axios");

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

// ---- Summarize scraped content ----
async function summarize(text) {
  try {
    const res = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You ONLY return valid JSON. No explanations. No extra text."
          },
          {
            role: "user",
            content: `
You are analyzing scraped web content.

Extract ONLY useful information.

Return JSON in this format:
{
  "insights": ["..."],
  "facts": ["..."],
  "actions": ["..."]
}

Rules:
- No fluff
- No repetition
- Be concise and specific

Content:
${text.slice(0, 4000)}
`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.data.choices[0].message.content;

  } catch (err) {
    console.error("SUMMARY ERROR:", err.response?.data || err.message);
    return JSON.stringify({
      insights: [],
      facts: [],
      actions: []
    });
  }
}

// ---- Main research function ----
async function research(query) {
  try {
    // Step 1: Search
    const searchRes = await axios.post(
      "https://api.firecrawl.dev/v1/search",
      {
        query: query,
        limit: 2
      },
      {
        headers: {
          Authorization: `Bearer ${FIRECRAWL_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const results = searchRes.data.data;

    let finalOutput = [];

    for (let r of results) {
      // Step 2: Scrape page content
      const scrapeRes = await axios.post(
        "https://api.firecrawl.dev/v1/scrape",
        {
          url: r.url
        },
        {
          headers: {
            Authorization: `Bearer ${FIRECRAWL_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      const content = scrapeRes.data.data?.markdown || "";

      // Step 3: Summarize content
      const summaryRaw = await summarize(content);

      let summary;
      try {
        summary = JSON.parse(summaryRaw);
      } catch {
        summary = {
          insights: [],
          facts: [],
          actions: []
        };
      }

      finalOutput.push({
        title: r.title,
        url: r.url,
        summary: summary
      });
    }

    return JSON.stringify(finalOutput, null, 2);

  } catch (err) {
    console.error("RESEARCH ERROR:", err.response?.data || err.message);
    return JSON.stringify({ error: "Research failed" });
  }
}

module.exports = { research };
