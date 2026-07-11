import { fetchFromListenNotes } from './api';

async function initApp() {
  console.log('--- Инициализация Podcast Player ---');
  console.log(`Режим работы: ${import.meta.env.MODE}`);
  console.log(`Используемый API URL: ${import.meta.env.VITE_LISTEN_API_URL}`);

  try {
    // Делаем проверочный запрос к эндпоинту лучших подкастов
    const data = await fetchFromListenNotes({
      endpoint: 'best_podcasts',
      params: { 
        sort: 'recent_published_first', 
        page: '1' 
      }
    });

    console.log('Данные успешно получены с сервера:', data);
  } catch (error) {
    console.error('Не удалось загрузить стартовые данные подкастов');
  }
}

// Запускаем приложение
initApp();