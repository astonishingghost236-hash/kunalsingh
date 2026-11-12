# Kunal Singh — developer portfolio

A responsive portfolio with a cinematic cosmic backdrop, a hero portrait and technology orbit illustration, and a Node.js/Express server. The frontend uses vanilla HTML, CSS, and JavaScript modules; no React or SQL database is used.

## Start the site

1. Install Node.js 24.x and npm 10 or newer.
2. Run `npm ci`.
3. Run `npm start`.
4. Open [http://localhost:3000](http://localhost:3000).

The portfolio project is served from `src/projects.js`. The contact form submits enquiries to Web3Forms for email delivery. Its access key is a public Web3Forms form key, intended for client-side use. Set `PORT` to change the web server port.

The lightweight CSS starfield is static. Hero skill orbits animate only while the hero is visible, pause during the welcome intro and when the tab is hidden, and slow down when reduced motion is enabled. Intro audio loads only after the visitor activates the welcome screen.

All six certificate cards open a four-digit PIN prompt. Set a private `CERTIFICATE_PIN` environment variable on the server before enabling access. Certificate PDFs are stored outside `public/` and are only returned after the server validates the PIN. The PIN is never embedded in frontend code. A four-digit PIN offers limited protection and should not be treated as strong authentication for highly sensitive documents.

For local development, set `CERTIFICATE_PIN=1234` in your ignored `.env` file before running `npm start`, replacing the example with your own four-digit PIN. Put the PDF files in `private/certificates/`; PDFs in that folder are ignored by Git and must never be committed. `npm start` loads the local `.env`; an environment variable already set by the shell takes precedence. Configure the PIN as a deployment secret in production; never add it to frontend code or commit it.

The public-repository release intentionally excludes the certificate PDFs. As a result, certificate viewing on a deployment returns an explicit unavailable message until private document storage is configured for that server. Do not add personal certificate PDFs to a public GitHub repository.

Run `npm test` to check homepage content and in-page links, static assets and missing-asset responses, the hero portrait, projects API, and the Web3Forms contact form markup.

## Deploying to a server

- Use a host that supports Node.js 22 or newer and runs `npm start`. The server listens on the `PORT` provided by the host.
- Keep `package-lock.json` and install with `npm ci` for reproducible dependency installation.

### Deploying to Vercel

Vercel runs Express as a serverless function. The Express app is exported for Vercel Functions; it does not open a standalone server in the function. Projects are plain JavaScript data, so no database add-on or database environment variables are needed.

Set the Vercel project root to the repository root and the install command to `npm ci`. No frontend build step is required. Certificate PDFs are not included in the public deployment; connect a private document store before enabling certificate viewing there. Do not set the output directory to the repository root; the Express entry point is `server.js`.

## Portfolio profile

- Name: Kunal Singh
- Role: Full Stack Web Developer; Computer Science & Engineering student
- Email: astonishing.ghost.236@gmail.com
- Education: B.Tech — Computer Science & Engineering (currently pursuing); Class XII — PCM, M.M.I.C (58%); Class X, S.B.V.M (68%).
- Skills: Python, JavaScript, React, and Node.js. React is listed as a skill; the portfolio UI itself uses vanilla JavaScript.

## Make it yours

- Replace the hero portrait asset with your own transparent WebP image; keep its existing filename or update the image path in `public/index.html`.
- Edit the profile content, availability, role, skills, education, and contact details in `public/index.html`.
- Update project content in `src/projects.js`.
- Visitors can choose one of four saved color themes from the navigation menu. Theme palettes are defined in `public/css/style.css`; layout styling lives in `public/css/style.css` and `public/css/responsive.css`.

The site uses a static CSS space background and does not require WebGL, a runtime CDN, or a frontend build step.
