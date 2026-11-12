export function initSkillOrbit() {
  if (typeof Element.prototype.animate !== "function") return;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const heroVisual = document.querySelector(".hero__visual");
  const orbiters = [...document.querySelectorAll(".hero__orbit-travel")];
  if (!heroVisual || orbiters.length === 0) return;

  let introFinished = !document.body.classList.contains("intro-open");
  let orbitVisible = !("IntersectionObserver" in window);
  const animations = orbiters.map((orbiter) => {
    const computedStyle = window.getComputedStyle(orbiter);
    const durationValue = computedStyle.getPropertyValue("--orbit-duration").trim();
    const duration = Number.parseFloat(durationValue) * (durationValue.endsWith("ms") ? 1 : 1000);
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("Skill orbit item must have a positive --orbit-duration.");
    }
    if (orbiter.parentElement !== heroVisual) {
      throw new Error("Skill orbit items must be direct children of the hero visual.");
    }

    const siblings = [...heroVisual.querySelectorAll(".hero__orbit-travel")];
    const startTime = duration * siblings.indexOf(orbiter) / siblings.length;
    const { angle, stretch, tilt } = updateOrbitScale(orbiter);
    const animation = orbiter.animate(
      orbitKeyframes(stretch, angle, tilt),
      { duration, iterations: Number.POSITIVE_INFINITY, easing: "linear" },
    );
    const logo = orbiter.querySelector(".hero__orbit-logo");
    const logoAnimation = logo?.animate(
      logoKeyframes(stretch, angle, tilt),
      { duration, iterations: Number.POSITIVE_INFINITY, easing: "linear" },
    );
    animation.pause();
    animation.currentTime = startTime;
    if (logoAnimation) {
      logoAnimation.pause();
      logoAnimation.currentTime = startTime;
    }
    orbiter.style.animation = "none";
    return { animation, logoAnimation, orbiter };
  });
  document.documentElement.classList.add("skill-orbit-ready");

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        for (const item of animations) {
          if (item.orbiter !== entry.target) continue;
          const { angle, stretch, tilt } = updateOrbitScale(item.orbiter);
          item.animation.effect?.setKeyframes(orbitKeyframes(stretch, angle, tilt));
          item.logoAnimation?.effect?.setKeyframes(logoKeyframes(stretch, angle, tilt));
        }
      }
    });
    for (const { orbiter } of animations) resizeObserver.observe(orbiter);
  }

  function orbitKeyframes(stretch, angle, tilt) {
    const transformAt = (rotation) => `rotateX(${tilt}deg) rotate(${angle}deg) scaleX(${stretch}) rotate(${rotation}deg)`;
    return [
      { offset: 0, transform: transformAt(0), opacity: 0.68, zIndex: "0" },
      { offset: 0.24, transform: transformAt(86.4), opacity: 0.86, zIndex: "0" },
      { offset: 0.25, transform: transformAt(90), opacity: 0.9, zIndex: "0" },
      { offset: 0.251, transform: transformAt(90.36), opacity: 0.9, zIndex: "2" },
      { offset: 0.5, transform: transformAt(180), opacity: 1, zIndex: "2" },
      { offset: 0.749, transform: transformAt(269.64), opacity: 0.9, zIndex: "2" },
      { offset: 0.75, transform: transformAt(270), opacity: 0.9, zIndex: "0" },
      { offset: 0.76, transform: transformAt(273.6), opacity: 0.86, zIndex: "0" },
      { offset: 1, transform: transformAt(360), opacity: 0.68, zIndex: "0" },
    ];
  }

  function logoKeyframes(stretch, angle, tilt) {
    const inverseStretch = 1 / stretch;
    const transformAt = (rotation) => `translate(-50%, -50%) rotate(${rotation}deg) scaleX(${inverseStretch}) rotate(${-angle}deg) rotateX(${-tilt}deg)`;
    return [
      { transform: transformAt(0) },
      { transform: transformAt(-360) },
    ];
  }

  function updateOrbitScale(orbiter) {
    const style = window.getComputedStyle(orbiter);
    const width = Number.parseFloat(style.width);
    const height = Number.parseFloat(style.height);
    const stretch = width > 0 && height > 0 ? width / height : 1;
    const angle = Number.parseFloat(style.getPropertyValue("--orbit-angle")) || 0;
    const tilt = Number.parseFloat(style.getPropertyValue("--orbit-tilt")) || 0;
    orbiter.style.setProperty("--orbit-stretch", String(stretch));
    orbiter.querySelector(".hero__orbit-logo")?.style.setProperty("--orbit-counter-scale", String(1 / stretch));
    return { angle, stretch, tilt };
  }

  function updateAnimationState() {
    const shouldPause = document.hidden || !introFinished || !orbitVisible;
    if (shouldPause) {
      animations.forEach(({ animation, logoAnimation }) => {
        animation.pause();
        logoAnimation?.pause();
      });
      return;
    }

    // Keep this requested decorative motion, but slow it down for reduced-motion users.
    const playbackRate = reducedMotionQuery.matches ? 0.45 : 1;
    animations.forEach(({ animation, logoAnimation }) => {
      animation.playbackRate = playbackRate;
      if (logoAnimation) logoAnimation.playbackRate = playbackRate;
      animation.play();
      logoAnimation?.play();
    });
  }
  if ("IntersectionObserver" in window) {
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      orbitVisible = entry.isIntersecting;
      updateAnimationState();
    }, { rootMargin: "80px 0px" });
    visibilityObserver.observe(heroVisual);
  }
  document.addEventListener("visibilitychange", updateAnimationState);
  document.addEventListener("portfolio:intro-complete", () => {
    introFinished = true;
    updateAnimationState();
  }, { once: true });
  reducedMotionQuery.addEventListener("change", updateAnimationState);
  updateAnimationState();
}
