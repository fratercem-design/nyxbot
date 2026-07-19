const MOCK_KNOWLEDGE = {
  ai: {
    title: "Artificial Intelligence",
    summary: "AI is the simulation of human intelligence processes by machines, especially computer systems.",
    facts: [
      "Machine learning is a subset of AI that learns from data",
      "Neural networks are modeled after the human brain",
      "LLMs use transformer architecture to process language",
      "AI applications include NLP, computer vision, and robotics"
    ],
    sources: ["ai-journal.org", "tech-review.com", "deepmind.com"]
  },
  blockchain: {
    title: "Blockchain Technology",
    summary: "A distributed ledger technology that records transactions across many computers securely.",
    facts: [
      "Blockchain is immutable once data is written",
      "Consensus mechanisms validate new blocks",
      "Smart contracts execute automatically when conditions are met",
      "Bitcoin uses proof-of-work consensus"
    ],
    sources: ["coindesk.com", "ethereum.org", "blockchain-review.net"]
  },
  marketing: {
    title: "Digital Marketing",
    summary: "The promotion of products or services through digital channels to reach consumers.",
    facts: [
      "Content marketing drives 3x more leads than paid ads",
      "Email marketing has an average ROI of 4200%",
      "SEO generates long-term organic traffic",
      "Social media engagement boosts brand awareness"
    ],
    sources: ["hubspot.com", "marketingland.com", "moz.com"]
  }
};

module.exports = async function research(input) {
  const topic = String(input).toLowerCase();

  const matchedKey = Object.keys(MOCK_KNOWLEDGE).find(k => topic.includes(k));
  const data = matchedKey
    ? MOCK_KNOWLEDGE[matchedKey]
    : {
        title: input,
        summary: `Research results for: "${input}". Initial analysis indicates this is an active area with multiple perspectives.`,
        facts: [
          "Finding 1: Strong relevance to current trends identified",
          "Finding 2: Multiple credible sources confirm the topic",
          "Finding 3: Cross-domain applications are emerging",
          "Finding 4: Further deep-dive research is recommended"
        ],
        sources: ["source-alpha.com", "source-beta.org", "source-gamma.net"]
      };

  return {
    topic: input,
    ...data,
    timestamp: new Date().toISOString()
  };
};
