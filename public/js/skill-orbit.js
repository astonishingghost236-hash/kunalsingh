const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

export function initSkillOrbit() {
  if (typeof Element.prototype.animate !== "function") return;

  const orbiters = [...document.querySelectorAll(".hero__orbit-travel")];
  const animations = orbiters.map((orbiter) => {
    const computedStyle = window.getComputedStyle(orbiter);
    const durationValue = computedStyle.animationDuration;
    const duration = Number.parseFloat(durationValue) * (durationValue.endsWith("ms") ? 1 : 1000);
    const orbit = orbiter.parentElement;
    if (!orbit) throw new Error("Skill orbit item must be inside an orbit path.");

    const counterclockwise = orbit.classList.contains("hero__orbit--counterclockwise");
    const stretch = updateOrbitScale(orbit, orbiter);
    const animation = orbiter.animate(
      orbitKeyframes(stretch, counterclockwise),
      { duration, iterations: Number.POSITIVE_INFINITY, easing: "linear" },
    );

    animation.currentTime = Math.random() * duration;
    orbiter.style.animation = "none";
    return { animation, orbit, orbiter, counterclockwise };
  });

  let stopped = document.hidden || reducedMotion.matches;
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      for (const item of animations) {
        if (item.orbit !== entry.target) continue;
        const stretch = updateOrbitScale(item.orbit, item.orbiter);
        item.animation.effect?.setKeyframes(orbitKeyframes(stretch, item.counterclockwise));
      }
    }
  });
  for (const { orbit } of animations) resizeObserver.observe(orbit);

  function orbitKeyframes(stretch, counterclockwise) {
    const endAngle = counterclockwise ? -360 : 360;
    return [
      { transform: `scaleX(${stretch}) rotate(0deg)` },
      { transform: `scaleX(${stretch}) rotate(${endAngle}deg)` },
    ];
  }

  function updateOrbitScale(orbit, orbiter) {
    const style = window.getComputedStyle(orbit);
    const width = Number.parseFloat(style.width) + Number.parseFloat(style.borderLeftWidth) / 2 + Number.parseFloat(style.borderRightWidth) / 2;
    const height = Number.parseFloat(style.height) + Number.parseFloat(style.borderTopWidth) / 2 + Number.parseFloat(style.borderBottomWidth) / 2;
    const stretch = width / height;
    orbiter.style.setProperty("--orbit-stretch", String(stretch));
    orbiter.querySelector(".hero__orbit-logo")?.style.setProperty("--orbit-counter-scale", String(1 / stretch));
    return stretch;
  }

  function updateAnimationState() {
    stopped = document.hidden || reducedMotion.matches;
    if (stopped) {
      animations.forEach(({ animation }) => animation.pause());
      return;
    }

    animations.forEach(({ animation }) => animation.play());
  }

  document.addEventListener("visibilitychange", updateAnimationState);
  reducedMotion.addEventListener("change", updateAnimationState);
  updateAnimationState();
}
