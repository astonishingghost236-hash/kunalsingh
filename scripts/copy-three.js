const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "..");
const source = path.join(projectRoot, "node_modules", "three", "build", "three.module.js");
const destination = path.join(projectRoot, "public", "vendor", "three", "three.module.js");

if (!fs.existsSync(source)) {
  throw new Error(`Three.js browser module was not found at ${source}. Run npm ci first.`);
}

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.copyFileSync(source, destination);
console.log("Copied the Three.js browser module into public/vendor/three.");
