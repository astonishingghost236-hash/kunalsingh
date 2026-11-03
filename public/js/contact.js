const web3FormsEndpoint = "https://api.web3forms.com/submit";
const maxImageSize = 1_000_000;

export function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!(form instanceof HTMLFormElement)) return;

  const attachmentInput = form.querySelector("#contact-attachment");
  const preview = form.querySelector("#attachment-preview");
  const previewImage = form.querySelector("#attachment-preview-image");
  const previewName = form.querySelector("#attachment-preview-name");
  const status = form.querySelector("#contact-status");
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = submitButton?.querySelector("[data-submit-label]");

  if (
    !(attachmentInput instanceof HTMLInputElement)
    || !(preview instanceof HTMLElement)
    || !(previewImage instanceof HTMLImageElement)
    || !(previewName instanceof HTMLElement)
    || !(status instanceof HTMLElement)
    || !(submitButton instanceof HTMLButtonElement)
    || !(submitLabel instanceof HTMLElement)
  ) {
    throw new Error("The contact form is missing a required element.");
  }

  let previewUrl = "";

  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = "";
    preview.hidden = true;
    previewImage.removeAttribute("src");
    previewName.textContent = "";
    attachmentInput.setCustomValidity("");
  }

  attachmentInput.addEventListener("change", () => {
    clearPreview();
    const [image] = attachmentInput.files ?? [];
    if (!image) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      attachmentInput.setCustomValidity("Choose a JPG, PNG, or WebP image.");
      status.textContent = "Choose a JPG, PNG, or WebP image.";
      status.classList.add("is-error");
      return;
    }

    if (image.size > maxImageSize) {
      attachmentInput.setCustomValidity("The image must be 1 MB or smaller.");
      status.textContent = "That image is larger than 1 MB. Choose a smaller image.";
      status.classList.add("is-error");
      return;
    }

    status.textContent = "";
    status.classList.remove("is-error");
    previewUrl = URL.createObjectURL(image);
    previewImage.src = previewUrl;
    previewName.textContent = image.name;
    preview.hidden = false;
  });

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
      clearPreview();
      status.textContent = "Thanks — your message has been sent. I’ll get back to you soon.";
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
