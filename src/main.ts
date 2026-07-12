import { fetchFromListenNotes } from "./api";
import type { Episode, Podcast, PodcastDetails } from "./types";
import { formatTime, syncTrackDataWithPlayer } from "./playerService";
import {
  initFavorites,
  isEpisodeFavorite,
  toggleFavorite,
  getFavoritesList,
  getResumePosition,
} from "./favoritesService";

const searchInput = document.querySelector("#search");
const searchTitle = document.querySelector<HTMLHeadingElement>(
  ".content__search-result-title",
);

const contentPodcasts: HTMLElement | null =
  document.querySelector(".content__podcasts");

const homeBtn = document.querySelector<HTMLButtonElement>(
  ".podcast__nav-item--home",
);
const savedBtn = document.querySelector<HTMLButtonElement>(
  ".podcast__nav-item--saved",
);

function removeContent(wrapper: HTMLElement) {
  while (wrapper.firstChild) {
    wrapper.removeChild(wrapper.firstChild);
  }
}

function renderPodcasts(podcasts: Podcast[]) {
  if (!contentPodcasts) return;

  removeContent(contentPodcasts);

  if (!podcasts || podcasts.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.classList.add("podcasts__empty");
    emptyMessage.textContent = "Подкасты не найдены";
    contentPodcasts.appendChild(emptyMessage);
    return;
  }

  const fragment = document.createDocumentFragment();

  podcasts.forEach((podcast) => {
    const cardElement = createPodcastCard(podcast);
    fragment.appendChild(cardElement);
  });

  contentPodcasts.appendChild(fragment);
}

function createPodcastCard(podcast: Podcast): HTMLElement {
  const card = document.createElement("article");
  card.classList.add("podcasts__card", "card");
  card.setAttribute("data-id", podcast.id);

  const imgWrapper = document.createElement("div");
  imgWrapper.classList.add("card__image-wrapper");
  const DEFAULT_PLACEHOLDER = "https://placehold.co/400";

  const img = document.createElement("img");
  img.classList.add("card__img");
  img.src = podcast.thumbnail ?? DEFAULT_PLACEHOLDER;
  img.alt = podcast.title;
  img.loading = "lazy";

  imgWrapper.appendChild(img);

  const infoWrapper = document.createElement("div");
  infoWrapper.classList.add("card__description");

  const title = document.createElement("h3");
  title.classList.add("card__title");
  title.textContent = podcast.title;

  const author = document.createElement("p");
  author.classList.add("card__author");
  author.textContent = podcast.publisher;

  infoWrapper.appendChild(title);
  infoWrapper.appendChild(author);
  card.appendChild(imgWrapper);
  card.appendChild(infoWrapper);

  return card;
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay = 500) {
  let timerId: ReturnType<typeof setTimeout> | undefined;

  return function (this: any, ...args: Parameters<T>) {
    if (timerId) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

async function loadDefaultPodcast(): Promise<void> {
  if (searchTitle) searchTitle.style.display = "none";
  toggleLoader(true);

  try {
    const data = await fetchFromListenNotes({
      endpoint: "best_podcasts",
      params: {
        sort: "recent_published_first",
        page: "1",
      },
    });
    renderPodcasts(data.podcasts);
  } catch (error) {
    console.error("Ошибка загрузки дефолтных подкастов", error);
  } finally {
    toggleLoader(false);
  }
}

async function performSearch(query: string): Promise<void> {
  toggleLoader(true);

  try {
    const data = await fetchFromListenNotes({
      endpoint: "search",
      params: {
        q: query,
        type: "podcast",
      },
    });

    renderPodcasts(data.results);
    if (searchTitle) {
      searchTitle.textContent = `Результаты поиска по запросу: "${query}"`;
      searchTitle.style.display = "block";
    }
  } catch (error) {
    console.error("Ошибка при выполнении поиска", error);
  } finally {
    toggleLoader(false);
  }
}

function toggleLoader(isLoading: boolean): void {
  if (!contentPodcasts) return;

  if (isLoading) {
    removeContent(contentPodcasts);
    const spinnerElement = createSpinner();
    contentPodcasts.appendChild(spinnerElement);
  } else {
    const spinnerWrapper = contentPodcasts.querySelector(".spinner__wrapper");
    if (spinnerWrapper) {
      contentPodcasts.removeChild(spinnerWrapper);
    }
  }
}

const handleSearchInputWithDebounce = debounce((query: string) => {
  const trimmedQuery = query.trim();

  if (trimmedQuery === "") {
    loadDefaultPodcast();
  } else {
    performSearch(trimmedQuery);
  }
}, 500);

function createSpinner(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.classList.add("spinner__wrapper");

  const spinner = document.createElement("div");
  spinner.classList.add("spinner__main");

  wrapper.appendChild(spinner);
  return wrapper;
}

function handlePodcastClick(event: Event): void {
  if (!(event.target instanceof HTMLElement)) return;

  const cardElement = event.target.closest(".card");

  if (cardElement && cardElement instanceof HTMLElement) {
    const podcastId = cardElement.getAttribute("data-id");
    if (podcastId) {
      loadPodcastDetails(podcastId);
    }
    return;
  }

  const episode = event.target.closest(".episode-row");
  const favBtn = event.target.closest(".episode-row__fav-btn");

  const getEpisode = (episode: HTMLElement): Episode => {
    const titleEl = episode.querySelector(".episode-row__title");

    const parsedDate = Number(episode.getAttribute("data-pub-date"));
    const safeDate = isNaN(parsedDate) ? 0 : parsedDate;

    const parsedDuration = Number(episode.getAttribute("data-duration"));
    const safeDuration = isNaN(parsedDuration) ? 0 : parsedDuration;

    return {
      id: episode.getAttribute("data-episode-id") ?? "",
      audio: episode.getAttribute("data-audio-url") ?? "",
      title: titleEl ? (titleEl.textContent ?? "Без названия") : "Без названия",
      audio_length_sec: safeDuration,
      pub_date_ms: safeDate,
      image: episode.getAttribute("data-image") ?? "",
      description: "",
      publisher: episode.getAttribute("data-publisher") ?? "Неизвестный автор",
    };
  };

  if (favBtn instanceof HTMLButtonElement && episode instanceof HTMLElement) {
    event.stopPropagation();

    const episodeData = getEpisode(episode);

    if (episodeData.id) {
      const isNowFavorite = toggleFavorite(episodeData);

      if (isNowFavorite) {
        favBtn.textContent = "♥";
        favBtn.classList.add("episode-row__fav-btn--active");
      } else {
        favBtn.textContent = "♡";
        favBtn.classList.remove("episode-row__fav-btn--active");

        const isPlaylistPage = document.querySelector(".saved-playlist-marker");

        if (isPlaylistPage) {
          episode.remove();
          const remainingRows = contentPodcasts
            ? contentPodcasts.querySelectorAll(".episode-row")
            : [];
          if (remainingRows.length === 0) {
            renderSavedPage();
          }
        }
      }
    }
    return;
  }

  if (episode && episode instanceof HTMLElement) {
    const episodeData = getEpisode(episode);

    if (episodeData.audio && episodeData.id) {
      const startTime = getResumePosition(episodeData.id);

      syncTrackDataWithPlayer({
        id: episodeData.id,
        title: episodeData.title,
        publisher: episodeData.publisher ?? "Неизвестный автор",
        audioUrl: episodeData.audio,
        startTime: startTime,
      });
    }
  }
}

async function loadPodcastDetails(id: string): Promise<void> {
  if (!contentPodcasts) return;

  toggleLoader(true);

  try {
    const data = await fetchFromListenNotes({
      endpoint: `podcasts/${id}`,
      params: {
        next_episode_pub_date: "0",
      },
    });
    renderPodcastPage(data);
    toggleLoader(false);
  } catch (error) {
    console.error(`Не удалось загрузить детали подкаста с ID ${id}:`, error);
    toggleLoader(false);

    contentPodcasts.textContent = "";
    const errorMessage = document.createElement("p");
    errorMessage.classList.add("podcasts-error");
    errorMessage.textContent =
      "Не удалось загрузить информацию о подкасте. Попробуйте позже.";
    contentPodcasts.appendChild(errorMessage);
  }
}

function renderPodcastPage(podcast: PodcastDetails) {
  if (!contentPodcasts) return;

  removeContent(contentPodcasts);

  const pageWrapper = document.createDocumentFragment();

  const backBtn = document.createElement("button");
  backBtn.classList.add("podcast-details__btn-back");
  backBtn.textContent = "Назад";
  backBtn.addEventListener("click", () => {
    loadDefaultPodcast();
  });

  const header = document.createElement("header");
  header.classList.add("podcast-details__header");

  const img = document.createElement("img");
  img.classList.add("podcast-details__cover");
  img.src = podcast.image ?? "https://placehold.co";
  img.alt = podcast.title;

  const textInfo = document.createElement("div");
  textInfo.classList.add("podcast-details__text");

  const title = document.createElement("h2");
  title.classList.add("podcast-details__title");
  title.textContent = podcast.title;

  const author = document.createElement("p");
  author.classList.add("podcast-details__author");
  author.textContent = `${podcast.publisher}`;

  const desc = document.createElement("p");
  desc.classList.add("podcast-details__description");
  desc.textContent = podcast.description || "Описание отсутствует.";

  textInfo.appendChild(title);
  textInfo.appendChild(author);
  textInfo.appendChild(desc);
  header.appendChild(img);
  header.appendChild(textInfo);

  const episodesContainer = document.createElement("section");
  episodesContainer.classList.add("podcast-details__episodes");

  const episodesTitle = document.createElement("h3");
  episodesTitle.classList.add("podcast-details__episodes-title");
  episodesTitle.textContent = `Эпизоды (Всего - ${podcast.total_episodes})`;
  episodesContainer.appendChild(episodesTitle);

  podcast.episodes.forEach((episode) => {
    const episodeRow = createEpisode(
      episode,
      podcast.publisher,
    );
    episodesContainer.appendChild(episodeRow);
  });

  pageWrapper.appendChild(backBtn);
  pageWrapper.appendChild(header);
  pageWrapper.appendChild(episodesContainer);

  contentPodcasts.appendChild(pageWrapper);
}

function createEpisode(
  episode: Episode,
  publisherName: string = "Неизвестный автор",
): HTMLElement {
  const row = document.createElement("div");
  row.classList.add("episode-row");
  row.setAttribute("data-audio-url", episode.audio);
  row.setAttribute("data-episode-id", episode.id);
  row.setAttribute("data-title", episode.title ?? "Без названия");
  row.setAttribute("data-duration", episode.audio_length_sec.toString());
  row.setAttribute("data-pub-date", episode.pub_date_ms.toString());
  row.setAttribute("data-image", episode.image || "");
  row.setAttribute("data-publisher", publisherName);

  const playBtn = document.createElement("button");
  playBtn.classList.add("episode-row__play-btn");
  playBtn.textContent = "▶";

  const info = document.createElement("div");
  info.classList.add("episode-row__info");

  const date = document.createElement("span");
  date.classList.add("episode-row__date");
  date.textContent = formatDate(episode.pub_date_ms);

  const title = document.createElement("h4");
  title.classList.add("episode-row__title");
  title.textContent = episode.title ?? "Без названия";

  const duration = document.createElement("span");
  duration.classList.add("episode-row__duration");
  duration.textContent = `⏱ ${formatTime(episode.audio_length_sec)}`;

  const favBtn = document.createElement("button");
  favBtn.classList.add("episode-row__fav-btn");

  if (isEpisodeFavorite(episode.id)) {
    favBtn.textContent = "♥";
    favBtn.classList.add("episode-row__fav-btn--active");
  } else {
    favBtn.textContent = "♡";
  }

  info.appendChild(date);
  info.appendChild(title);
  info.appendChild(duration);
  row.appendChild(playBtn);
  row.appendChild(info);
  row.appendChild(favBtn);

  return row;
}

async function renderSavedPage(): Promise<void> {
  if (!contentPodcasts) return;

  toggleLoader(true);

  removeContent(contentPodcasts);

  const savedEpisodes = getFavoritesList();

  if (savedEpisodes.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.classList.add("podcasts__empty");
    emptyMsg.textContent = "У вас пока нет сохраненных эпизодов в плейлисте.";
    contentPodcasts.appendChild(emptyMsg);
    return;
  }

  const playlistWrapper = document.createElement("div");
  playlistWrapper.classList.add(
    "saved-playlist-marker",
    "podcast-details__episodes",
  );

  const fragment = document.createDocumentFragment();
  savedEpisodes.forEach((episode) => {
    const episodeRow = createEpisode(
      episode,
      episode.publisher,
    );
    fragment.appendChild(episodeRow);
  });

  playlistWrapper.appendChild(fragment);
  contentPodcasts.appendChild(playlistWrapper);
}

function highlightActiveTab(activeButton: HTMLButtonElement): void {
  const allSidebarBtns = document.querySelectorAll(".podcast__nav-item");

  allSidebarBtns.forEach((btn) => {
    btn.classList.remove("podcast__nav-item--active");
  });

  activeButton.classList.add("podcast__nav-item--active");
}

function formatDate(ms: number): string {
  if (isNaN(ms) || !isFinite(ms) || ms <= 0) {
    return "Дата неизвестна";
  }

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  try {
    return new Intl.DateTimeFormat("ru-RU", options).format(new Date(ms));
  } catch (error) {
    return "Дата неизвестна";
  }
}

if (searchInput) {
  searchInput.addEventListener("input", (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      handleSearchInputWithDebounce(event.target.value);
    }
  });
}

if (contentPodcasts) {
  contentPodcasts.addEventListener("click", handlePodcastClick);
}

if (homeBtn) {
  homeBtn.addEventListener("click", function (this: HTMLButtonElement) {
    highlightActiveTab(this);

    loadDefaultPodcast();
  });
}

if (savedBtn) {
  savedBtn.addEventListener("click", function (this: HTMLButtonElement) {
    highlightActiveTab(this);

    renderSavedPage();
  });
}

async function initApp() {
  initFavorites();
  loadDefaultPodcast();
}

initApp();
