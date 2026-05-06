const PERMISSION_RULES = {
  research: { allowed: true, riskLevel: "low" },
  generate: { allowed: true, riskLevel: "low" },
  fileReader: { allowed: true, riskLevel: "low" },
  fileWrite: { allowed: true, riskLevel: "medium" },
  api: { allowed: true, riskLevel: "medium" },
  shell: { allowed: !!process.env.ALLOW_SHELL, riskLevel: "high" },
  basic: { allowed: true, riskLevel: "low" }
};

export function validate(action, input) {
  const rule = PERMISSION_RULES[action];

  if (!rule) {
    return { valid: false, reason: `Unknown action: "${action}"`, riskLevel: "unknown" };
  }

  if (!rule.allowed) {
    return { valid: false, reason: `Action "${action}" is not permitted in this environment`, riskLevel: rule.riskLevel };
  }

  if (rule.riskLevel === "high") {
    console.warn(`[Validator] HIGH-RISK action "${action}" is being executed`);
  }

  if (!input && action !== "reflect") {
    return { valid: false, reason: "Input is required", riskLevel: rule.riskLevel };
  }

  return { valid: true, riskLevel: rule.riskLevel };
}
