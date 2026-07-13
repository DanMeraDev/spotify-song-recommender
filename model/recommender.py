"""
recommender.py

Responsable: Persona 2 (Fórmulas / motor)

Propósito:
Motor de recomendación de canciones (filtrado basado en contenido). Dada una
canción de entrada, calcula el Score de afinidad multifactorial contra todo el
catálogo y devuelve el Top N más afín.

    Score(c) = 0.45·Sim_audio + 0.25·Sim_mood + 0.20·Género + 0.10·Pop

Ver model/formulas.md para el detalle matemático de cada término.
"""
import ast

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from model.similarity import calculate_russell_mood_similarity

# Pesos calibrados de la fórmula multifactorial (deben sumar 1.0).
WEIGHTS = {
    'audio': 0.45,   # Similitud del perfil acústico (coseno sobre features normalizadas)
    'mood': 0.25,    # Cercanía emocional (Russell - distancia euclidiana)
    'genre': 0.20,   # Coincidencia de género del artista
    'pop': 0.10,     # Popularidad del artista
}

# Columnas normalizadas del vector acústico (generadas en el ETL).
ACOUSTIC_COLS = ['danceability_n', 'energy_n', 'loudness_n', 'speechiness_n']


def _parse_genres(genres_value):
    """Convierte el campo genres (texto tipo "['indie folk', 'folk punk']") a set."""
    if not isinstance(genres_value, str) or not genres_value.strip():
        return set()
    try:
        parsed = ast.literal_eval(genres_value)
        if isinstance(parsed, (list, tuple)):
            return {str(g).strip() for g in parsed if str(g).strip()}
    except (ValueError, SyntaxError):
        pass
    return set()


def get_recommendations(query_song, catalog_df, top_n=5, discovery=False):
    """
    Devuelve las top_n canciones más afines a query_song mediante la combinación
    lineal ponderada de similitud acústica, mood, género y popularidad.

    El DataFrame devuelto incluye, además del prediction_score, el desglose por
    factor (sim_audio, sim_mood, sim_genre, sim_pop) para el dashboard BI.

    Si discovery=True, el factor de popularidad se invierte (1 - Pop) para
    favorecer canciones menos conocidas ("modo descubrimiento").
    """
    n = len(catalog_df)

    # a) Similitud acústica: coseno entre vectores normalizados [0, 1].
    catalog_vectors = catalog_df[ACOUSTIC_COLS].to_numpy(dtype=float)
    query_vector = np.array([query_song[c] for c in ACOUSTIC_COLS], dtype=float).reshape(1, -1)
    sim_audio = cosine_similarity(catalog_vectors, query_vector).flatten()

    # b) Similitud de mood: modelo de Russell (vectorizado).
    sim_mood = calculate_russell_mood_similarity(
        catalog_df['valence'].to_numpy(dtype=float),
        catalog_df['energy'].to_numpy(dtype=float),
        float(query_song['valence']),
        float(query_song['energy']),
    )

    # c) Coincidencia de género (vectorizada):
    #    1.0 si comparten main_genre; 0.5 si comparten algún subgénero; 0.0 si no.
    q_main = query_song['main_genre']
    sim_genre = (catalog_df['main_genre'].to_numpy() == q_main).astype(float)
    q_subgenres = _parse_genres(query_song.get('genres'))
    if q_subgenres:
        needs_check = sim_genre == 0.0
        overlap = np.zeros(n, dtype=bool)
        genres_col = catalog_df['genres'].fillna('')
        for g in q_subgenres:
            overlap |= genres_col.str.contains(g, regex=False, na=False).to_numpy()
        sim_genre = np.where(needs_check & overlap, 0.5, sim_genre)

    # d) Popularidad normalizada del artista (0..1); invertida en modo descubrimiento.
    sim_pop = catalog_df['artist_popularity'].to_numpy(dtype=float) / 100.0
    if discovery:
        sim_pop = 1.0 - sim_pop

    # Fusión final ponderada.
    score = (
        WEIGHTS['audio'] * sim_audio
        + WEIGHTS['mood'] * sim_mood
        + WEIGHTS['genre'] * sim_genre
        + WEIGHTS['pop'] * sim_pop
    )

    result_df = catalog_df.copy()
    result_df['sim_audio'] = sim_audio
    result_df['sim_mood'] = sim_mood
    result_df['sim_genre'] = sim_genre
    result_df['sim_pop'] = sim_pop
    result_df['prediction_score'] = score

    # Excluir otras grabaciones de la MISMA canción consultada (mismo título y
    # artista principal, aunque tengan distinto id: remixes, versiones de álbum...).
    same_song = (
        (result_df['name'] == query_song['name'])
        & (result_df['primary_artist_id'] == query_song['primary_artist_id'])
    )
    result_df = result_df[~same_song]

    # Ordenar por afinidad y deduplicar recomendaciones repetidas (mismo título +
    # artista), quedándonos con la de mayor score, antes de tomar el Top N.
    result_df = result_df.sort_values(by='prediction_score', ascending=False)
    result_df = result_df.drop_duplicates(subset=['name', 'primary_artist_id'], keep='first')

    return result_df.head(top_n)
