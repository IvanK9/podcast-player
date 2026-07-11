export interface Podcast {
  id: string;
  title: string;
  publisher: string;
  image: string;
  thumbnail?: string;
  description?: string;
}

export interface BestPodcastsResponse {
  podcasts: Podcast[];
  total: number;
  page_number: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface SearchResponse {
  results: Podcast[];
  total: number;
  count: number;
}