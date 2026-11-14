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
    const orbitCount = siblings.length;
    const phase = 360 * siblings.indexOf(orbiter) / orbitCount;
    const pauseDuration = 1600;
    const totalDuration = duration + pauseDuration * orbitCount;
    const { angle, stretch } = updateOrbitScale(orbiter);
    const animation = orbiter.animate(
      orbitKeyframes(stretch, angle, phase, duration, pauseDuration, orbitCount),
      { duration: totalDuration, iterations: Number.POSITIVE_INFINITY, easing: "linear" },
    );
    const logo = orbiter.querySelector(".hero__orbit-logo");
    const logoAnimation = logo?.animate(
      logoKeyframes(stretch, angle, phase, duration, pauseDuration, orbitCount),
      { duration: totalDuration, iterations: Number.POSITIVE_INFINITY, easing: "linear" },
    );
    animation.pause();
    animation.currentTime = 0;
    if (logoAnimation) {
      logoAnimation.pause();
      logoAnimation.currentTime = 0;
    }
    orbiter.style.animation = "none";
    return { animation, logoAnimation, orbiter, phase, duration, pauseDuration, orbitCount };
  });
  document.documentElement.classList.add("skill-orbit-ready");

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        for (const item of animations) {
          if (item.orbiter !== entry.target) continue;
          const { angle, stretch } = updateOrbitScale(item.orbiter);
          item.animation.effect?.setKeyframes(orbitKeyframes(
            stretch, angle, item.phase, item.duration, item.pauseDuration, item.orbitCount,
          ));
          item.logoAnimation?.effect?.setKeyframes(logoKeyframes(
            stretch, angle, item.phase, item.duration, item.pauseDuration, item.orbitCount,
          ));
        }
      }
    });
    for (const { orbiter } of animations) resizeObserver.observe(orbiter);
  }

  function orbitKeyframes(stretch, angle, phase, duration, pauseDuration, orbitCount) {
    const transformAt = (rotation) => `rotate(${angle}deg) scaleX(${stretch}) rotate(${phase + rotation}deg)`;
    return synchronizedOrbitKeyframes(duration, pauseDuration, orbitCount, (rotation) => ({
      transform: transformAt(rotation),
      opacity: 1,
      zIndex: "1",
    }));
  }

  function logoKeyframes(stretch, angle, phase, duration, pauseDuration, orbitCount) {
    const inverseStretch = 1 / stretch;
    const transformAt = (rotation) => `translate(-50%, -50%) rotate(${-phase - rotation}deg) scaleX(${inverseStretch}) rotate(${-angle}deg)`;
    return synchronizedOrbitKeyframes(duration, pauseDuration, orbitCount, (rotation) => ({
      transform: transformAt(rotation),
    }));
  }

  function synchronizedOrbitKeyframes(duration, pauseDuration, orbitCount, frameAt) {
    const totalDuration = duration + pauseDuration * orbitCount;
    const keyframes = [];
    for (let stop = 0; stop <= orbitCount; stop++) {
      const rotation = 360 * stop / orbitCount;
      const movementEnd = duration * stop / orbitCount + pauseDuration * stop;
      const frame = frameAt(rotation);
      keyframes.push({ offset: movementEnd / totalDuration, ...frame });
      if (stop < orbitCount) {
        keyframes.push({ offset: (movementEnd + pauseDuration) / totalDuration, ...frame });
      }
    }
    return keyframes;
  }

  function updateOrbitScale(orbiter) {
    const style = window.getComputedStyle(orbiter);
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
