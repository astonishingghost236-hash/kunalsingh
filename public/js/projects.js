const projectGrid = document.querySelector("#projects-grid");

function createProjectCard(project) {
  const opensPortfolio = project.slug === "kunal-singh-portfolio";
  const card = document.createElement(opensPortfolio ? "a" : "article");
  card.className = "project-card";
  card.dataset.reveal = "";
  if (opensPortfolio) {
    card.href = "/";
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.setAttribute("aria-label", "Open Kunal Singh Portfolio website in a new tab");
  }

  const art = document.createElement("div");
  art.className = "project-card__art";
  art.style.setProperty("--project-accent", project.accent);
  art.style.setProperty("--art-bg", `radial-gradient(ellipse at 50% 44%, ${project.accent}20, transparent 65%), #11111a`);

  const kicker = document.createElement("span");
  kicker.className = "project-card__art-kicker";
  kicker.textContent = "PROJECT PREVIEW";
  const orb = document.createElement("span");
  orb.className = "project-card__art-orb";
  orb.setAttribute("aria-hidden", "true");
  art.append(kicker, orb);

  const info = document.createElement("div");
  info.className = "project-card__info";
  const details = document.createElement("div");
  const category = document.createElement("span");
  category.className = "project-card__category";
  category.textContent = project.category;
  const title = document.createElement("h3");
  title.textContent = project.title;
  const description = document.createElement("p");
  description.className = "project-card__description";
  description.textContent = project.description;
  details.append(category, title, description);
  const year = document.createElement("span");
  year.className = "project-card__year";
  year.textContent = project.year;
  info.append(details, year);
  card.append(art, info);
  return card;
}

export async function loadProjects() {
  if (!projectGrid) return;

  try {
    const response = await fetch("/api/projects");
    if (!response.ok) throw new Error(`Projects request failed (${response.status}).`);
    const projects = await response.json();
    projectGrid.replaceChildren(...projects.map(createProjectCard));
    projectGrid.setAttribute("aria-busy", "false");
    document.dispatchEvent(new Event("portfolio:content-ready"));
  } catch (error) {
    console.error("Unable to load portfolio projects.", error);
    const message = document.createElement("p");
    message.className = "projects-status";
    message.textContent = "Projects are unavailable right now. Please check back shortly.";
    projectGrid.replaceChildren(message);
    projectGrid.setAttribute("aria-busy", "false");
  }
}
