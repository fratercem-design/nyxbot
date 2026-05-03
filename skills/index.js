const fs = require("fs");
const path = require("path");

const skillsDir = path.join(__dirname);

function loadSkills() {
  const files = fs.readdirSync(skillsDir);

  let skills = {};

  for (let file of files) {
    if (file !== "index.js" && file.endsWith(".js")) {
      const skillName = file.replace(".js", "");
      skills[skillName] = require(`./${file}`);
    }
  }

  return skills;
}

module.exports = { loadSkills };
