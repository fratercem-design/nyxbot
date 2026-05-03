const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { ChromaClient } = require("chromadb");

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

const client = new ChromaClient({ path: "./chroma" });
const COLLECTION = "psyche_knowledge";

// ---------- INIT ----------
async function getCollection() {
  return await client.getOrCreateCollection({
    name: COLLECTION
  });
}

// ---------- EMBEDDING ----------
async function embed(text) {
  try {
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

  } catch (err) {
    console.error("EMBED ERROR:", err.response?.data || err.message);
    return [];
  }
}

// ---------- ADD ----------
async function addToVector(item) {
  try {
    const collection = await getCollection();

    const text = `
Topic: ${item.topic}
Insights: ${(item.insights || []).join(" ")}
Facts: ${(item.facts || []).join(" ")}
Actions: ${(item.actions || []).join(" ")}
`;

    const embedding = await embed(text);

    if (!embedding.length) return;

    await collection.add({
      ids: [uuidv4()],
      embeddings: [embedding],
      documents: [text],
      metadatas: [
        {
          topic: item.topic,
          source: item.source
        }
      ]
    });

  } catch (err) {
    console.error("VECTOR ADD ERROR:", err.message);
  }
}

// ---------- QUERY ----------
async function queryVector(queryText, n = 5) {
  try {
    const collection = await getCollection();
    const embedding = await embed(queryText);

    if (!embedding.length) return [];

    const res = await collection.query({
      queryEmbeddings: [embedding],
      nResults: n
    });

    return res.documents?.[0] || [];

  } catch (err) {
    console.error("VECTOR QUERY ERROR:", err.message);
    return [];
  }
}

module.exports = { addToVector, queryVector };
