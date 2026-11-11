export function initCertificateAccess() {
  const dialog = document.querySelector("#certificate-dialog");
  const form = document.querySelector("#certificate-pin-form");
  const pinInput = document.querySelector("#certificate-pin");
  const pinGroup = document.querySelector("#certificate-pin-inputs");
  const status = document.querySelector("#certificate-pin-status");
  const closeButton = document.querySelector(".certificate-dialog__close");
  const cancelButton = document.querySelector("#certificate-pin-cancel");
  let activeCertificate;
  let opener;
  let documentWindow;
  let pinRequest;
  let isSubmitting = false;

  function setStatus(message, state = "") {
    status.textContent = message;
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
  }

  function clearFeedback() {
    pinGroup.removeAttribute("data-state");
    setStatus("");
  }

  function resetDialog() {
    pinRequest?.abort();
    pinRequest = undefined;
    if (documentWindow && !documentWindow.closed) documentWindow.close();
    documentWindow = undefined;
    form.reset();
    pinInput.disabled = false;
    clearFeedback();
    activeCertificate = undefined;
    isSubmitting = false;
  }

  async function submitPin() {
    if (isSubmitting || !activeCertificate) return;

    const pin = pinInput.value;
    if (!/^\d{4}$/.test(pin)) {
      pinGroup.dataset.state = "invalid";
      setStatus("Enter your 4-digit PIN.", "invalid");
      pinInput.focus();
      return;
    }

    const openedWindow = window.open("about:blank", "_blank");
    if (!openedWindow) {
      setStatus("Please allow pop-ups to open your certificate, then try again.", "invalid");
      pinGroup.dataset.state = "invalid";
      return;
    }
    openedWindow.opener = null;
    documentWindow = openedWindow;

    const requestedCertificate = activeCertificate;
    pinRequest = new AbortController();
    isSubmitting = true;
    pinInput.disabled = true;
    setStatus("Checking PIN…");

    try {
      const response = await fetch(`/api/certificates/${requestedCertificate.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
        signal: pinRequest.signal,
      });

      if (!response.ok) {
        if (activeCertificate !== requestedCertificate) return;
        const result = await response.json();
        pinRequest = undefined;
        if (documentWindow && !documentWindow.closed) documentWindow.close();
        documentWindow = undefined;
        pinGroup.dataset.state = "invalid";
        setStatus(response.status === 401
          ? "Incorrect PIN! Please try again."
          : result.error || "Unable to verify this PIN.", "invalid");
        isSubmitting = false;
        pinInput.value = "";
        pinInput.disabled = false;
        pinInput.focus();
        return;
      }

      if (!response.headers.get("content-type")?.includes("application/pdf")) {
        throw new Error("The certificate server returned an invalid document.");
      }

      const documentBlob = await response.blob();
      if (activeCertificate !== requestedCertificate) {
        return;
      }
      pinRequest = undefined;
      const documentUrl = URL.createObjectURL(documentBlob);
      documentWindow.location.replace(documentUrl);
      window.setTimeout(() => URL.revokeObjectURL(documentUrl), 120_000);
      documentWindow = undefined;
      pinGroup.dataset.state = "valid";
      setStatus("PIN accepted. Opening your certificate…", "valid");
      isSubmitting = false;
      dialog.close();
    } catch (error) {
      if (error.name === "AbortError" || activeCertificate !== requestedCertificate) return;
      pinRequest = undefined;
      if (documentWindow && !documentWindow.closed) documentWindow.close();
      documentWindow = undefined;
      console.error("Unable to load certificate.", error);
      pinGroup.dataset.state = "invalid";
      setStatus(error instanceof TypeError
        ? "Certificate server unavailable. Start it with npm start, then try again."
        : "Unable to load the certificate. Please try again.", "invalid");
      isSubmitting = false;
      pinInput.value = "";
      pinInput.disabled = false;
      pinInput.focus();
    }
  }

  document.querySelectorAll("[data-certificate-id]").forEach((button) => {
    button.addEventListener("click", () => {
      resetDialog();
      activeCertificate = {
        id: button.dataset.certificateId,
      };
      opener = button;
      dialog.showModal();
      window.requestAnimationFrame(() => pinInput.focus());
    });
  });

  pinInput.addEventListener("input", () => {
    pinInput.value = pinInput.value.replace(/\D/g, "").slice(0, 4);
    clearFeedback();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitPin();
  });

  closeButton.addEventListener("click", () => dialog.close());
  cancelButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    resetDialog();
    opener?.focus();
    opener = undefined;
  });
}
