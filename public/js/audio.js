const voiceover = document.querySelector("#voice-over");
const playbackButton = document.querySelector("#audio-start");

export function initVoiceover() {
  if (!(voiceover instanceof HTMLAudioElement) || !(playbackButton instanceof HTMLButtonElement)) {
    throw new Error("The voice-over audio or playback button is missing.");
  }

  function showPlaybackButton(label) {
    playbackButton.textContent = label;
    playbackButton.disabled = false;
    playbackButton.hidden = false;
  }

  async function playVoiceover() {
    playbackButton.disabled = true;
    try {
      await voiceover.play();
      playbackButton.hidden = true;
    } catch (error) {
      const autoplayBlocked = error instanceof DOMException && error.name === "NotAllowedError";
      if (!autoplayBlocked) {
        console.error("Unable to play the portfolio voice-over.", error);
      }
      showPlaybackButton(autoplayBlocked ? "Play voice-over" : "Retry voice-over");
    }
  }

  playbackButton.addEventListener("click", () => {
    void playVoiceover();
  });
  voiceover.addEventListener("ended", () => showPlaybackButton("Replay voice-over"));
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    if (voiceover.ended) voiceover.currentTime = 0;
    if (voiceover.paused) void playVoiceover();
  });
  void playVoiceover();
}
