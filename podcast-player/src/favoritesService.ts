import type { Episode, PlaybackProgress } from "./types";

const STORAGE_KEY = "podcast_player_favorites";
const PROGRESS_KEY = "podcast_player_playback_progress";

let favoritesList: Episode[] = [];

export function initFavorites(): void {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      favoritesList = JSON.parse(savedData);
    }
  } catch (error) {
    favoritesList = [];
  }
}

export function isEpisodeFavorite(episodeId: string): boolean {
  return favoritesList.some((ep) => ep.id === episodeId);
}

export function toggleFavorite(episode: Episode): boolean {
  const index = favoritesList.findIndex((ep) => ep.id === episode.id);
  let isAdded = false;

  if (index === -1) {
    const backup = [...favoritesList];
    const optimizedEpisode: Episode = {
      id: episode.id,
      title: episode.title,
      description: "",
      audio: episode.audio,
      audio_length_sec: episode.audio_length_sec,
      pub_date_ms: episode.pub_date_ms,
      image: episode.image || "",
      publisher: episode.publisher,
    };

    favoritesList.push(optimizedEpisode);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritesList));
      isAdded = true;
    } catch (e) {
      favoritesList = backup;
      alert("Хранилище браузера переполнено!");
      isAdded = false;
    }
  } else {
    favoritesList.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritesList));
    isAdded = false;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritesList));

  return isAdded;
}

export function getFavoritesList(): Episode[] {
  return [...favoritesList];
}

export function savePlaybackProgress(
  episodeId: string,
  currentTime: number,
): void {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    const progress: PlaybackProgress = data ? JSON.parse(data) : {};
    progress[episodeId] = currentTime;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error("Ошибка сохранения таймкода:", error);
  }
}

export function getResumePosition(episodeId: string): number {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    if (!data) return 0;
    const progress: PlaybackProgress = JSON.parse(data);
    const savedTime = progress[episodeId];
    if (!savedTime) return 0;

    const resumeTime = savedTime - 10;
    return resumeTime > 0 ? resumeTime : 0;
  } catch (erorr) {
    return 0;
  }
}
