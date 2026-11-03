const web3FormsEndpoint = "https://api.web3forms.com/submit";

export function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!(form instanceof HTMLFormElement)) return;

  const status = form.querySelector("#contact-status");
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = submitButton?.querySelector("[data-submit-label]");

  if (
    !(status instanceof HTMLElement)
    || !(submitButton instanceof HTMLButtonElement)
    || !(submitLabel instanceof HTMLElement)
  ) {
    throw new Error("The contact form is missing a required element.");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.classList.remove("is-error");
    status.textContent = "Sending your message…";

    submitButton.disabled = true;
    submitLabel.textContent = "Sending…";

    try {
      const response = await fetch(web3FormsEndpoint, {
        method: "POST",
        body: new FormData(form),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Your message could not be sent. Please try again.");
      }
      form.reset();
      status.textContent = "";
    } catch (error) {
      status.textContent = error instanceof Error
        ? error.message
        : "Something went wrong. Please try again.";
      status.classList.add("is-error");
    } finally {
      submitButton.disabled = false;
      submitLabel.textContent = "Send a message";
    }
  });
}
