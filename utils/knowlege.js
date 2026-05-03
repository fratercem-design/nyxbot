\function normalizeText(arr) {
  return (arr || []).join(" ").toLowerCase().slice(0, 200);
}

function isSimilar(a, b) {
  return normalizeText(a).includes(normalizeText(b).slice(0, 50));
}

function scoreItem(item) {
  let score = 0;

  score += (item.insights?.length || 0) * 3;
  score += (item.facts?.length || 0) * 2;
  score += (item.actions?.length || 0) * 4;

  if (item.source && item.source.includes("github")) score += 3;
  if (item.source && item.source.includes("blog")) score += 2;

  // freshness boost
  if (item.timestamp) {
    const age = Date.now() - item.timestamp;
    const freshness = Math.max(0, 5 - age / (1000 * 60 * 60));
    score += freshness;
  }

  return score;
}

function cleanAndRank(knowledge) {
  let unique = [];

  for (let item of knowledge) {
    let duplicate = unique.find(u =>
      isSimilar(u.insights, item.insights)
    );

    if (!duplicate) {
      unique.push(item);
    }
  }

  unique = unique.map(item => ({
    ...item,
    score: scoreItem(item)
  }));

  unique.sort((a, b) => b.score - a.score);

  return unique.slice(0, 50);
}

module.exports = { cleanAndRank };
