"""
transform.py

Responsable: Persona 1 (Datos)

Propósito:
Limpieza de los datos extraídos, JOIN entre canciones y artistas, y cálculo
de atributos derivados (por ejemplo, un índice de "mood" a partir de
danceability, energy, loudness y mode) que alimentarán al motor de
recomendación en model/.

TODO:
- Limpiar valores nulos/duplicados en songs.csv y artists.csv.
- Normalizar tipos de datos (ej. géneros como lista, artists como lista).
- Realizar el JOIN entre canciones y artistas (por id de artista).
- Calcular el campo derivado de "mood" a partir de las audio features.
- Dejar el DataFrame final listo para ser insertado en la base de datos
  por load.py.
"""
import pandas as pd
import numpy as np
import re

def clean_and_transform_data(songs_df, artists_df):
    """
    Realiza la limpieza de datos y calcula el Mood basado en el
    Modelo Circumplejo de Russell (1980).
    """
    # 1. Limpieza de datos faltantes (Remover filas sin album_name)
    songs_df = songs_df.dropna(subset=['album_name']).copy()
    
    # 2. Extracción del artista principal mediante Expresiones Regulares
    def extract_main_artist_id(artists_str):
        if pd.isna(artists_str):
            return None
        # Busca el primer Spotify ID alfanumérico de 22 caracteres
        match = re.search(r'[a-zA-Z0-9]{22}', str(artists_str))
        return match.group(0) if match else None

    # Creamos la columna normalizada del ID del artista principal
    songs_df['artist_ids'] = songs_df['artists'].apply(extract_main_artist_id)
    
    # 3. Cruce automático (JOIN) con el catálogo de artistas
    artists_clean = artists_df[['id', 'main_genre', 'genres', 'popularity']].rename(
        columns={'id': 'artist_ids', 'popularity': 'artist_popularity'}
    )
    
    # Combinamos usando un Left Join
    enriched_df = pd.merge(songs_df, artists_clean, on='artist_ids', how='left')
    
    # Manejo de casos residuales por si algún artista no coincidió
    enriched_df['main_genre'] = enriched_df['main_genre'].fillna('Desconocido')
    enriched_df['artist_popularity'] = enriched_df['artist_popularity'].fillna(50)
    
    # 4. Clasificación por cuadrantes emocionales (Russell)
    # Ejes rectores: valence (X) y energy (Y)
    conditions = [
        (enriched_df['valence'] >= 0.5) & (enriched_df['energy'] >= 0.5), # Enérgico/Festivo
        (enriched_df['valence'] < 0.5) & (enriched_df['energy'] >= 0.5),  # Intenso/Agresivo
        (enriched_df['valence'] >= 0.5) & (enriched_df['energy'] < 0.5),  # Relajado/Alegre
        (enriched_df['valence'] < 0.5) & (enriched_df['energy'] < 0.5)    # Melancólico
    ]
    
    choices = ['Enérgico / Festivo', 'Intenso / Agresivo', 'Relajado / Alegre', 'Melancólico']
    enriched_df['mood_quadrant'] = np.select(conditions, choices, default='Indefinido')
    
    return enriched_df