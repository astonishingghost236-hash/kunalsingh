const fs = require("node:fs");
const path = require("node:path");
const projectSchema = `
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    year TEXT NOT NULL,
    description TEXT NOT NULL,
    accent TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  )
`;

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

const selectProjectsSql = `
  SELECT slug, title, category, year, description, accent
  FROM projects
  ORDER BY sort_order, id
`;

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const hasDatabaseUrl = Boolean(databaseUrl);
const hasAuthToken = Boolean(authToken);

if (hasDatabaseUrl !== hasAuthToken) {
  throw new Error("Set both TURSO_DATABASE_URL and TURSO_AUTH_TOKEN, or neither.");
}
let localDatabase;
let cloudDatabase;
let useStarterProjects = false;
let initialization = Promise.resolve();

if (hasDatabaseUrl) {
  const { createClient } = require("@libsql/client");
  cloudDatabase = createClient({ url: databaseUrl, authToken });
  initialization = cloudDatabase.batch(
    [
      projectSchema,
      ...starterProjects.map((project) => ({
        sql: `
          INSERT OR IGNORE INTO projects
            (slug, title, category, year, description, accent, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          project.slug,
          project.title,
          project.category,
          project.year,
          project.description,
          project.accent,
          project.sort_order,
        ],
      })),
    ],
    "write",
  );
} else if (process.env.VERCEL) {
  useStarterProjects = true;
  console.warn(
    "Turso is not configured. Vercel is serving the built-in read-only project list.",
  );
} else {
  const Database = require("better-sqlite3");
  const dataDirectory = path.join(__dirname, "..", "data");
  fs.mkdirSync(dataDirectory, { recursive: true });

  const databasePath = process.env.PORTFOLIO_DB_PATH ||
    path.join(dataDirectory, "portfolio.sqlite");
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  localDatabase = new Database(databasePath);
  localDatabase.pragma("journal_mode = WAL");
  localDatabase.exec(projectSchema);

  const insertProject = localDatabase.prepare(`
    INSERT OR IGNORE INTO projects (slug, title, category, year, description, accent, sort_order)
    VALUES (@slug, @title, @category, @year, @description, @accent, @sort_order)
  `);
  const seedProjects = localDatabase.transaction((projects) => {
    for (const project of projects) insertProject.run(project);
  });
  seedProjects(starterProjects);
}

async function getProjects() {
  await initialization;
  if (cloudDatabase) {
    const result = await cloudDatabase.execute(selectProjectsSql);
    return result.rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      category: row.category,
      year: row.year,
      description: row.description,
      accent: row.accent,
    }));
  }
  if (useStarterProjects) {
    return starterProjects.map(({ sort_order: _sortOrder, ...project }) => project);
  }
  return localDatabase.prepare(selectProjectsSql).all();
}

async function closeDatabase() {
  if (cloudDatabase) {
    cloudDatabase.close();
    return;
  }
  if (localDatabase) localDatabase.close();
}

module.exports = { closeDatabase, getProjects };
