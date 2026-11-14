export function initNeuralNetwork() {
  const network = document.querySelector(".cosmic-scene__network");
  if (!network) return;

  const nodeElements = [...network.querySelectorAll(".neural-node")];
  const linkElements = [...network.querySelectorAll(".neural-link")];
  if (nodeElements.length === 0 || linkElements.length === 0) {
    throw new Error("The neural network must contain points and connecting lines.");
  }

  const nodes = nodeElements.map((element) => {
    const x = Number(element.getAttribute("cx"));
    const y = Number(element.getAttribute("cy"));
    const radius = Number(element.getAttribute("r"));
    if (![x, y, radius].every(Number.isFinite) || radius <= 0) {
      throw new Error("Neural network points must have valid coordinates and radii.");
    }

    return {
      element,
      baseX: x,
      baseY: y,
      x,
      y,
      lastX: element.getAttribute("cx"),
      lastY: element.getAttribute("cy"),
      lastRadius: element.getAttribute("r"),
      lastOpacity: element.getAttribute("opacity"),
      fromX: x,
      fromY: y,
      targetX: x,
      targetY: y,
      moveStart: 0,
      moveDuration: 1,
      nextMoveAt: 0,
      baseRadius: radius,
      baseOpacity: Number(element.getAttribute("opacity")) || 0.3,
      pulseStart: 0,
      pulseDuration: 1,
      nextPulseAt: 0,
    };
  });

  const links = linkElements.map((element) => {
    const indexes = (element.getAttribute("data-nodes") || "")
      .trim()
      .split(/\s+/)
      .map(Number);
    if (indexes.length < 2 || indexes.some((index) => !Number.isInteger(index) || !nodes[index])) {
      throw new Error("Neural network lines must reference valid points.");
    }
    return { element, indexes, lastPoints: element.getAttribute("points") };
  });

  const lowPowerDevice = (
    Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory <= 2
  ) || (
    Number.isFinite(navigator.hardwareConcurrency) && navigator.hardwareConcurrency <= 2
  );
  if (lowPowerDevice) document.documentElement.classList.add("low-power");

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let animationFrame = 0;
  let frameTimer = 0;
  let activityScheduled = false;

  function scheduleActivity(time) {
    for (const node of nodes) {
      node.fromX = node.x;
      node.fromY = node.y;
      node.targetX = node.x;
      node.targetY = node.y;
      node.moveStart = time;
      node.moveDuration = 1;
      node.nextMoveAt = time + randomBetween(500, 3000);
      node.pulseStart = time;
      node.pulseDuration = 1;
      node.nextPulseAt = time + randomBetween(100, 4500);
    }
    activityScheduled = true;
  }

  function animate(time) {
    animationFrame = 0;
    if (document.hidden) return;

    if (!activityScheduled) scheduleActivity(time);

    const reducedMotion = reducedMotionQuery.matches;
    const frameDelay = lowPowerDevice || reducedMotion ? 34 : 16;
    let active = false;
    let positionsChanged = false;
    let nextActivityAt = Number.POSITIVE_INFINITY;

    for (const node of nodes) {
      if (time >= node.nextMoveAt) {
        const movementRange = reducedMotion ? 12 : lowPowerDevice ? 18 : 30;
        node.fromX = node.x;
        node.fromY = node.y;
        node.targetX = clamp(node.baseX + randomBetween(-movementRange, movementRange), 8, 952);
        node.targetY = clamp(node.baseY + randomBetween(-movementRange, movementRange), 8, 712);
        node.moveStart = time;
        node.moveDuration = reducedMotion
          ? randomBetween(5000, 8500)
          : lowPowerDevice
            ? randomBetween(2800, 5000)
            : randomBetween(1900, 3900);
        node.nextMoveAt = time + node.moveDuration + randomBetween(400, 2400);
      }

      const progress = clamp((time - node.moveStart) / node.moveDuration, 0, 1);
      const easedProgress = progress * progress * (3 - 2 * progress);
      node.x = node.fromX + (node.targetX - node.fromX) * easedProgress;
      node.y = node.fromY + (node.targetY - node.fromY) * easedProgress;
      const x = node.x.toFixed(2);
      const y = node.y.toFixed(2);
      if (x !== node.lastX || y !== node.lastY) positionsChanged = true;
      if (x !== node.lastX) {
        node.element.setAttribute("cx", x);
        node.lastX = x;
      }
      if (y !== node.lastY) {
        node.element.setAttribute("cy", y);
        node.lastY = y;
      }
      if (progress < 1) active = true;

      if (time >= node.nextPulseAt) {
        node.pulseStart = time;
        node.pulseDuration = reducedMotion
          ? randomBetween(700, 1300)
          : lowPowerDevice
            ? randomBetween(500, 900)
            : randomBetween(250, 650);
        const restDuration = reducedMotion
          ? randomBetween(1300, 3200)
          : lowPowerDevice
            ? randomBetween(1500, 5000)
            : randomBetween(600, 4400);
        node.nextPulseAt = time + node.pulseDuration + restDuration;
      }

      const pulseProgress = (time - node.pulseStart) / node.pulseDuration;
      const pulse = pulseProgress >= 0 && pulseProgress <= 1
        ? Math.sin(Math.PI * pulseProgress)
        : 0;
      const radius = (node.baseRadius + pulse * 2.4).toFixed(2);
      const opacity = (node.baseOpacity + pulse * 0.72).toFixed(2);
      if (radius !== node.lastRadius) {
        node.element.setAttribute("r", radius);
        node.lastRadius = radius;
      }
      if (opacity !== node.lastOpacity) {
        node.element.setAttribute("opacity", opacity);
        node.lastOpacity = opacity;
      }
      if (pulseProgress >= 0 && pulseProgress <= 1) active = true;

      nextActivityAt = Math.min(nextActivityAt, node.nextMoveAt, node.nextPulseAt);
    }

    if (positionsChanged) {
      for (const link of links) {
        const points = link.indexes
          .map((index) => `${nodes[index].x.toFixed(2)},${nodes[index].y.toFixed(2)}`)
          .join(" ");
        if (points === link.lastPoints) continue;
        link.element.setAttribute("points", points);
        link.lastPoints = points;
      }
    }

    scheduleNextFrame(active ? frameDelay : Math.max(0, nextActivityAt - time));
  }

  function scheduleNextFrame(delay = 0) {
    if (animationFrame || frameTimer || document.hidden) return;
    if (delay > 0) {
      frameTimer = window.setTimeout(() => {
        frameTimer = 0;
        if (!document.hidden) {
          animationFrame = window.requestAnimationFrame(animate);
        }
      }, delay);
      return;
    }
    animationFrame = window.requestAnimationFrame(animate);
  }

  function updateAnimationState() {
    if (document.hidden) {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (frameTimer) window.clearTimeout(frameTimer);
      animationFrame = 0;
      frameTimer = 0;
      return;
    }

    if (!animationFrame && !frameTimer) {
      if (activityScheduled) scheduleActivity(performance.now());
      scheduleNextFrame();
    }
  }

  document.addEventListener("visibilitychange", updateAnimationState);
  reducedMotionQuery.addEventListener("change", updateAnimationState);
  updateAnimationState();
}

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(value, maximum));
}
