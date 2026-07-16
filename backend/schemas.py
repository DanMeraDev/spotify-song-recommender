"""
schemas.py

Responsable: Persona 2 (Fórmulas / motor)

Propósito:
Modelos Pydantic de las respuestas de la API (backend/main.py).
"""
from pydantic import BaseModel


class SongSummary(BaseModel):
    id: str
    name: str
    artists: str
    main_genre: str
    mood_quadrant: str
    popularity: int


class SongList(BaseModel):
    total: int
    items: list[SongSummary]


class SongDetail(SongSummary):
    valence: float
    energy: float
    danceability_n: float
    energy_n: float
    loudness_n: float
    speechiness_n: float


class RecommendedSong(SongDetail):
    score: float
    sim_audio: float
    sim_mood: float
    sim_genre: float
    sim_pop: float


class RecommendationResponse(BaseModel):
    query: SongDetail
    recommendations: list[RecommendedSong]
