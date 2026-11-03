const themes = {
  jet: { color: "#08090b" },
  midnight: { color: "#050713" },
  charcoal: { color: "#101311" },
  obsidian: { color: "#0a0d11" },
};

export function initThemeSwitcher() {
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const buttons = [...document.querySelectorAll("[data-theme-option]")];

  function applyTheme(name) {
    if (!Object.hasOwn(themes, name)) {
      throw new Error(`Unknown portfolio theme: ${name}`);
    }

    root.dataset.theme = name;
    if (themeColor) themeColor.content = themes[name].color;
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(button.dataset.themeOption === name));
    }
    document.dispatchEvent(new Event("portfolio:theme-change"));
  }

  try {
    const savedTheme = window.localStorage.getItem("portfolio-theme");
    if (savedTheme) applyTheme(savedTheme);
  } catch (error) {
    console.warn("Unable to restore the saved portfolio theme.", error);
  }

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const { themeOption } = button.dataset;
      applyTheme(themeOption);
      try {
        window.localStorage.setItem("portfolio-theme", themeOption);
      } catch (error) {
        console.warn("Unable to save the portfolio theme preference.", error);
      }
    });
  }
}
