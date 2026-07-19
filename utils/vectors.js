import axios from "axios";

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function embed(text) {
  const res = await axios.post(
    "https://api.deepseek.com/v1/embeddings",
    {
      model: "deepseek-embedding",
      input: text.slice(0, 2000)
    },
    {
      headers: {
        Authorization: `Bearer ${DEEPSEEK_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return res.data.data[0].embedding;
}

export async function addToVector(item) {
  try {
    const text = `
Topic: ${item.topic}
Insights: ${(item.insights || []).join(" ")}
Facts: ${(item.facts || []).join(" ")}
Actions: ${(item.actions || []).join(" ")}
`;

    const embedding = await embed(text);

    await axios.post(
      `${SUPABASE_URL}/rest/v1/knowledge`,
      {
        content: text,
        embedding,
        metadata: {
          topic: item.topic,
          source: item.source
        }
      },
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        }
      }
    );
  } catch (err) {
    console.error("SUPABASE STORE ERROR:", err.response?.data || err.message);
  }
}

export async function queryVector(queryText, n = 5) {
  try {
    const embedding = await embed(queryText);

    const res = await axios.post(
      `${SUPABASE_URL}/rest/v1/rpc/match_documents`,
      {
        query_embedding: embedding,
        match_count: n
      },
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.data.map(r => r.content);
  } catch (err) {
    console.error("SUPABASE QUERY ERROR:", err.response?.data || err.message);
    return [];
  }
}
