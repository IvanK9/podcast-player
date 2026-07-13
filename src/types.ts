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

export interface PodcastDetails {
  id: string;
  title: string;
  publisher: string;
  image: string;
  thumbnail: string;
  description: string;
  total_episodes: number;
  episodes: Episode[];
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  audio: string;
  audio_length_sec: number;
  pub_date_ms: number;
  image: string;
  publisher?: string;
}

export interface PlaybackProgress {
  [episodeId: string]: number;
}
