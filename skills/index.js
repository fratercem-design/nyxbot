const fs = require("fs");
const path = require("path");

function loadSkills() {
  const dir = path.join(__dirname);

  const files = fs.readdirSync(dir);

  let skills = {};

  for (let file of files) {
    if (file !== "index.js" && file.endsWith(".js")) {
      const name = file.replace(".js", "");
      skills[name] = require(`./${file}`);
    }
  }

  return skills;
}

module.exports = { loadSkills };
