const introScreen = document.querySelector("#intro-screen");
const lampCord = document.querySelector("#lamp-cord");
const siteShell = document.querySelector(".site-shell");
const mainContent = document.querySelector("#main-content");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

export function initWelcomeIntro() {
  if (!introScreen || !lampCord || !siteShell || !mainContent) return;

  document.body.classList.add("intro-open");
  siteShell.inert = true;
  lampCord.focus({ preventScroll: true });
  let opening = false;
  let pointerStartY = null;

  introScreen.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    if (opening) introScreen.focus({ preventScroll: true });
    else lampCord.focus({ preventScroll: true });
  });

  const turnOnLamp = () => {
    if (opening) return;
    opening = true;

    lampCord.disabled = true;
    introScreen.focus({ preventScroll: true });
    introScreen.classList.add("is-lit");
    playSwitchSound();

    window.setTimeout(() => {
      introScreen.classList.add("is-leaving");
      window.setTimeout(() => {
        introScreen.hidden = true;
        document.body.classList.remove("intro-open");
        siteShell.inert = false;
        mainContent.focus({ preventScroll: true });
      }, reducedMotion.matches ? 0 : 650);
    }, reducedMotion.matches ? 3000 : 2350);
  };

  const releaseCord = () => {
    if (pointerStartY === null) return;
    const pulled = Number.parseFloat(lampCord.style.getPropertyValue("--cord-pull")) || 0;
    pointerStartY = null;
    lampCord.classList.remove("is-pulling");
    lampCord.style.setProperty("--cord-pull", "0px");
    if (pulled >= 18) turnOnLamp();
  };

  lampCord.addEventListener("pointerdown", (event) => {
    if (opening || !event.isPrimary) return;
    pointerStartY = event.clientY;
    lampCord.classList.add("is-pulling");
    lampCord.setPointerCapture(event.pointerId);
  });

  lampCord.addEventListener("pointermove", (event) => {
    if (pointerStartY === null) return;
    const pull = Math.max(0, Math.min(event.clientY - pointerStartY, 34));
    lampCord.style.setProperty("--cord-pull", `${pull}px`);
  });

  lampCord.addEventListener("pointerup", releaseCord);
  lampCord.addEventListener("pointercancel", releaseCord);
  lampCord.addEventListener("click", turnOnLamp);
}

function playSwitchSound() {
  const AudioContext = window.AudioContext;
  if (!AudioContext) return;

  const audioContext = new AudioContext();
  void audioContext.resume().then(() => {
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(420, now);
    oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.18);
    volume.gain.setValueAtTime(0.0001, now);
    volume.gain.exponentialRampToValueAtTime(0.09, now + 0.025);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    oscillator.connect(volume);
    volume.connect(audioContext.destination);
    oscillator.onended = () => audioContext.close();
    oscillator.start(now);
    oscillator.stop(now + 0.43);
  }).catch((error) => {
    console.warn("Unable to play the lamp switch sound.", error);
    void audioContext.close();
  });
}
