import { fetchFromListenNotes } from "./api";
import type { Episode, Podcast, PodcastDetails } from "./types";

const searchInput = document.querySelector("#search");
const searchTitle = document.querySelector<HTMLHeadingElement>(
  ".content__search-result-title",
);

const contentPodcasts: HTMLElement | null =
  document.querySelector(".content__podcasts");

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
  const DEFAULT_PLACEHOLDER = "https://placehold.co";

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

  if (!cardElement || !(cardElement instanceof HTMLElement)) return;

  const podcastId = cardElement.getAttribute("data-id");
  if (podcastId) {
    console.log(`Кликнули по подкасту с ID: ${podcastId}`);
    loadPodcastDetails(podcastId);
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
  backBtn.textContent = "Назад к списку";
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
  author.textContent = `Автор: ${podcast.publisher}`;

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
    const episodeRow = createEpisode(episode);
    episodesContainer.appendChild(episodeRow);
  });

  pageWrapper.appendChild(backBtn);
  pageWrapper.appendChild(header);
  pageWrapper.appendChild(episodesContainer);

  contentPodcasts.appendChild(pageWrapper);
}

function createEpisode(episode: Episode): HTMLElement {
  const row = document.createElement("div");
  row.classList.add("episode-row");
  row.setAttribute("data-audio-url", episode.audio);

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
  const minutes = Math.floor(episode.audio_length_sec / 60);
  duration.textContent = `⏱ ${minutes} мин`;

   info.appendChild(date);
  info.appendChild(title);
  info.appendChild(duration);
  row.appendChild(playBtn);
  row.appendChild(info);

  return row;
}

function formatDate(ms: number): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  return new Intl.DateTimeFormat("ru-RU", options).format(new Date(ms));
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

async function initApp() {
  console.log("--- Старт приложения Podcast Player (Safe DOM Mode) ---");
  loadDefaultPodcast();
}

initApp();
