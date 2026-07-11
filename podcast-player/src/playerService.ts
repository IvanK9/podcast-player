const audio = new Audio();
const trackTitle = document.querySelector<HTMLSpanElement>(
  ".player__track-title",
);
const trackArtist = document.querySelector<HTMLSpanElement>(
  ".player__track-artist",
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
}
