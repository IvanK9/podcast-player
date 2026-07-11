import { fetchFromListenNotes } from "./api";
import type { Podcast } from "./types";

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

if (searchInput) {
  searchInput.addEventListener("input", (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      handleSearchInputWithDebounce(event.target.value);
    }
  });
}

async function initApp() {
  console.log("--- Старт приложения Podcast Player (Safe DOM Mode) ---");
  loadDefaultPodcast();
}

initApp();
