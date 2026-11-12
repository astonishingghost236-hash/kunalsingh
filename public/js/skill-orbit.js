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
    const orbit = orbiter.parentElement;
    if (!orbit) throw new Error("Skill orbit item must be inside an orbit path.");

    const counterclockwise = orbit.classList.contains("hero__orbit--counterclockwise");
    const siblings = [...orbit.querySelectorAll(".hero__orbit-travel")];
    const startTime = duration * siblings.indexOf(orbiter) / siblings.length;
    const { angle, stretch } = updateOrbitScale(orbit, orbiter);
    const animation = orbiter.animate(
      orbitKeyframes(stretch, angle, counterclockwise),
      { duration, iterations: Number.POSITIVE_INFINITY, easing: "linear" },
    );
    const logo = orbiter.querySelector(".hero__orbit-logo");
    const logoAnimation = logo?.animate(
      logoKeyframes(stretch, angle, counterclockwise),
      { duration, iterations: Number.POSITIVE_INFINITY, easing: "linear" },
    );
    animation.pause();
    animation.currentTime = startTime;
    if (logoAnimation) {
      logoAnimation.pause();
      logoAnimation.currentTime = startTime;
    }
    orbiter.style.animation = "none";
    return { animation, logoAnimation, orbit, orbiter, counterclockwise };
  });
  document.documentElement.classList.add("skill-orbit-ready");

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        for (const item of animations) {
          if (item.orbit !== entry.target) continue;
          const { angle, stretch } = updateOrbitScale(item.orbit, item.orbiter);
          item.animation.effect?.setKeyframes(orbitKeyframes(stretch, angle, item.counterclockwise));
          item.logoAnimation?.effect?.setKeyframes(logoKeyframes(stretch, angle, item.counterclockwise));
        }
      }
    });
    for (const { orbit } of animations) resizeObserver.observe(orbit);
  }

  function orbitKeyframes(stretch, angle, counterclockwise) {
    const endAngle = counterclockwise ? -360 : 360;
    return [
      { transform: `rotate(${angle}deg) scaleX(${stretch}) rotate(0deg)` },
      { transform: `rotate(${angle}deg) scaleX(${stretch}) rotate(${endAngle}deg)` },
    ];
  }

  function logoKeyframes(stretch, angle, counterclockwise) {
    const endAngle = counterclockwise ? 360 : -360;
    const inverseStretch = 1 / stretch;
    return [
      { transform: `translate(-50%, -50%) rotate(0deg) scaleX(${inverseStretch}) rotate(${-angle}deg)` },
      { transform: `translate(-50%, -50%) rotate(${endAngle}deg) scaleX(${inverseStretch}) rotate(${-angle}deg)` },
    ];
  }

  function updateOrbitScale(orbit, orbiter) {
    const style = window.getComputedStyle(orbit);
    const width = Number.parseFloat(style.width);
    const height = Number.parseFloat(style.height);
    const stretch = width > 0 && height > 0 ? width / height : 1;
    const angle = Number.parseFloat(style.getPropertyValue("--orbit-angle")) || 0;
    orbiter.style.setProperty("--orbit-stretch", String(stretch));
    orbiter.querySelector(".hero__orbit-logo")?.style.setProperty("--orbit-counter-scale", String(1 / stretch));
    return { angle, stretch };
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
