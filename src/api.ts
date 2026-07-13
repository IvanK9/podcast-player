const API_URL = import.meta.env.VITE_LISTEN_API_URL;
const API_KEY = import.meta.env.VITE_LISTEN_API_KEY;

interface FetchOptions {
  endpoint: string;
  params?: Record<string, string>;
}

export async function fetchFromListenNotes({ endpoint, params }: FetchOptions) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  const url = `${API_URL}/api/v2/${endpoint}${queryString}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-ListenAPI-Key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
}