# Kunal Singh — developer portfolio

A responsive portfolio with a cinematic cosmic backdrop, a replaceable character portrait, a Node.js/Express server, and persistent SQLite project data. The frontend uses vanilla HTML, CSS, and JavaScript modules; no React is used.

## Start the site

1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Run `npm start`.
4. Open [http://localhost:3000](http://localhost:3000).

The first start creates `data/portfolio.sqlite` and adds four editable example projects, including this portfolio. The contact form is currently a front-end-only visual preview; it does not accept, email, or store submissions. Set `PORT` to change the web server port, or `PORTFOLIO_DB_PATH` to choose another SQLite file.

The Three.js browser module is copied into the public asset directory after dependency installation; run `npm run build` to copy it again if needed. Run `npm test` to check homepage content and in-page links, static assets and missing-asset responses, the replaceable portrait, projects API, and that the contact form is non-functional.

## Deploying to a server

- Use a host that supports Node.js 22 or newer and runs `npm start`. The server listens on the `PORT` provided by the host.
- Run one application instance when using SQLite. Mount a persistent, writable disk and set `PORTFOLIO_DB_PATH` to a file on that disk (for example, `/var/lib/kunal-portfolio/portfolio.sqlite`). The parent directory is created at startup.
- Do not store the production database on an ephemeral filesystem or a network/shared volume. Use SQLite's online backup API for live backups; for offline backups, stop the application cleanly before copying the database.
- Keep `package-lock.json` and install with `npm ci` for reproducible dependency installation.

### Deploying to Vercel

Vercel runs Express as a serverless function and does not provide a persistent local SQLite file. This project uses Turso/libSQL (SQLite-compatible) for its hosted projects database and retains `better-sqlite3` for local development.

1. Create a Turso database and an auth token.
2. In the Vercel project's **Settings → Environment Variables**, set `TURSO_DATABASE_URL` to the database URL and `TURSO_AUTH_TOKEN` to the token for Production and Preview. Do not commit these values or paste the token into source files.
3. Set the Vercel project root to the repository root and the install command to `npm ci`. `vercel.json` sets the build command to `npm run build`, which copies Three.js into `public/` for Vercel's static asset hosting. Do not set the output directory to the repository root; the Express entry point is `server.js`.

On first request, the app creates the projects table and seeds the four starter projects in Turso. If the two Turso environment variables are missing or invalid, the API returns an error instead of silently using temporary storage.

## Portfolio profile

- Name: Kunal Singh
- Role: Full Stack Web Developer; Computer Science & Engineering student
- Email: astonishing.ghost.236@gmail.com
- Education: B.Tech — Computer Science & Engineering (currently pursuing); Class XII — PCM, M.M.I.C (58%); Class X, S.B.V.M (68%).
- Skills: Python, JavaScript, React, and Node.js. React is listed as a skill; the portfolio UI itself uses vanilla JavaScript.

## Make it yours

- Replace `public/assets/character.png` with your own transparent PNG. Keep the same filename or update the image path in `public/index.html`.
- Edit the profile content, availability, role, skills, education, and contact details in `public/index.html`.
- Update the starter project content and colours in `src/database.js` before the first launch. To replace the already-seeded example projects, stop the server, remove `data/portfolio.sqlite`, edit the starter list, and restart. Back up the database first if you want to keep existing project data.
- Adjust your skills and working approach in `public/index.html`; styling lives in `public/css/style.css` and `public/css/responsive.css`.

The star canvas loads the installed Three.js module from the same Express server, without relying on a runtime CDN. If WebGL or the module is unavailable, the independent CSS space background and all portfolio features still work.
