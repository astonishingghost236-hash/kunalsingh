const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const dataDirectory = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDirectory, { recursive: true });

const databasePath = process.env.PORTFOLIO_DB_PATH ||
  path.join(dataDirectory, "portfolio.sqlite");
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const database = new Database(databasePath);
database.pragma("journal_mode = WAL");

database.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    year TEXT NOT NULL,
    description TEXT NOT NULL,
    accent TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
`);

const starterProjects = [
  {
    slug: "orbit-finance",
    title: "Orbit Finance",
    category: "PRODUCT DESIGN · FRONTEND",
    year: "2025",
    description: "A calmer command center for the money moving around your world.",
    accent: "#b9a0ff",
    sort_order: 1,
  },
  {
    slug: "lumen-studio",
    title: "Lumen Studio",
    category: "CREATIVE DEVELOPMENT · WEBGL",
    year: "2024",
    description: "An immersive digital home for ideas that do not sit still.",
    accent: "#91ddcc",
    sort_order: 2,
  },
  {
    slug: "signal-notes",
    title: "Signal Notes",
    category: "FULL-STACK · SAAS",
    year: "2024",
    description: "A focused writing space built to make room for the work.",
    accent: "#ffbd98",
    sort_order: 3,
  },
  {
    slug: "kunal-singh-portfolio",
    title: "Kunal Singh Portfolio",
    category: "PERSONAL PORTFOLIO · FULL-STACK",
    year: "2026",
    description: "A responsive cosmic portfolio featuring a Three.js starfield, animated skill orbits, a dynamic project gallery, and a visual-only contact preview.",
    accent: "#a995da",
    sort_order: 4,
  },
];

const insertProject = database.prepare(`
  INSERT OR IGNORE INTO projects (slug, title, category, year, description, accent, sort_order)
  VALUES (@slug, @title, @category, @year, @description, @accent, @sort_order)
`);

const seedProjects = database.transaction((projects) => {
  for (const project of projects) insertProject.run(project);
});
seedProjects(starterProjects);

const selectProjects = database.prepare(`
  SELECT slug, title, category, year, description, accent
  FROM projects
  ORDER BY sort_order, id
`);

function getProjects() {
  return selectProjects.all();
}

function closeDatabase() {
  database.close();
}

module.exports = { closeDatabase, getProjects };
