const assert = require("node:assert/strict");
const { spawn, spawnSync } = require("node:child_process");
const { once } = require("node:events");
const path = require("node:path");
const test = require("node:test");

test("serves the portfolio, lists projects and enables the Web3Forms contact form", async (t) => {
  const serverProcess = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    env: {
      ...process.env,
      PORT: "0",
      VERCEL: "",
      CERTIFICATE_PIN: "1357",
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
  assert.doesNotMatch(homeHtml, /Making the digital feel|A little about me/);
  assert.match(homeHtml, /Kunal Singh/);
  assert.match(homeHtml, /<title>Kunal Singh<\/title>/);
  assert.match(homeHtml, /KUNAL SINGH · PORTFOLIO/);
  assert.doesNotMatch(homeHtml, /GAUTAM SINGH/);
  assert.match(homeHtml, /Welcome To<br>My <span>Portfolio\.<\/span>/);
  assert.doesNotMatch(homeHtml, /<footer\b|site-footer|footer-nav|footer-top/);
  assert.match(homeHtml, /Pull the cord to switch on the light and see my resume\./);
  assert.match(homeHtml, /id="lamp-cord"/);
  assert.match(homeHtml, /class="lamp-cord__rope-strand"/);
  assert.match(homeHtml, /class="lamp-cord__bulb"/);
  assert.match(homeHtml, /class="intro-lamp__projection"[^>]*>Kunal Singh<\/p>/);
  assert.match(homeHtml, /class="intro-lamp__shade"/);
  assert.match(homeHtml, /class="intro-lamp__shade-rim"/);
  assert.doesNotMatch(homeHtml, /data-theme|theme-switcher|theme-option/);
  assert.doesNotMatch(homeHtml, /id="intro-switch"/);
  const heroSection = homeHtml.match(/<section class="hero"[\s\S]*?<\/section>/)?.[0];
  assert.ok(heroSection, "Hero section should be present");
  assert.match(heroSection, /FULL STACK WEB DEVELOPER/);
  assert.match(heroSection, /<h1 id="hero-title">Kunal <span>Singh<\/span><\/h1>/);
  assert.match(heroSection, /Maharshi Dayanand University \(MDU\)/);
  assert.match(heroSection, /class="hero__starfield"/);
  assert.match(heroSection, /class="hero__glass"/);
  assert.doesNotMatch(heroSection, /hero__neural-network/);
  assert.match(heroSection, /class="hero__character" src="\/assets\/gautam-hero\.webp"/);
  assert.match(heroSection, /alt="Portrait of Kunal Singh wearing a black suit and sunglasses"/);
  assert.match(heroSection, /class="hero__intro"/);
  assert.match(heroSection, /class="hero__actions"/);
  assert.match(homeHtml, /pursuing a <span class="highlight">B\.Tech in Computer Science &amp; Engineering<\/span> at <span class="highlight">Maharshi Dayanand University \(MDU\)<\/span>/);
  assert.match(homeHtml, /I started in <span class="highlight">2024<\/span> and expect to graduate in <span class="highlight">2028<\/span>/);
  assert.match(homeHtml, /learning <span class="highlight">Python<\/span>, <span class="highlight">JavaScript<\/span>, <span class="highlight">React<\/span> and <span class="highlight">Node\.js<\/span> through coding and building web projects/);
  assert.doesNotMatch(homeHtml, /This portfolio is one of them/);
  assert.doesNotMatch(homeHtml, /A LITTLE CONTEXT|My academic journey in computer science|resume opens without a PIN|four-digit PIN|A focused mix of languages and modern tools|Have something in mind\?|THE NEXT CHAPTER|The best projects start with a conversation|dreaming up/);
  const navigation = homeHtml.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(navigation, "Section navigation drawer should be present");
  assert.equal((navigation.match(/class="site-nav__link/g) ?? []).length, 7);
  assert.equal((navigation.match(/<svg viewBox="0 0 24 24" aria-hidden="true">/g) ?? []).length, 7);
  assert.match(navigation, /href="#home"/);
  assert.match(navigation, /href="#about"/);
  assert.match(navigation, /href="#education"/);
  assert.match(navigation, /href="#certificates"/);
  assert.match(navigation, /href="#skills"/);
  assert.match(navigation, /href="#projects"/);
  assert.match(navigation, /href="#contact"/);
  assert.doesNotMatch(homeHtml, /id="experience"|href="#experience"|experience-row/);
  assert.doesNotMatch(homeHtml, /class="brand"/);
  assert.doesNotMatch(homeHtml, /hero__float-card|Curiosity|drives everything/);
  assert.equal((homeHtml.match(/class="hero__orbit-travel /g) ?? []).length, 8);
  assert.doesNotMatch(homeHtml, /class="hero__orbit(?:\s|--)/);
  assert.equal((homeHtml.match(/class="hero__orbit-logo"/g) ?? []).length, 8);
  assert.equal((homeHtml.match(/class="hero__orbit-mark"/g) ?? []).length, 8);
  assert.match(homeHtml, /<div class="hero__stand" aria-hidden="true"><\/div>/);
  const orbitNames = [...heroSection.matchAll(/class="hero__orbit-name" aria-hidden="true">([^<]+)<\/span>/g)].map(([, name]) => name);
  assert.deepEqual(orbitNames, ["JavaScript", "React", "HTML5", "CSS3", "Python", "Node.js", "TypeScript", "Git"]);
  assert.equal((homeHtml.match(/hero__orbit-travel--python/g) ?? []).length, 1);
  assert.equal((homeHtml.match(/hero__orbit-travel--node/g) ?? []).length, 1);
  assert.equal((homeHtml.match(/hero__orbit-travel--html5/g) ?? []).length, 1);
  assert.equal((homeHtml.match(/hero__orbit-travel--css3/g) ?? []).length, 1);
  assert.equal((homeHtml.match(/hero__orbit-travel--typescript/g) ?? []).length, 1);
  assert.equal((homeHtml.match(/hero__orbit-travel--git/g) ?? []).length, 1);
  assert.doesNotMatch(homeHtml, /cosmic-scene__canvas|cosmic-scene__twinkles|hero__twinkles/);
  assert.doesNotMatch(homeHtml, /fonts\.googleapis\.com/);
  assert.doesNotMatch(homeHtml, /brand__mark|section-number|education-card__index|experience-row__number/);
  assert.doesNotMatch(homeHtml, /Your Name|Independent by nature|Intentional by design|INDEPENDENTLY WORKING|AVAILABLE ONLINE|FIG\. 01|BUILT WITH CURIOSITY|AND A LOT OF CARE/);
  assert.match(homeHtml, /I’m <span class="highlight">Kunal Singh<\/span>, pursuing a <span class="highlight">B\.Tech in Computer Science &amp; Engineering<\/span>/);
  assert.match(homeHtml, /Full Stack Developer/);
  assert.match(homeHtml, /Computer Science &amp; Engineering/);
  assert.match(homeHtml, /href="mailto:astonishing\.ghost\.236@gmail\.com"/);
  assert.match(homeHtml, /id="education"/);
  assert.match(homeHtml, /B\.Tech — Computer Science &amp; Engineering/);
  assert.match(homeHtml, /M\.M\.I\.C/);
  assert.match(homeHtml, /S\.B\.V\.M/);
  assert.match(homeHtml, /58%/);
  assert.match(homeHtml, /68%/);
  const contactSection = homeHtml.match(/<section class="section contact-section"[\s\S]*?<\/section>/)?.[0];
  assert.ok(contactSection, "Contact section should be present");
  assert.match(contactSection, /<h2 class="contact-statement" id="contact-title">Ideas into<br><span>impact\.<\/span><\/h2>/);
  assert.match(contactSection, /<p class="form-status" id="contact-status" role="status" aria-live="polite"><\/p>/);
  assert.doesNotMatch(contactSection, /contact-copy|THE NEXT CHAPTER|Have a good|dreaming up/);
  assert.doesNotMatch(contactSection, /Your enquiry will be sent|Web3Forms/);
  const stylesResponse = await fetch(`${baseUrl}/css/style.css`);
  assert.equal(stylesResponse.status, 200);
  const styles = await stylesResponse.text();
  assert.match(styles, /\.education-card--inactive\s*\{\s*pointer-events:\s*none;/);
  assert.match(styles, /\.certificate-card--inactive\s*\{\s*pointer-events:\s*none;/);
  assert.match(styles, /\.contact-section\s*\{[^}]*border:\s*0/);
  assert.match(styles, /\.contact-section\s*\{[^}]*grid-template-columns:\s*minmax\(0, \.82fr\) minmax\(0, 1\.18fr\)/);
  assert.match(styles, /\.hero__orbit-name\s*\{[^}]*color:\s*var\(--logo-accent\);/);
  assert.match(styles, /\.hero__orbit-travel--python \{ --logo-accent: #3776AB; \}/);
  assert.match(styles, /\.hero__orbit-travel--node \{ --logo-accent: #83CD29; \}/);
  assert.match(styles, /\.button--primary\s*\{[^}]*background:\s*#7aa9dc/);
  assert.match(styles, /\.intro-screen\.is-lit \.intro-lamp__bulb-glass\s*\{[^}]*fill:\s*#ffd58a/);
  assert.doesNotMatch(styles, /\.intro-screen\.is-lit \.lamp-cord(?:__line|__bulb)/);
  const introScriptResponse = await fetch(`${baseUrl}/js/intro.js`);
  assert.equal(introScriptResponse.status, 200);
  const introScript = await introScriptResponse.text();
  assert.match(introScript, /new Audio\("\/assets\/playht-voice-over\.mp3"\)/);
  assert.match(introScript, /lampAudio\.preload = "none"/);
  assert.match(introScript, /lampAudio\.play\(\)/);
  assert.match(contactSection, /<form\b[^>]*action="https:\/\/api\.web3forms\.com\/submit"/);
  assert.match(contactSection, /name="access_key" value="42b80d09-1d02-4158-acd9-ca392cd6a5e8"/);
  assert.doesNotMatch(contactSection, /type="file"|name="phone"|PHONE NUMBER/);
  const contactScriptResponse = await fetch(`${baseUrl}/js/contact.js`);
  assert.equal(contactScriptResponse.status, 200);
  const contactScript = await contactScriptResponse.text();
  assert.doesNotMatch(contactScript, /result\.message/);
  assert.match(contactScript, /We couldn't send your message\. Please try again later\./);
  const educationSection = homeHtml.match(/<section class="section education-section"[\s\S]*?<\/section>/)?.[0];
  assert.ok(educationSection, "Education section should be present");
  const educationCards = [...educationSection.matchAll(/<(?:article|a) class="education-card[\s\S]*?<\/(?:article|a)>/g)].map((match) => match[0]);
  assert.equal(educationCards.length, 3);
  assert.match(educationCards[0], /B\.Tech — Computer Science &amp; Engineering/);
  assert.match(educationCards[0], /CURRENTLY PURSUING/);
  assert.match(educationCards[1], /CLASS XII · SCIENCE/);
  assert.match(educationCards[1], /<article class="education-card" tabindex="0"/);
  assert.match(educationCards[2], /S\.B\.V\.M/);
  assert.match(educationCards[2], /<article class="education-card" tabindex="0"/);
  const educationStyles = await (await fetch(`${baseUrl}/css/style.css`)).text();
  assert.match(educationStyles, /\.education-card:focus-visible > \.neon-frame,\s*\.education-card:active > \.neon-frame,\s*\.certificate-card:focus-visible/);
  assert.match(educationStyles, /\.education-card:focus-visible > \.neon-frame::after,\s*\.education-card:active > \.neon-frame::after,\s*\.certificate-card:focus-visible/);
  assert.doesNotMatch(educationCards[1] + educationCards[2], /<a\b|href=|target="_blank"/);
  const certificateSection = homeHtml.match(/<section class="section certificates-section" id="certificates"[\s\S]*?<\/section>/)?.[0];
  assert.ok(certificateSection, "Certificates section should be present");
  assert.ok(homeHtml.indexOf(educationSection) < homeHtml.indexOf(certificateSection), "Certificates should follow education");
  const certificates = [...certificateSection.matchAll(/<(?:a|article|button) class="certificate-card(?: certificate-card--inactive)?"[^>]*>[\s\S]*?<span class="certificate-card__label">([^<]+)<\/span>[\s\S]*?<\/(?:a|article|button)>/g)];
  assert.deepEqual(certificates.map(([, title]) => title), [
    "Resume",
    "10th High School Certificate",
    "12th Intermediate Certificate",
    "Scout Guide Training",
    "AI Agentic Certificate",
    "MKCL Certificate",
    "Astrovega Robotics Certificate",
  ]);
  assert.doesNotMatch(certificateSection, /The resume opens without a PIN\. Certificates require a four-digit PIN\./);
  assert.match(certificateSection, /href="\/assets\/kunal-singh-resume\.pdf" target="_blank" rel="noopener"/);
  assert.doesNotMatch(certificateSection.match(/<a class="certificate-card"[\s\S]*?<\/a>/)?.[0] ?? "", /data-certificate-id/);
  assert.match(certificateSection, /data-certificate-id="class-x"/);
  assert.match(certificateSection, /data-certificate-id="class-xii"/);
  assert.match(certificateSection, /data-certificate-id="mkcl"/);
  assert.match(certificateSection, /data-certificate-id="astrovega"/);
  const certificateStyles = await (await fetch(`${baseUrl}/css/style.css`)).text();
  assert.match(certificateStyles, /#certificates \.certificate-card \{ --neon-color: #ffd84a;/);
  assert.match(certificateStyles, /#certificates \.certificate-card:nth-child\(8n \+ 2\) \{ --neon-color: #61dafb; \}/);
  assert.match(certificateStyles, /#certificates \.certificate-card:nth-child\(8n \+ 7\) \{ --neon-color: #b89cff; \}/);
  assert.match(certificateStyles, /#certificates \.certificate-card:is\(:hover, :focus-visible, :active\) \{\s*border-color: color-mix\(in srgb, var\(--neon-color\) 82%, white\);/);
  assert.match(certificateStyles, /\.certificate-card:focus-visible > \.neon-frame,\s*\.certificate-card:active > \.neon-frame \{\s*opacity: 1;/);
  assert.match(certificateStyles, /\.certificate-card:focus-visible > \.neon-frame::after,\s*\.certificate-card:active > \.neon-frame::after \{\s*animation: neon-trail 2\.4s linear infinite;/);
  assert.equal((certificateSection.match(/class="certificate-card certificate-card--inactive" aria-disabled="true"/g) ?? []).length, 0);
  assert.match(homeHtml, /id="certificate-dialog"/);
  assert.match(homeHtml, /<h2 id="certificate-dialog-title">Protected Certificate<\/h2>/);
  assert.match(homeHtml, /Please enter your PIN to access this certificate\./);
  assert.match(homeHtml, /type="password" inputmode="numeric" autocomplete="one-time-code" pattern="\[0-9\]\{4\}" maxlength="4"/);
  assert.match(homeHtml, />Unlock Certificate<\/button>/);
  assert.match(homeHtml, />Cancel<\/button>/);
  const certificateAccessScript = await (await fetch(`${baseUrl}/js/certificate-access.js`)).text();
  assert.doesNotMatch(certificateAccessScript, /CERTIFICATE_PIN|1357/);
  assert.equal((certificateSection.match(/class="certificate-card certificate-card--inactive"/g) ?? []).length, 0);
  for (const certificateId of ["class-x", "class-xii", "scout-guide", "ai-agentic", "mkcl", "astrovega"]) {
    assert.match(certificateSection, new RegExp(`data-certificate-id="${certificateId}"`));
  }
  assert.doesNotMatch(certificateSection, /data-reveal/);
  assert.equal((certificateSection.match(/\bhref=/g) ?? []).length, 1);
  assert.doesNotMatch(certificateSection, /READY TO UPDATE|Certificate details|title, issuer|TITLE · ISSUER/);
  assert.ok(homeHtml.indexOf(certificateSection) < homeHtml.indexOf('id="skills"'), "Certificates should precede skills");
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

  const portrait = await fetch(`${baseUrl}/assets/gautam-hero.webp`);
  assert.equal(portrait.status, 200);
  assert.match(portrait.headers.get("content-type"), /image\/webp/);

  const lampAudio = await fetch(`${baseUrl}/assets/playht-voice-over.mp3`);
  assert.equal(lampAudio.status, 200);
  assert.match(lampAudio.headers.get("content-type"), /audio\/mpeg/);
  assert.ok(Number(lampAudio.headers.get("content-length")) > 0);

  const resume = await fetch(`${baseUrl}/assets/kunal-singh-resume.pdf`);
  assert.equal(resume.status, 200);
  assert.match(resume.headers.get("content-type"), /application\/pdf/);
  const resumeBytes = Buffer.from(await resume.arrayBuffer());
  assert.equal(resumeBytes.toString("ascii", 0, 5), "%PDF-");
  assert.doesNotMatch(resumeBytes.toString("latin1"), /\/Encrypt\b/);

  for (const resultPath of [
    "/results/class-xii-result-2246968.pdf",
    "/results/class-x-result-12221369.pdf",
  ]) {
    const result = await fetch(`${baseUrl}${resultPath}`);
    assert.equal(result.status, 404, `${resultPath} must not be publicly accessible`);
  }

  const invalidCertificatePin = await fetch(`${baseUrl}/api/certificates/class-x`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin: "0000" }),
  });
  assert.equal(invalidCertificatePin.status, 401);
  assert.match((await invalidCertificatePin.json()).error, /incorrect/i);

  const malformedCertificatePin = await fetch(`${baseUrl}/api/certificates/class-x`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin: "123" }),
  });
  assert.equal(malformedCertificatePin.status, 400);

  const missingCertificate = await fetch(`${baseUrl}/api/certificates/constructor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin: "1357" }),
  });
  assert.equal(missingCertificate.status, 404);

  for (const certificateId of ["class-x", "class-xii", "scout-guide", "ai-agentic", "mkcl", "astrovega"]) {
    const accessResponse = await fetch(`${baseUrl}/api/certificates/${certificateId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "1357" }),
    });
    assert.equal(accessResponse.status, 200);
    assert.equal(accessResponse.headers.get("cache-control"), "no-store");
    assert.match(accessResponse.headers.get("content-type"), /application\/pdf/);
    assert.equal(accessResponse.headers.get("content-disposition"), "inline");
    assert.equal(Buffer.from(await accessResponse.arrayBuffer()).toString("ascii", 0, 5), "%PDF-");
  }

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

  for (const localPath of ["/css/style.css", "/css/responsive.css", "/js/main.js", "/js/navigation.js", "/js/projects.js", "/js/skill-orbit.js", "/js/neural-network.js", "/js/contact.js", "/js/intro.js", "/js/certificate-access.js"]) {
    const asset = await fetch(`${baseUrl}${localPath}`);
    assert.equal(asset.status, 200, `${localPath} should load`);
  }
  const portfolioStyles = await (await fetch(`${baseUrl}/css/style.css`)).text();
  const neuralNetworkSvg = homeHtml.match(/<svg class="cosmic-scene__network"[\s\S]*?<\/svg>/)?.[0];
  assert.ok(neuralNetworkSvg, "Animated neural network should be present in the background");
  assert.equal((neuralNetworkSvg.match(/class="neural-node"/g) ?? []).length, 20);
  assert.equal((neuralNetworkSvg.match(/class="neural-link"/g) ?? []).length, 6);
  assert.match(neuralNetworkSvg, /pattern id="neural-network-pattern"/);
  const neuralNetworkScript = await (await fetch(`${baseUrl}/js/neural-network.js`)).text();
  assert.match(neuralNetworkScript, /node\.nextPulseAt = time \+ randomBetween/);
  assert.match(neuralNetworkScript, /node\.targetX = clamp\(node\.baseX \+ randomBetween/);
  assert.match(neuralNetworkScript, /link\.element\.setAttribute\("points", points\)/);
  assert.match(neuralNetworkScript, /navigator\.deviceMemory <= 2/);
  assert.match(neuralNetworkScript, /navigator\.hardwareConcurrency <= 2/);
  assert.match(neuralNetworkScript, /scheduleNextFrame\(active \? frameDelay : Math\.max\(0, nextActivityAt - time\)\)/);
  assert.match(neuralNetworkScript, /if \(positionsChanged\)/);
  assert.match(neuralNetworkScript, /if \(activityScheduled\) scheduleActivity\(performance\.now\(\)\)/);
  assert.match(portfolioStyles, /\.cosmic-scene__network\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;/);
  assert.match(portfolioStyles, /\.low-power \.neural-node,\s*\.low-power \.hero__character/);
  assert.match(portfolioStyles, /\.low-power \.neon-frame::after\s*\{\s*display:\s*none;/);
  const orbitNameStyle = portfolioStyles.match(/\.hero__orbit-name\s*\{[^}]*\}/)?.[0] ?? "";
  assert.match(orbitNameStyle, /font:\s*700 12px var\(--body\);/);
  assert.match(orbitNameStyle, /text-shadow:/);
  assert.doesNotMatch(orbitNameStyle, /\b(?:border|background|box-shadow)\s*:/);
  assert.match(portfolioStyles, /\.hero__stand\s*\{[^}]*border-radius:\s*50%;[^}]*#d0d5d9/);
  assert.match(portfolioStyles, /\.hero__stand\s*\{[^}]*width:\s*clamp\(260px,\s*84%,\s*520px\)/);
  assert.match(portfolioStyles, /\.hero__orbit-travel\s*\{\s*position:\s*absolute;\s*z-index:\s*0;\s*top:\s*50%;\s*left:\s*50%;\s*width:\s*0;\s*height:\s*0;/);
  assert.doesNotMatch(portfolioStyles, /\.hero__orbit::(?:before|after)/);
  assert.match(portfolioStyles, /\.hero__visual\s*\{[^}]*perspective:\s*900px;/);
  assert.doesNotMatch(portfolioStyles, /hero__neural|nerve-transfer|neuron-blink/);
  assert.doesNotMatch(portfolioStyles, /\.hero__orbit-logo::(?:before|after)\s*\{/);
  assert.match(portfolioStyles, /\.hero__orbit-logo\s*\{[^}]*width:\s*clamp\(38px,\s*4vw,\s*52px\);[^}]*height:\s*clamp\(38px,\s*4vw,\s*52px\);/);
  assert.match(portfolioStyles, /\.hero__orbit-logo\s*\{[^}]*border-radius:\s*8px;/);
  assert.match(portfolioStyles, /preserve-3d/);
  assert.match(portfolioStyles, /55%\s*\{\s*transform:\s*translate3d\(0, 0, 160px\);/);
  assert.match(portfolioStyles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\[data-reveal\] \{\s*opacity: 1;/);
  const skillOrbitScript = await (await fetch(`${baseUrl}/js/skill-orbit.js`)).text();
  assert.match(skillOrbitScript, /prefers-reduced-motion/);
  assert.match(skillOrbitScript, /translate3d\(\$\{Math\.sin\(angle\) \* radiusX\}px, 0px, \$\{-Math\.cos\(angle\) \* radiusZ\}px\)/);
  assert.match(skillOrbitScript, /radiusX: visual\.clientWidth \* 0\.38/);
  assert.match(skillOrbitScript, /radiusZ: visual\.clientHeight \* 0\.24/);
  assert.match(skillOrbitScript, /const angle = \(phase - rotation\) \* Math\.PI \/ 180/);
  assert.match(skillOrbitScript, /const frontness = -Math\.cos\(angle\)/);
  assert.match(skillOrbitScript, /const frontness = -Math\.cos\(\(phase - rotation\) \* Math\.PI \/ 180\)/);
  assert.match(skillOrbitScript, /easing: "cubic-bezier\(0\.42, 0, 0\.58, 1\)"/);
  assert.match(skillOrbitScript, /frontness > 0 \? "2" : "0"/);
  assert.match(skillOrbitScript, /const phase = 360 \* siblings\.indexOf\(orbiter\) \/ orbitCount/);
  assert.match(skillOrbitScript, /const pauseDuration = 1600/);
  assert.match(skillOrbitScript, /const totalDuration = duration \+ pauseDuration \* orbitCount/);
  assert.match(skillOrbitScript, /name\.animate\(\s*orbitLabelKeyframes\(phase, duration, pauseDuration, orbitCount\)/);
  assert.match(skillOrbitScript, /function orbitLabelKeyframes\(phase, duration, pauseDuration, orbitCount\)/);
  assert.match(skillOrbitScript, /const isFront = frontness > 0\.95/);
  assert.match(skillOrbitScript, /easing: "steps\(1, end\)"/);
  assert.match(skillOrbitScript, /labelAnimation\.playbackRate = playbackRate/);
  assert.match(skillOrbitScript, /animation\.currentTime = 0/);
  assert.match(skillOrbitScript, /for \(let stop = 0; stop <= orbitCount; stop\+\+\)/);
  assert.match(skillOrbitScript, /direct children of the hero visual/);
  assert.equal((skillOrbitScript.match(/addEventListener\("visibilitychange"/g) ?? []).length, 1);
  assert.match(skillOrbitScript, /reducedMotionQuery\.addEventListener\("change", updateAnimationState\)/);
  assert.match(skillOrbitScript, /portfolio:intro-complete/);
  assert.match(skillOrbitScript, /visibilityObserver\.observe\(heroVisual\)/);
  assert.match(skillOrbitScript, /"ResizeObserver" in window/);
  assert.match(portfolioStyles, /height:\s*min\(700px,\s*calc\(100svh - 150px\)\)/);
  const responsiveStyles = await (await fetch(`${baseUrl}/css/responsive.css`)).text();
  assert.match(responsiveStyles, /contact-section \{ grid-template-columns: 1fr;/);
  assert.match(responsiveStyles, /\.contact-statement \{ font-size: clamp\(39px, 10vw, 50px\); \}/);
  assert.match(responsiveStyles, /height:\s*min\(680px,\s*calc\(100svh - 150px\)\)/);
  assert.match(responsiveStyles, /grid-template-columns:\s*minmax\(0,\s*1fr\);\s*grid-template-rows:\s*auto minmax\(390px,\s*1fr\)/);
  assert.match(responsiveStyles, /height:\s*auto;\s*min-height:\s*max\(740px,\s*100svh\)/);
  assert.match(responsiveStyles, /padding:\s*max\(82px,\s*calc\(env\(safe-area-inset-top\) \+ 72px\)\)\s+18px\s+26px/);
  assert.match(responsiveStyles, /@media \(max-width: 380px\) \{\s*body \{\s*min-width: 0;/);
  assert.doesNotMatch(portfolioStyles + responsiveStyles, /backdrop-filter:\s*blur/);

  const projectsResponse = await fetch(`${baseUrl}/api/projects`);
  assert.equal(projectsResponse.status, 200);
  const projects = await projectsResponse.json();
  assert.equal(projects.length, 1);
  assert.ok(projects.every((project) => project.slug && project.title && project.accent));
  assert.ok(projects.every((project) => project.slug !== "lumen-studio"));
  assert.ok(projects.every((project) => project.slug !== "orbit-finance"));
  assert.ok(projects.every((project) => project.slug !== "signal-notes"));
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
      "(async () => { const app = require('./server'); const server = app.listen(0, async () => { try { const base = `http://127.0.0.1:${server.address().port}`; const home = await fetch(base); const projectsResponse = await fetch(`${base}/api/projects`); const projects = await projectsResponse.json(); if (home.status !== 200 || !(await home.text()).includes('Kunal Singh')) throw new Error('Vercel homepage failed'); if (projectsResponse.status !== 200 || projects.length !== 1) throw new Error('Vercel project API failed'); server.close(); } catch (error) { console.error(error); server.close(() => process.exitCode = 1); } }); })().catch(error => { console.error(error); process.exitCode = 1; })",
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
