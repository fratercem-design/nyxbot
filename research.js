const skills = {};

const skillsPath = "./skills";
const skillFiles = fs.readdirSync(skillsPath);

for (const file of skillFiles) {
  if (file.endsWith(".js")) {
    const name = file.replace(".js", "");
    skills[name] = await import(`${skillsPath}/${file}`);
  }
}
