async function execute(input) {
  return `Processed: ${input}`;
}

export default {
  name: "basic",
  metadata: {
    description: "Default fallback skill — echoes processed input",
    permissions: [],
    inputs: ["any"],
    outputs: ["processed string"],
    riskLevel: "low",
    timeout: 5000
  },
  execute
};
