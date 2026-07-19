export function evaluate(executionResult) {
  const { success, output, durationMs, skill, error } = executionResult;

  const qualityScore = assessOutputQuality(output);
  const speedScore = assessSpeed(durationMs);
  const overallScore = success
    ? (qualityScore * 0.7 + speedScore * 0.3)
    : 0;

  return {
    success,
    overallScore: parseFloat(overallScore.toFixed(3)),
    qualityScore,
    speedScore,
    durationMs,
    skill,
    verdict: scoreToVerdict(overallScore, success),
    shouldRetry: !success && isRetryable(error),
    error: error || null
  };
}

function assessOutputQuality(output) {
  if (!output) return 0;

  const str = typeof output === "string" ? output : JSON.stringify(output);

  if (str.length < 10) return 0.1;
  if (str.length < 50) return 0.4;
  if (str.includes("error") || str.includes("failed")) return 0.3;

  let score = 0.7;
  if (str.length > 200) score += 0.1;
  if (str.length > 500) score += 0.1;
  if (typeof output === "object" && Object.keys(output).length > 2) score += 0.1;

  return Math.min(1, parseFloat(score.toFixed(2)));
}

function assessSpeed(ms) {
  if (!ms) return 0.5;
  if (ms < 200) return 1.0;
  if (ms < 1000) return 0.9;
  if (ms < 5000) return 0.7;
  if (ms < 15000) return 0.5;
  return 0.3;
}

function scoreToVerdict(score, success) {
  if (!success) return "failed";
  if (score >= 0.8) return "excellent";
  if (score >= 0.6) return "good";
  if (score >= 0.4) return "acceptable";
  return "poor";
}

function isRetryable(error) {
  if (!error) return false;
  const e = String(error).toLowerCase();
  return e.includes("timeout") || e.includes("network") || e.includes("econnreset");
}
