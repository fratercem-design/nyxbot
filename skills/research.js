const axios = require("axios");

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

async function summarize(text) {
  try {
    const res = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You summarize web content into clear insights."
          },
          {
            role: "user",
            content: `
Summarize this content into:
- Key insights
- Important facts
- Actionable ideas

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
    return "Summary failed.";
  }
}

async function research(query) {
  try {
    // Step 1: search
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

    let finalOutput = "";

    for (let r of results) {
      // Step 2: scrape content
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

      // Step 3: summarize with AI
      const summary = await summarize(content);

      finalOutput += `
SOURCE: ${r.title}
URL: ${r.url}

${summary}

-------------------
`;
    }

    return finalOutput;

  } catch (err) {
    console.error("RESEARCH ERROR:", err.response?.data || err.message);
    return "Research failed.";
  }
}

module.exports = { research };
