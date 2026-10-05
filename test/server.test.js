const assert = require("node:assert/strict");
const { spawn, spawnSync } = require("node:child_process");
const { once } = require("node:events");
const path = require("node:path");
const test = require("node:test");

test("serves the portfolio, lists projects and keeps the contact form visual-only", async (t) => {
  const serverProcess = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    env: {
      ...process.env,
      PORT: "0",
      VERCEL: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  t.after(async () => {
    if (serverProcess.exitCode === null) {
      const exited = once(serverProcess, "exit");
      serverProcess.kill();
      await exited;
    }
  });

  let output = "";
  const baseUrl = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Portfolio server did not start in time.")), 5000);
    serverProcess.stdout.on("data", (chunk) => {
      output += chunk.toString();
      const match = output.match(/http:\/\/localhost:(\d+)/);
      if (!match) return;
      clearTimeout(timeout);
      resolve(match[0]);
    });
    serverProcess.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    serverProcess.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Portfolio server exited with code ${code}: ${output}`));
    });
  });

  const home = await fetch(baseUrl);
  assert.equal(home.status, 200);
  const homeHtml = await home.text();
  assert.doesNotMatch(homeHtml, /Making the digital feel|Explore my work|A little about me/);
  assert.match(homeHtml, /Kunal Singh/);
  assert.match(homeHtml, /<title>Kunal Singh<\/title>/);
  const heroSection = homeHtml.match(/<section class="hero"[\s\S]*?<\/section>/)?.[0];
  assert.ok(heroSection, "Hero section should be present");
  assert.match(heroSection, /FULL STACK WEB DEVELOPER/);
  assert.match(heroSection, /class="hero__character" src="\/assets\/character\.png"/);
  assert.doesNotMatch(heroSection, /hero__intro|hero__actions|hero__caption|hero__scroll/);
  assert.match(homeHtml, /pursuing a B\.Tech in Computer Science &amp; Engineering at Maharshi Dayanand University \(MDU\)/);
  assert.match(homeHtml, /started in 2024 and expect to graduate in 2028/);
  assert.match(homeHtml, /learning Python, JavaScript, React and Node\.js through coding and building web projects/);
  assert.match(homeHtml, /This portfolio is one of them/);
  const navigation = homeHtml.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(navigation, "Section navigation drawer should be present");
  assert.equal((navigation.match(/class="site-nav__link/g) ?? []).length, 7);
  assert.equal((navigation.match(/<svg viewBox="0 0 24 24" aria-hidden="true">/g) ?? []).length, 7);
  assert.match(navigation, /href="#home"/);
  assert.match(navigation, /href="#about"/);
  assert.match(navigation, /href="#education"/);
  assert.match(navigation, /href="#skills"/);
  assert.match(navigation, /href="#projects"/);
  assert.match(navigation, /href="#experience"/);
  assert.match(navigation, /href="#contact"/);
  assert.doesNotMatch(homeHtml, /class="brand"/);
  assert.doesNotMatch(homeHtml, /hero__float-card|Curiosity|drives everything/);
  assert.equal((homeHtml.match(/class="hero__orbit-travel /g) ?? []).length, 6);
  assert.equal((homeHtml.match(/class="hero__orbit hero__orbit--/g) ?? []).length, 3);
  assert.equal((homeHtml.match(/hero__orbit-travel--python/g) ?? []).length, 2);
  assert.equal((homeHtml.match(/hero__orbit-travel--node/g) ?? []).length, 2);
  assert.match(homeHtml, /hero__orbit--additional hero__orbit--counterclockwise/);
  assert.match(homeHtml, /font-size="3\.2"[^>]*>node<\/text>/);
  assert.match(homeHtml, /cosmic-scene__twinkles/);
  assert.doesNotMatch(homeHtml, /brand__mark|section-number|education-card__index|experience-row__number/);
  assert.doesNotMatch(homeHtml, /Your Name|Independent by nature|Intentional by design|INDEPENDENTLY WORKING|AVAILABLE ONLINE|FIG\. 01|BUILT WITH CURIOSITY|AND A LOT OF CARE/);
  assert.match(homeHtml, /B\.Tech Computer Science &amp; Engineering student at MDU \(2024–2028\)/);
  assert.match(homeHtml, /Full Stack Developer/);
  assert.match(homeHtml, /Computer Science &amp; Engineering/);
  assert.match(homeHtml, /astonishing\.ghost\.236@gmail\.com/);
  assert.match(homeHtml, /id="education"/);
  assert.match(homeHtml, /B\.Tech — Computer Science &amp; Engineering/);
  assert.match(homeHtml, /M\.M\.I\.C/);
  assert.match(homeHtml, /S\.B\.V\.M/);
  assert.match(homeHtml, /58%/);
  assert.match(homeHtml, /68%/);
  const contactSection = homeHtml.match(/<section class="section contact-section"[\s\S]*?<\/section>/)?.[0];
  assert.ok(contactSection, "Contact section preview should be present");
  assert.doesNotMatch(contactSection, /<form\b|name="(name|email|project|message)"|type="submit"/);
  assert.match(contactSection, /Contact form preview — submissions are currently disabled\./);
  assert.equal((contactSection.match(/\sdisabled(?=\s|>)/g) ?? []).length, 5);
  const educationSection = homeHtml.match(/<section class="section education-section"[\s\S]*?<\/section>/)?.[0];
  assert.ok(educationSection, "Education section should be present");
  const educationCards = [...educationSection.matchAll(/<article class="education-card[\s\S]*?<\/article>/g)].map((match) => match[0]);
  assert.equal(educationCards.length, 3);
  assert.match(educationCards[0], /B\.Tech — Computer Science &amp; Engineering/);
  assert.match(educationCards[0], /CURRENTLY PURSUING/);
  assert.match(educationCards[1], /CLASS XII · SCIENCE/);
  assert.match(educationCards[2], /S\.B\.V\.M/);
  assert.doesNotMatch(homeHtml, /Y\/N/);
  const skillsSection = homeHtml.match(/<section class="section skills-section"[\s\S]*?<\/section>/)?.[0];
  assert.ok(skillsSection, "Skills section should be present");
  assert.match(skillsSection, /MY DEVELOPER TOOLKIT/);
  assert.doesNotMatch(skillsSection, /Languages I work/);
  const technologyCards = [...skillsSection.matchAll(/<article class="technology-card"[\s\S]*?<\/article>/g)].map((match) => match[0]);
  assert.equal(technologyCards.length, 4);
  assert.deepEqual(
    technologyCards.map((card) => card.match(/<h3>(.*?)<\/h3>/)?.[1]),
    ["JavaScript", "React", "Python", "Node.js"],
  );
  assert.match(technologyCards[0], /<title id="javascript-logo-title">JavaScript logo<\/title>/);
  assert.match(technologyCards[0], />JS<\/text>/);
  assert.match(technologyCards[1], /<title id="react-logo-title">React logo<\/title>/);
  assert.match(technologyCards[2], /<title id="python-logo-title">Python logo<\/title>/);
  assert.match(technologyCards[3], /<title id="node-logo-title">Node\.js logo<\/title>/);
  for (const excludedCategory of ["Frontend", "Backend", "Programming</", "Full-stack development", "Creative problem solving", "Express", "REST APIs", "HTML &amp; CSS", "Git", "GitHub", "Three.js"]) {
    assert.ok(!skillsSection.includes(excludedCategory), `${excludedCategory} should not appear in the Skills section`);
  }
  const fragmentLinks = [...homeHtml.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
  for (const fragment of fragmentLinks) {
    assert.match(homeHtml, new RegExp(`id="${fragment}"`), `Missing in-page target #${fragment}`);
  }

  const portrait = await fetch(`${baseUrl}/assets/character.png`);
  assert.equal(portrait.status, 200);
  assert.match(portrait.headers.get("content-type"), /image\/png/);

  const missingAsset = await fetch(`${baseUrl}/assets/missing-image.png`);
  assert.equal(missingAsset.status, 404);
  assert.match(missingAsset.headers.get("content-type"), /json/);
  const missingScript = await fetch(`${baseUrl}/js/missing.js`);
  assert.equal(missingScript.status, 404);
  const missingStyle = await fetch(`${baseUrl}/css/missing.css`);
  assert.equal(missingStyle.status, 404);

  const missingEndpoint = await fetch(`${baseUrl}/api/missing`);
  assert.equal(missingEndpoint.status, 404);

  const disabledContactEndpoint = await fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Portfolio Test",
      email: "portfolio@example.test",
      message: "This message should not be processed.",
    }),
  });
  assert.equal(disabledContactEndpoint.status, 404);

  for (const localPath of ["/css/style.css", "/css/responsive.css", "/js/main.js", "/js/navigation.js", "/js/projects.js", "/js/cosmic-background.js", "/js/skill-orbit.js"]) {
    const asset = await fetch(`${baseUrl}${localPath}`);
    assert.equal(asset.status, 200, `${localPath} should load`);
  }
  const responsiveStyles = await (await fetch(`${baseUrl}/css/responsive.css`)).text();
  assert.match(responsiveStyles, /grid-template-columns:\s*1fr;\s*grid-template-rows:\s*auto 1fr/);
  assert.match(responsiveStyles, /height:\s*100vh;\s*height:\s*100svh/);

  const threeModule = await fetch(`${baseUrl}/vendor/three/three.module.js`);
  assert.equal(threeModule.status, 200);
  assert.match(threeModule.headers.get("content-type"), /javascript/);
  assert.match(await threeModule.text(), /export/);

  const projectsResponse = await fetch(`${baseUrl}/api/projects`);
  assert.equal(projectsResponse.status, 200);
  const projects = await projectsResponse.json();
  assert.equal(projects.length, 4);
  assert.ok(projects.every((project) => project.slug && project.title && project.accent));
  const portfolioProject = projects.find((project) => project.slug === "kunal-singh-portfolio");
  assert.ok(portfolioProject, "The portfolio project should be available through the projects API");
  assert.equal(portfolioProject.title, "Kunal Singh Portfolio");
  assert.match(portfolioProject.description, /animated skill orbits/);
  const projectScript = await (await fetch(`${baseUrl}/js/projects.js`)).text();
  assert.match(projectScript, /project\.slug === "kunal-singh-portfolio"/);
  assert.match(projectScript, /card\.href = "\/"/);
  assert.match(projectScript, /card\.target = "_blank"/);

});

test("exports a working Vercel app without a database", () => {
  const result = spawnSync(
    process.execPath,
    [
      "-e",
      "(async () => { const app = require('./server'); const server = app.listen(0, async () => { try { const base = `http://127.0.0.1:${server.address().port}`; const home = await fetch(base); const projectsResponse = await fetch(`${base}/api/projects`); const projects = await projectsResponse.json(); if (home.status !== 200 || !(await home.text()).includes('Kunal Singh')) throw new Error('Vercel homepage failed'); if (projectsResponse.status !== 200 || projects.length !== 4) throw new Error('Vercel project API failed'); server.close(); } catch (error) { console.error(error); server.close(() => process.exitCode = 1); } }); })().catch(error => { console.error(error); process.exitCode = 1; })",
    ],
    {
      cwd: path.join(__dirname, ".."),
      encoding: "utf8",
      env: {
        ...process.env,
        VERCEL: "1",
      },
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
});
