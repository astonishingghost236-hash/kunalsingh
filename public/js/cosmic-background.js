const canvas = document.querySelector(".cosmic-scene__canvas");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function addTwinklingStars() {
  const twinkleLayer = document.querySelector(".cosmic-scene__twinkles");
  if (!twinkleLayer || reducedMotion.matches) return;

  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 32; index += 1) {
    const star = document.createElement("span");
    star.className = "cosmic-scene__twinkle";
    star.style.setProperty("--twinkle-x", `${Math.random() * 100}%`);
    star.style.setProperty("--twinkle-y", `${Math.random() * 100}%`);
    star.style.setProperty("--twinkle-size", `${0.8 + Math.random() * 1.2}px`);
    star.style.setProperty("--twinkle-duration", `${2 + Math.random() * 4}s`);
    star.style.setProperty("--twinkle-delay", `${-Math.random() * 6}s`);
    fragment.append(star);
  }
  twinkleLayer.append(fragment);
}

export async function initCosmicBackground() {
  addTwinklingStars();
  if (!canvas || reducedMotion.matches) return;

  try {
    const THREE = await import("/vendor/three/three.module.js");
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 25;

    const points = [];
    const colors = [];
    const sizes = [];
    const palette = [
      new THREE.Color("#aaa0d3"),
      new THREE.Color("#e3dff0"),
      new THREE.Color("#8e9bbd"),
    ];

    for (let index = 0; index < 300; index += 1) {
      const x = (Math.random() - 0.5) * 46;
      const y = (Math.random() - 0.5) * 40;
      if (x < -5 && y > 1 && y < 13) continue;
      points.push(x, y, (Math.random() - 0.5) * 18);
      const color = palette[Math.floor(Math.random() * palette.length)];
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
      opacity: 0.63,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(geometry, material);
    scene.add(stars);

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    let pointerX = 0;
    let pointerY = 0;
    let animationFrame = 0;
    let sceneVisible = true;
    let pageVisible = !document.hidden;
    window.addEventListener("pointermove", (event) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 0.28;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 0.18;
    }, { passive: true });

    const animate = () => {
      if (!sceneVisible || !pageVisible) return;
      stars.rotation.y += 0.00012;
      camera.position.x += (pointerX - camera.position.x) * 0.018;
      camera.position.y += (-pointerY - camera.position.y) * 0.018;
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };

    document.addEventListener("visibilitychange", () => {
      pageVisible = !document.hidden;
      if (!pageVisible) window.cancelAnimationFrame(animationFrame);
      else animate();
    });

    if ("IntersectionObserver" in window) {
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        sceneVisible = entry.isIntersecting;
        if (!sceneVisible) window.cancelAnimationFrame(animationFrame);
        else animate();
      });
      visibilityObserver.observe(canvas);
    } else {
      sceneVisible = window.scrollY < canvas.clientHeight;
      if (sceneVisible) animate();
      window.addEventListener("scroll", () => {
        const isVisible = window.scrollY < canvas.clientHeight;
        if (isVisible === sceneVisible) return;
        sceneVisible = isVisible;
        if (sceneVisible) animate();
        else window.cancelAnimationFrame(animationFrame);
      }, { passive: true });
    }
  } catch (error) {
    console.warn("Cosmic canvas is unavailable; the CSS background remains active.", error);
  }
}
