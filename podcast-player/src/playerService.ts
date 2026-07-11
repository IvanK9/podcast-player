const audio = new Audio();
const trackTitle = document.querySelector<HTMLSpanElement>(
  ".player__track-title",
);
const trackArtist = document.querySelector<HTMLSpanElement>(
  ".player__track-artist",
);
const playBtn = document.querySelector<HTMLButtonElement>(
  ".controls__btn--play",
);
let isPlaying = false;

const currentTimeLabel =
  document.querySelector<HTMLSpanElement>(".timeline__current");
const totalTimeLabel =
  document.querySelector<HTMLSpanElement>(".timeline__total");
const progressBar = document.querySelector<HTMLInputElement>(
  ".timeline__progress-bar",
);
const volumeBar = document.querySelector<HTMLInputElement>(".volume__bar");
const prevBtn = document.querySelector<HTMLButtonElement>(
  ".controls__btn--prev",
);
const nextBtn = document.querySelector<HTMLButtonElement>(
  ".controls__btn--next",
);

interface SimpleEpisodeData {
  title: string;
  publisher: string;
  audioUrl: string;
}

export function syncTrackDataWithPlayer(data: SimpleEpisodeData): void {
  if (trackTitle) trackTitle.textContent = data.title;
  if (trackArtist) trackArtist.textContent = data.publisher;

  audio.src = data.audioUrl;

  isPlaying = true;
  updatePlayBtn();

  audio
    .play()
    .then()
    .catch((error) => {
      console.warn("Автозапуск заблокирован", error);
      isPlaying = false;
      updatePlayBtn();
    });
}

export function togglePlayback(): void {
  if (!audio.src) return;
  isPlaying = !isPlaying;
  if (isPlaying) {
    audio
      .play()
      .then()
      .catch((error) => {
        console.warn("Браузер заблокировал автозапуск:", error);
        isPlaying = false;
        updatePlayBtn();
      });
  } else {
    audio.pause();
  }
  updatePlayBtn();
}

function updatePlayBtn(): void {
  if (!playBtn) return;

  const path = playBtn.querySelector("svg path");
  if (!(path instanceof SVGPathElement)) return;

  if (isPlaying) {
    path.setAttribute("d", "M9 24h4V4H9v20zm8-20v20h4V4h-4z");
  } else {
    path.setAttribute(
      "d",
      "M10.345 23.287c.415 0 .763-.15 1.22-.407l12.742-7.404c.838-.481 1.178-.855 1.178-1.46 0-.599-.34-.972-1.178-1.462L11.565 5.158c-.457-.265-.805-.407-1.22-.407-.789 0-1.345.606-1.345 1.57V21.71c0 .971.556 1.577 1.345 1.577z",
    );
  }

  if (playBtn) {
    playBtn.addEventListener("click", togglePlayback);
  }
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const displaySecs = secs < 10 ? `0${secs}` : secs;

  if (hours > 0) {
    const displayMins = mins < 10 ? `0${mins}` : mins;
    return `${hours}:${displayMins}:${displaySecs}`;
  }
  return `${mins}:${displaySecs}`;
}

audio.addEventListener("loadedmetadata", () => {
  const duration = audio.duration;

  if (totalTimeLabel && duration && !isNaN(duration)) {
    totalTimeLabel.textContent = formatTime(duration);
  }

  if (progressBar) {
    progressBar.value = "0";
  }
});

audio.addEventListener("timeupdate", () => {
  const current = audio.currentTime;
  const duration = audio.duration;

  if (currentTimeLabel) {
    currentTimeLabel.textContent = formatTime(current);
  }

  if (duration && !isNaN(duration) && progressBar) {
    const progressPercent = (current / duration) * 100;
    progressBar.value = progressPercent.toString();
  }
});

if (progressBar) {
  progressBar.addEventListener("input", function (this: HTMLInputElement) {
    const duration = audio.duration;
    if (!duration || isNaN(duration)) return;

    const newTime = (parseFloat(this.value) / 100) * duration;
    audio.currentTime = newTime;
  });
}

if (volumeBar) {
  const defaultVolume = parseFloat(volumeBar.value) / 100;

  audio.volume = defaultVolume;

  volumeBar.addEventListener("input", function (this: HTMLInputElement) {
    const newVolume = parseFloat(this.value) / 100;

    audio.volume = newVolume;
  });
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (!audio.src) return;

    const newTime = Math.max(0, audio.currentTime - 15);

    audio.currentTime = newTime;
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (!audio.src) return;

    const newTime = Math.max(0, audio.currentTime + 30);

    audio.currentTime = newTime;
  });
}
