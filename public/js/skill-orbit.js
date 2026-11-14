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
    const { angle, tiltX, tiltY, stretch } = updateOrbitScale(orbiter);
    const animation = orbiter.animate(
      orbitKeyframes(stretch, angle, tiltX, tiltY, phase, duration, pauseDuration, orbitCount),
      { duration: totalDuration, iterations: Number.POSITIVE_INFINITY, easing: "linear" },
    );
    const logo = orbiter.querySelector(".hero__orbit-logo");
    const logoAnimation = logo?.animate(
      logoKeyframes(stretch, angle, tiltX, tiltY, phase, duration, pauseDuration, orbitCount),
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
          const { angle, tiltX, tiltY, stretch } = updateOrbitScale(item.orbiter);
          item.animation.effect?.setKeyframes(orbitKeyframes(
            stretch, angle, tiltX, tiltY, item.phase, item.duration, item.pauseDuration, item.orbitCount,
          ));
          item.logoAnimation?.effect?.setKeyframes(logoKeyframes(
            stretch, angle, tiltX, tiltY, item.phase, item.duration, item.pauseDuration, item.orbitCount,
          ));
        }
      }
    });
    for (const { orbiter } of animations) resizeObserver.observe(orbiter);
  }

  function orbitKeyframes(stretch, angle, tiltX, tiltY, phase, duration, pauseDuration, orbitCount) {
    const transformAt = (rotation) => `rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(${angle}deg) scaleX(${stretch}) rotateZ(${phase + rotation}deg)`;
    return synchronizedOrbitKeyframes(duration, pauseDuration, orbitCount, (rotation) => {
      const frontness = -Math.cos((phase + rotation) * Math.PI / 180);
      return {
        transform: transformAt(rotation),
        opacity: 0.72 + ((frontness + 1) / 2) * 0.28,
        zIndex: frontness > 0 ? "2" : "0",
      };
    });
  }

  function logoKeyframes(stretch, angle, tiltX, tiltY, phase, duration, pauseDuration, orbitCount) {
    const inverseStretch = 1 / stretch;
    const transformAt = (rotation) => `translate(-50%, -50%) rotateZ(${-phase - rotation}deg) scaleX(${inverseStretch}) rotateZ(${-angle}deg) rotateY(${-tiltY}deg) rotateX(${-tiltX}deg)`;
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
    const tiltX = Number.parseFloat(style.getPropertyValue("--orbit-tilt-x")) || 0;
    const tiltY = Number.parseFloat(style.getPropertyValue("--orbit-tilt-y")) || 0;
    orbiter.style.setProperty("--orbit-stretch", String(stretch));
    orbiter.querySelector(".hero__orbit-logo")?.style.setProperty("--orbit-counter-scale", String(1 / stretch));
    return { angle, tiltX, tiltY, stretch };
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
