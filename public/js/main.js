import { initNavigation } from "./navigation.js";
import { loadProjects } from "./projects.js";
import { initCosmicBackground } from "./cosmic-background.js";
import { initSkillOrbit } from "./skill-orbit.js";

initNavigation();
loadProjects();
initCosmicBackground();
initSkillOrbit();

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let revealObserver;

function observeReveals() {
  const revealTargets = document.querySelectorAll(
    ".section-heading, .about-grid, .about-facts, .education-card, .technology-card, .experience-row, .contact-section, .project-card",
  );

  if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => {
      target.dataset.reveal ||= "";
      target.classList.add("is-visible");
    });
    return;
  }

  revealObserver ??= new IntersectionObserver((entries, activeObserver) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      activeObserver.unobserve(entry.target);
    }
  }, { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });

  revealTargets.forEach((target) => {
    if (target.classList.contains("is-visible")) return;
    target.dataset.reveal ||= "";
    revealObserver.observe(target);
  });
}

observeReveals();
document.addEventListener("portfolio:content-ready", observeReveals);
reducedMotionQuery.addEventListener("change", observeReveals);
