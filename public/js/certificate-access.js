export function initCertificateAccess() {
  const dialog = document.querySelector("#certificate-dialog");
  const pinView = document.querySelector("#certificate-pin-view");
  const form = document.querySelector("#certificate-pin-form");
  const pinInputs = [...document.querySelectorAll(".certificate-pin-inputs input")];
  const pinGroup = document.querySelector("#certificate-pin-inputs");
  const status = document.querySelector("#certificate-pin-status");
  const documentView = document.querySelector("#certificate-document-view");
  const documentFrame = document.querySelector("#certificate-document");
  const closeButton = document.querySelector(".certificate-dialog__close");
  let activeCertificate;
  let opener;
  let documentUrl;
  let revealTimeout;
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

  function preparePinRetry() {
    isSubmitting = false;
    pinInputs.forEach((input) => {
      input.value = "";
      input.disabled = false;
    });
    pinInputs[0].focus();
  }

  function resetDialog() {
    pinRequest?.abort();
    pinRequest = undefined;
    window.clearTimeout(revealTimeout);
    documentUrl = "";
    documentFrame.removeAttribute("src");
    documentFrame.title = "Certificate document";
    documentView.hidden = true;
    pinView.hidden = false;
    form.reset();
    pinInputs.forEach((input) => {
      input.disabled = false;
    });
    clearFeedback();
    activeCertificate = undefined;
    isSubmitting = false;
  }

  function distributeDigits(value, startIndex = 0) {
    const digits = value.replace(/\D/g, "");
    for (let offset = 0; offset < digits.length && startIndex + offset < pinInputs.length; offset += 1) {
      pinInputs[startIndex + offset].value = digits[offset];
    }

    const nextInput = pinInputs[Math.min(startIndex + digits.length, pinInputs.length - 1)];
    nextInput.focus();
    updatePin();
  }

  function updatePin() {
    if (isSubmitting) return;
    clearFeedback();
    if (pinInputs.every((input) => input.value.length === 1)) submitPin();
  }

  async function submitPin() {
    if (isSubmitting || !activeCertificate) return;

    const pin = pinInputs.map((input) => input.value).join("");
    if (!/^\d{6}$/.test(pin)) return;

    const requestedCertificate = activeCertificate;
    pinRequest = new AbortController();
    isSubmitting = true;
    pinInputs.forEach((input) => {
      input.disabled = true;
    });
    setStatus("Checking PIN…");

    try {
      const response = await fetch(`/api/certificates/${requestedCertificate.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
        signal: pinRequest.signal,
      });

      if (!response.ok) {
        const result = await response.json();
        if (activeCertificate !== requestedCertificate) return;
        pinRequest = undefined;
        pinGroup.dataset.state = "invalid";
        setStatus(response.status === 503
          ? "Certificate access is not configured on the server."
          : result.error || "Unable to verify this PIN.", "invalid");
        preparePinRetry();
        return;
      }

      const result = await response.json();
      if (typeof result.documentUrl !== "string" || !result.documentUrl.startsWith("/api/certificates/")) {
        throw new Error("The certificate server returned an invalid document URL.");
      }

      documentUrl = result.documentUrl;
      if (activeCertificate !== requestedCertificate) {
        documentUrl = "";
        return;
      }
      pinRequest = undefined;
      pinGroup.dataset.state = "valid";
      setStatus("PIN accepted. Opening your certificate…", "valid");
      revealTimeout = window.setTimeout(() => {
        pinView.hidden = true;
        documentView.hidden = false;
        documentFrame.title = `${activeCertificate.label} document`;
        documentFrame.src = documentUrl;
        isSubmitting = false;
      }, 2000);
    } catch (error) {
      if (error.name === "AbortError" || activeCertificate !== requestedCertificate) return;
      pinRequest = undefined;
      console.error("Unable to load certificate.", error);
      pinGroup.dataset.state = "invalid";
      setStatus(error instanceof TypeError
        ? "Certificate server unavailable. Start it with npm start, then try again."
        : "Unable to load the certificate. Please try again.", "invalid");
      preparePinRetry();
    }
  }

  document.querySelectorAll("[data-certificate-id]").forEach((button) => {
    button.addEventListener("click", () => {
      resetDialog();
      activeCertificate = {
        id: button.dataset.certificateId,
        label: button.getAttribute("aria-label")?.replace(/^View /, "") ?? "Certificate",
      };
      opener = button;
      dialog.showModal();
      window.requestAnimationFrame(() => pinInputs[0].focus());
    });
  });

  pinInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      const digits = input.value.replace(/\D/g, "");
      if (digits.length > 1) {
        input.value = "";
        distributeDigits(digits, index);
        return;
      }

      input.value = digits;
      if (digits && index < pinInputs.length - 1) pinInputs[index + 1].focus();
      updatePin();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !input.value && index > 0) {
        pinInputs[index - 1].focus();
      } else if (event.key === "ArrowLeft" && index > 0) {
        pinInputs[index - 1].focus();
      } else if (event.key === "ArrowRight" && index < pinInputs.length - 1) {
        pinInputs[index + 1].focus();
      }
    });

    input.addEventListener("paste", (event) => {
      const pastedText = event.clipboardData?.getData("text") ?? "";
      if (!/\d/.test(pastedText)) return;
      event.preventDefault();
      distributeDigits(pastedText, index);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitPin();
  });

  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    resetDialog();
    opener?.focus();
    opener = undefined;
  });
}
