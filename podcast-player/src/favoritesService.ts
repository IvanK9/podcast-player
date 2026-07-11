const STORAGE_KEY = "podcast_player_favorites";

let favoritesList: string[] = [];

export function initFavorites(): void {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      favoritesList = JSON.parse(savedData) as string[];
    }
  } catch (error) {
    favoritesList = [];
  }
}

export function isEpisodeFavorite(episodeId: string): boolean {
  return favoritesList.includes(episodeId);
}

export function toggleFavorite(episodeId: string): boolean {
  const index = favoritesList.indexOf(episodeId);
  let isAdded = false;

  if (index === -1) {
    favoritesList.push(episodeId);
    isAdded = true;
  } else {
    favoritesList.splice(index, 1);
    isAdded = false;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritesList));

  return isAdded;
}

export function getFavoritesList(): string[] {
  return [...favoritesList];
}
