export interface SongSummary {
  id: string
  name: string
  artists: string
  main_genre: string
  mood_quadrant: string
  popularity: number
}

export interface SongDetail extends SongSummary {
  valence: number
  energy: number
  danceability_n: number
  energy_n: number
  loudness_n: number
  speechiness_n: number
}

export interface RecommendedSong extends SongDetail {
  score: number
  sim_audio: number
  sim_mood: number
  sim_genre: number
  sim_pop: number
}

export interface SongListResponse {
  total: number
  items: SongSummary[]
}

export interface RecommendationResponse {
  query: SongDetail
  recommendations: RecommendedSong[]
}
