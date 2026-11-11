const canvas = document.querySelector(".cosmic-scene__canvas");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function addTwinklingStars() {
  const twinkleLayer = document.querySelector(".cosmic-scene__twinkles");
  if (!twinkleLayer || reducedMotion.matches) return;

  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 16; index += 1) {
    const star = document.createElement("span");
    star.className = "cosmic-scene__twinkle";
    star.style.setProperty("--twinkle-x", `${Math.random() * 100}%`);
    star.style.setProperty("--twinkle-y", `${Math.random() * 100}%`);
    star.style.setProperty("--twinkle-size", `${0.8 + Math.random() * 1.2}px`);
    star.style.setProperty("--twinkle-duration", `${7 + Math.random() * 7}s`);
    star.style.setProperty("--twinkle-delay", `${-Math.random() * 14}s`);
    fragment.append(star);
  }
  twinkleLayer.append(fragment);
}

function addHeroTwinkles() {
  const twinkleLayer = document.querySelector(".hero__twinkles");
  if (!twinkleLayer || reducedMotion.matches) return;

  const fragment = document.createDocumentFragment();
  const starCount = window.matchMedia("(max-width: 760px)").matches ? 16 : 30;
  for (let index = 0; index < starCount; index += 1) {
    const star = document.createElement("span");
    star.className = "hero__twinkle";
    star.style.setProperty("--twinkle-x", `${Math.random() * 100}%`);
    star.style.setProperty("--twinkle-y", `${Math.random() * 100}%`);
    star.style.setProperty("--twinkle-size", `${0.7 + Math.random() * 1.4}px`);
    star.style.setProperty("--twinkle-duration", `${7 + Math.random() * 7}s`);
    star.style.setProperty("--twinkle-delay", `${-Math.random() * 14}s`);
    fragment.append(star);
  }
  twinkleLayer.append(fragment);
}

export async function initCosmicBackground() {
  addTwinklingStars();
  addHeroTwinkles();
  if (!canvas || reducedMotion.matches) return;

  let introFinished = !document.body.classList.contains("intro-open");
  document.addEventListener("portfolio:intro-complete", () => {
    introFinished = true;
  }, { once: true });

  try {
    const THREE = await import("/vendor/three/three.module.js");
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 25;
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const points = [];
    const colors = [];
    const sizes = [];
    const palette = ["--accent", "--chrome", "--accent-secondary"];
    const paletteStyle = getComputedStyle(document.documentElement);
    const themeColors = palette.map((property) => new THREE.Color(paletteStyle.getPropertyValue(property).trim()));
    const isSmallScreen = window.matchMedia("(max-width: 760px)").matches;
    const starCount = isSmallScreen ? 45 : 90;

    while (points.length / 3 < starCount) {
      const x = (Math.random() - 0.5) * 46;
      const y = (Math.random() - 0.5) * 40;
      if (x < -5 && y > 1 && y < 13) continue;
      points.push(x, y, (Math.random() - 0.5) * 18);
      const color = themeColors[Math.floor(Math.random() * themeColors.length)];
      colors.push(color.r, color.g, color.b);
      sizes.push(Math.random() > 0.96 ? 1.6 : 0.7);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.12,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(geometry, material);
    scene.add(stars);

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmallScreen ? 1 : 1.25));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    let resizeFrame = 0;
    const scheduleResize = () => {
      if (resizeFrame) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        resize();
      });
    };
    resize();
    window.addEventListener("resize", scheduleResize, { passive: true });

    let pointerX = 0;
    let pointerY = 0;
    let animationFrame = 0;
    let sceneVisible = false;
    let pageVisible = !document.hidden;
    let lastRenderTime = 0;
    let initialized = false;
    const frameInterval = 1000 / 30;
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      window.addEventListener("pointermove", (event) => {
        pointerX = (event.clientX / window.innerWidth - 0.5) * 0.28;
        pointerY = (event.clientY / window.innerHeight - 0.5) * 0.18;
      }, { passive: true });
    }

    const animate = (timestamp) => {
      animationFrame = 0;
      if (!initialized || !introFinished || !sceneVisible || !pageVisible) return;
      if (timestamp - lastRenderTime >= frameInterval) {
        lastRenderTime = timestamp;
        stars.rotation.y += 0.00012;
        camera.position.x += (pointerX - camera.position.x) * 0.018;
        camera.position.y += (-pointerY - camera.position.y) * 0.018;
        renderer.render(scene, camera);
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const updateAnimationState = () => {
      pageVisible = !document.hidden;
      if (!pageVisible || !introFinished || !sceneVisible) {
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        return;
      }
      if (!animationFrame) {
        lastRenderTime = 0;
        animationFrame = window.requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", updateAnimationState);
    document.addEventListener("portfolio:intro-complete", updateAnimationState, { once: true });

    if ("IntersectionObserver" in window) {
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        sceneVisible = entry.isIntersecting;
        updateAnimationState();
      });
      visibilityObserver.observe(hero);
    } else {
      let visibilityFrame = 0;
      const scheduleVisibilityCheck = () => {
        if (visibilityFrame) return;
        visibilityFrame = window.requestAnimationFrame(() => {
          visibilityFrame = 0;
          const bounds = hero.getBoundingClientRect();
          sceneVisible = bounds.bottom > 0 && bounds.top < window.innerHeight;
          updateAnimationState();
        });
      };
      window.addEventListener("scroll", scheduleVisibilityCheck, { passive: true });
      window.addEventListener("resize", scheduleVisibilityCheck, { passive: true });
      scheduleVisibilityCheck();
    }

    initialized = true;
    updateAnimationState();
  } catch (error) {
    console.warn("Cosmic canvas is unavailable; the CSS background remains active.", error);
  }
}
