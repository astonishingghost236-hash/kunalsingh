export function initSkillOrbit() {
  if (typeof Element.prototype.animate !== "function") return;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const heroVisual = document.querySelector(".hero__visual");
  const orbiters = [...document.querySelectorAll(".hero__orbit-travel")];
  if (!heroVisual || orbiters.length === 0) return;

  let introFinished = !document.body.classList.contains("intro-open");
  let orbitVisible = !("IntersectionObserver" in window);
  const { radiusX, radiusZ } = getOrbitRadii(heroVisual);
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

    const name = orbiter.querySelector(".hero__orbit-name");
    if (!name) {
      throw new Error("Skill orbit items must include a name label.");
    }

    const siblings = [...heroVisual.querySelectorAll(".hero__orbit-travel")];
    const orbitCount = siblings.length;
    const phase = 360 * siblings.indexOf(orbiter) / orbitCount;
    const pauseDuration = 1600;
    const totalDuration = duration + pauseDuration * orbitCount;
    const animation = orbiter.animate(
      orbitKeyframes(radiusX, radiusZ, phase, duration, pauseDuration, orbitCount),
      { duration: totalDuration, iterations: Number.POSITIVE_INFINITY, easing: "linear" },
    );
    animation.pause();
    animation.currentTime = 0;
    const labelAnimation = name.animate(
      orbitLabelKeyframes(phase, duration, pauseDuration, orbitCount),
      { duration: totalDuration, iterations: Number.POSITIVE_INFINITY, easing: "linear" },
    );
    labelAnimation.pause();
    labelAnimation.currentTime = 0;
    orbiter.style.animation = "none";
    return { animation, labelAnimation, orbiter, phase, duration, pauseDuration, orbitCount };
  });
  document.documentElement.classList.add("skill-orbit-ready");

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => {
      const { radiusX, radiusZ } = getOrbitRadii(heroVisual);
      for (const item of animations) {
        item.animation.effect?.setKeyframes(orbitKeyframes(
          radiusX, radiusZ, item.phase, item.duration, item.pauseDuration, item.orbitCount,
        ));
      }
    });
    resizeObserver.observe(heroVisual);
  }

  function orbitKeyframes(radiusX, radiusZ, phase, duration, pauseDuration, orbitCount) {
    return synchronizedOrbitKeyframes(duration, pauseDuration, orbitCount, (rotation) => {
      const angle = (phase + rotation) * Math.PI / 180;
      const frontness = -Math.cos(angle);
      return {
        transform: `translate3d(${Math.sin(angle) * radiusX}px, 0px, ${-Math.cos(angle) * radiusZ}px)`,
        opacity: 0.72 + ((frontness + 1) / 2) * 0.28,
        zIndex: frontness > 0 ? "2" : "0",
      };
    });
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

  function orbitLabelKeyframes(phase, duration, pauseDuration, orbitCount) {
    const totalDuration = duration + pauseDuration * orbitCount;
    const keyframes = [];
    for (let stop = 0; stop <= orbitCount; stop++) {
      const rotation = 360 * stop / orbitCount;
      const movementEnd = duration * stop / orbitCount + pauseDuration * stop;
      const frontness = -Math.cos((phase + rotation) * Math.PI / 180);
      const isFront = frontness > 0.95;
      const labelFrame = {
        opacity: isFront ? 1 : 0,
        transform: isFront ? "translate(-50%, 0px)" : "translate(-50%, 4px)",
        easing: "steps(1, end)",
      };
      keyframes.push({ offset: movementEnd / totalDuration, ...labelFrame });
      if (stop < orbitCount) {
        const pauseEnd = movementEnd + pauseDuration;
        keyframes.push({ offset: pauseEnd / totalDuration, ...labelFrame });
        keyframes.push({
          offset: (pauseEnd + 1) / totalDuration,
          opacity: 0,
          transform: "translate(-50%, 4px)",
          easing: "steps(1, end)",
        });
      }
    }
    return keyframes;
  }

  function getOrbitRadii(visual) {
    return {
      radiusX: visual.clientWidth * 0.38,
      radiusZ: visual.clientHeight * 0.24,
    };
  }

  function updateAnimationState() {
    const shouldPause = document.hidden || !introFinished || !orbitVisible;
    if (shouldPause) {
      animations.forEach(({ animation, labelAnimation }) => {
        animation.pause();
        labelAnimation.pause();
      });
      return;
    }

    // Keep this requested decorative motion, but slow it down for reduced-motion users.
    const playbackRate = reducedMotionQuery.matches ? 0.45 : 1;
    animations.forEach(({ animation, labelAnimation }) => {
      animation.playbackRate = playbackRate;
      labelAnimation.playbackRate = playbackRate;
      animation.play();
      labelAnimation.play();
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
