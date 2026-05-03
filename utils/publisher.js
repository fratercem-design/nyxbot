const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "..", "outputs");
const PUBLIC_DIR = path.join(__dirname, "..", "public");

// ensure public folder
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// ---------- HTML TEMPLATE ----------
function buildHTML(post) {
  return `
<html>
<head>
  <title>${post.title}</title>
  <style>
    body { font-family: Arial; max-width: 800px; margin: auto; padding: 40px; }
    h1 { font-size: 32px; }
    p { line-height: 1.6; }
    ul { margin-top: 20px; }
  </style>
</head>
<body>
  <h1>${post.title}</h1>
  <p><i>${post.summary}</i></p>

  <div>${post.content}</div>

  <h3>Key Points</h3>
  <ul>
    ${post.bullets.map(b => `<li>${b}</li>`).join("")}
  </ul>

  <p><b>${post.call_to_action}</b></p>
</body>
</html>
`;
}

// ---------- PUBLISH ----------
function publishLatest() {
  try {
    const files = fs.readdirSync(OUTPUT_DIR);

    if (!files.length) return;

    const latest = files.sort().reverse()[0];

    const content = JSON.parse(
      fs.readFileSync(path.join(OUTPUT_DIR, latest))
    );

    const html = buildHTML(content);

    const fileName = latest.replace(".json", ".html");

    const filePath = path.join(PUBLIC_DIR, fileName);

    fs.writeFileSync(filePath, html);

    console.log("[Publish] Created:", filePath);

  } catch (err) {
    console.error("[Publish] Error:", err.message);
  }
}

module.exports = { publishLatest };
