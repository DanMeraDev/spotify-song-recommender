"""
transform.py

Responsable: Persona 1 (Datos)

Propósito:
Limpieza de los datos extraídos, JOIN entre canciones y artistas (por el ID del
artista principal), cálculo del vector emocional / mood (modelo de Russell) y
normalización min-max de las audio features. Deja el DataFrame listo para que
load.py lo persista en la base de datos y en el catálogo de la app.
"""
import numpy as np
import pandas as pd

from model.similarity import normalize_minmax

# Audio features que forman el vector acústico para la similitud coseno.
ACOUSTIC_FEATURES = ['danceability', 'energy', 'loudness', 'speechiness']


def clean_and_transform_data(songs_df, artists_df):
    """
    Limpia los datos, enriquece cada canción con los datos de su artista y
    calcula los campos derivados (mood + features normalizadas).
    """
    # 1. Limpieza de datos faltantes (13 canciones sin album_name, <0.01%)
    songs_df = songs_df.dropna(subset=['album_name']).copy()

    # 2. Cruce canción-artista (JOIN automático)
    #    songs_final.csv ya trae 'primary_artist_id' (ID de Spotify de 22 chars,
    #    limpio) que empareja 100% contra artists.id. Unimos por esa columna en
    #    lugar de intentar extraer el ID desde la columna de nombres 'artists'.
    artists_clean = artists_df[['id', 'main_genre', 'genres', 'popularity', 'followers']].rename(
        columns={
            'id': 'primary_artist_id',
            'popularity': 'artist_popularity',
            'followers': 'artist_followers',
        }
    )
    enriched_df = pd.merge(songs_df, artists_clean, on='primary_artist_id', how='left')

    # Casos residuales: artistas sin coincidencia -> género "Desconocido" y
    # popularidad media (tras el fix esto debería ser ~0 filas).
    enriched_df['main_genre'] = enriched_df['main_genre'].fillna('Desconocido')
    enriched_df['genres'] = enriched_df['genres'].fillna('[]')
    enriched_df['artist_popularity'] = enriched_df['artist_popularity'].fillna(50)
    enriched_df['artist_followers'] = enriched_df['artist_followers'].fillna(0)

    # 3. Mood: clasificación en cuadrantes emocionales (Russell 1980)
    #    Ejes: valence (X) y energy (Y). Umbral 0.5 en cada eje.
    conditions = [
        (enriched_df['valence'] >= 0.5) & (enriched_df['energy'] >= 0.5),  # Enérgico/Festivo
        (enriched_df['valence'] < 0.5) & (enriched_df['energy'] >= 0.5),   # Intenso/Agresivo
        (enriched_df['valence'] >= 0.5) & (enriched_df['energy'] < 0.5),   # Relajado/Alegre
        (enriched_df['valence'] < 0.5) & (enriched_df['energy'] < 0.5),    # Melancólico
    ]
    choices = ['Enérgico / Festivo', 'Intenso / Agresivo', 'Relajado / Alegre', 'Melancólico']
    enriched_df['mood_quadrant'] = np.select(conditions, choices, default='Indefinido')

    # 4. Normalización min-max de las audio features -> columnas '*_n' en [0, 1].
    #    Se precalculan aquí (una sola vez) para que el motor de recomendación
    #    calcule el coseno sobre vectores comparables sin renormalizar por consulta.
    normalized = normalize_minmax(enriched_df[ACOUSTIC_FEATURES].astype('float64'))
    for feature in ACOUSTIC_FEATURES:
        enriched_df[f'{feature}_n'] = normalized[feature]

    return enriched_df
