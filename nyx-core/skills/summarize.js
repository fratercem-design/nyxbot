module.exports = async function summarize(input) {
  const text = typeof input === "object"
    ? JSON.stringify(input, null, 2)
    : String(input);

  // Split into sentences, filter empty ones
  const sentences = text
    .replace(/\n+/g, ". ")
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  // Leading summary: first meaningful sentence
  const leadSentence = sentences[0] || text.slice(0, 150);

  // Pull key terms: words > 4 chars, alpha only, deduped, top 8
  const words = text.split(/\s+/);
  const keyTerms = [
    ...new Set(
      words
        .map(w => w.replace(/[^a-zA-Z]/g, "").toLowerCase())
        .filter(w => w.length > 4)
    )
  ].slice(0, 8);

  const wordCount = words.length;
  const sentenceCount = sentences.length;

  // Compression ratio vs 500-word baseline
  const compressionRatio = wordCount > 100
    ? `${Math.round((1 - 50 / wordCount) * 100)}%`
    : "minimal";

  return {
    summary: leadSentence.endsWith(".") ? leadSentence : leadSentence + ".",
    keyTerms,
    wordCount,
    sentenceCount,
    compressionRatio
  };
};
