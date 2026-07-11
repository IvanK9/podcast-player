import { fetchFromListenNotes } from "./api";
import type { Podcast } from "./types";

function renderPodcasts(podcasts: Podcast[]) {
  const contentPodcasts = document.querySelector(".content__podcasts");

  if (!contentPodcasts) return;

  while (contentPodcasts.firstChild) {
    contentPodcasts.removeChild(contentPodcasts.firstChild);
  }

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
  card.classList.add("podcasts__card","card");
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

async function initApp() {
  console.log("--- Старт приложения Podcast Player (Safe DOM Mode) ---");
  const container = document.querySelector(".content__podcasts");

  try {
    const data = await fetchFromListenNotes({
      endpoint: "best_podcasts",
      params: {
        sort: "recent_published_first",
        page: "1",
      },
    });

    console.log("Данные успешно получены с сервера:", data);
    renderPodcasts(data.podcasts);
  } catch (error) {
    if (container) {
      container.textContent = "";
      const errorMessage = document.createElement("p");
      errorMessage.classList.add("podcasts-error");
      errorMessage.textContent = "Не удалось загрузить подкасты. Проверьте сеть.";
      container.appendChild(errorMessage);
    }
  }
}

initApp();
