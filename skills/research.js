{
  role: "user",
  content: `
You are analyzing scraped web content.

Extract ONLY useful information.

Return JSON in this format:
{
  "insights": ["..."],
  "facts": ["..."],
  "actions": ["..."]
}

Rules:
- No fluff
- No repetition
- Be concise and specific

Content:
${text.slice(0, 4000)}
`
}
