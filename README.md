# Kunal Singh — developer portfolio

A responsive portfolio with a cinematic cosmic backdrop, a replaceable character portrait, and a Node.js/Express server. The frontend uses vanilla HTML, CSS, and JavaScript modules; no React or SQL database is used.

## Start the site

1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Run `npm start`.
4. Open [http://localhost:3000](http://localhost:3000).

Four example projects, including this portfolio, are served from `src/projects.js`. The contact form is currently a front-end-only visual preview; it does not accept, email, or store submissions. Set `PORT` to change the web server port.

The Three.js browser module is copied into the public asset directory after dependency installation; run `npm run build` to copy it again if needed. Run `npm test` to check homepage content and in-page links, static assets and missing-asset responses, the replaceable portrait, projects API, and that the contact form is non-functional.

## Deploying to a server

- Use a host that supports Node.js 22 or newer and runs `npm start`. The server listens on the `PORT` provided by the host.
- Keep `package-lock.json` and install with `npm ci` for reproducible dependency installation.

### Deploying to Vercel

Vercel runs Express as a serverless function. The Express app is exported for Vercel Functions; it does not open a standalone server in the function. Projects are plain JavaScript data, so no database add-on or database environment variables are needed.

Set the Vercel project root to the repository root and the install command to `npm ci`. `vercel.json` sets the build command to `npm run build`, which copies Three.js into `public/` for Vercel's static asset hosting. Do not set the output directory to the repository root; the Express entry point is `server.js`.

## Portfolio profile

- Name: Kunal Singh
- Role: Full Stack Web Developer; Computer Science & Engineering student
- Email: astonishing.ghost.236@gmail.com
- Education: B.Tech — Computer Science & Engineering (currently pursuing); Class XII — PCM, M.M.I.C (58%); Class X, S.B.V.M (68%).
- Skills: Python, JavaScript, React, and Node.js. React is listed as a skill; the portfolio UI itself uses vanilla JavaScript.

## Make it yours

- Replace `public/assets/character.png` with your own transparent PNG. Keep the same filename or update the image path in `public/index.html`.
- Edit the profile content, availability, role, skills, education, and contact details in `public/index.html`.
- Update project content and colours in `src/projects.js`.
- Adjust your skills and working approach in `public/index.html`; styling lives in `public/css/style.css` and `public/css/responsive.css`.

The star canvas loads the installed Three.js module from the same Express server, without relying on a runtime CDN. If WebGL or the module is unavailable, the independent CSS space background and all portfolio features still work.
