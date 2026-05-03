function normalizeText(arr) {
  return (arr || []).join(" ").toLowerCase().slice(0, 200);
}

// Simple similarity check
function isSimilar(a, b) {
  return normalizeText(a).includes(normalizeText(b).slice(0, 50));
}

// Score knowledge quality
function scoreItem(item) {
  let score = 0;

  score += (item.insights?.length || 0) * 3;
  score += (item.facts?.length || 0) * 2;
  score += (item.actions?.length || 0) * 4;

  if (item.source && item.source.includes("github")) score += 3;
  if (item.source && item.source.includes("blog")) score += 2;

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

  // Score and sort
  unique = unique.map(item => ({
    ...item,
    score: scoreItem(item)
  }));

  unique.sort((a, b) => b.score - a.score);

  // Keep top 20
  return unique.slice(0, 20);
}

module.exports = { cleanAndRank };
