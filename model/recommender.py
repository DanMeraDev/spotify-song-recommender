"""
recommender.py

Responsable: Persona 2 (Fórmulas / motor)

Propósito:
Motor de recomendación de canciones. Dada una canción de entrada, calcula
un score de afinidad multifactorial contra el resto del catálogo (usando las
funciones de similarity.py) y retorna el Top 10 de canciones más afines.

TODO:
- Implementar función Score(cancion_origen, cancion_candidata) que combine
  similitud de audio features, género y popularidad del artista.
- Implementar función que, dada una canción de entrada, calcule el Score
  contra todas las candidatas y retorne el Top 10 ordenado.
- Definir pesos de cada factor de la fórmula multifactorial (ver
  model/formulas.md).
- Optimizar el cálculo para el volumen del dataset (~491.632 canciones).
"""
import numpy as np
import pandas as pd
from model.similarity import calculate_cosine_similarity, calculate_russell_mood_similarity

def get_recommendations(query_song, catalog_df, top_n=10):
    """
    Predice y recomienda las N canciones más afines mediante una combinación
    lineal ponderada multifactorial (Filtrado Basado en Contenido).
    """
    # 1. Definición de los pesos calibrados en el diseño del sistema
    weights = {
        'acoustic': 0.45,  # Similitud del perfil de audio (Coseno)
        'mood': 0.25,      # Cercanía emocional (Russell - Euclidiana)
        'genre': 0.20,     # Coincidencia cultural de géneros
        'pop': 0.10        # Filtro de popularidad del artista
    }
    
    # --- a) Similitud Acústica Vectorizada ---
    acoustic_features = ['danceability', 'energy', 'loudness', 'speechiness']
    catalog_vectors = catalog_df[acoustic_features].values
    query_vector = query_song[acoustic_features].values.reshape(1, -1)
    
    # Optimizamos calculando el coseno de todo el bloque contra el vector query
    from sklearn.metrics.pairwise import cosine_similarity
    sim_acoustic = cosine_similarity(catalog_vectors, query_vector).flatten()
    
    # --- b) Similitud de Mood ---
    sim_mood = calculate_russell_mood_similarity(
        catalog_df['valence'].values, catalog_df['energy'].values,
        query_song['valence'], query_song['energy']
    )
    
    # --- c) Coincidencia de Géneros ---
    def evaluate_genre(row):
        # 1.0 si comparten el género principal estrictamente
        if row['main_genre'] == query_song['main_genre']:
            return 1.0
        # 0.5 si comparte algún subgénero en las listas extendidas
        if isinstance(row['genres'], str) and isinstance(query_song['genres'], str):
            q_genres = set(query_song['genres'].replace("[", "").replace("]", "").replace("'", "").split(", "))
            c_genres = set(row['genres'].replace("[", "").replace("]", "").replace("'", "").split(", "))
            if q_genres.intersection(c_genres):
                return 0.5
        return 0.0
        
    sim_genre = catalog_df.apply(evaluate_genre, axis=1).values
    
    # --- d) Popularidad Normalizada ---
    sim_pop = catalog_df['artist_popularity'].values / 100.0
    
    # 2. Fusión matemática final (Fórmula de Predicción Global)
    score = (
        weights['acoustic'] * sim_acoustic +
        weights['mood'] * sim_mood +
        weights['genre'] * sim_genre +
        weights['pop'] * sim_pop
    )
    
    # 3. Estructuración del DataFrame de resultados
    result_df = catalog_df.copy()
    result_df['prediction_score'] = score
    
    # Excluimos la canción de entrada de la recomendación para evitar redundancia
    result_df = result_df[result_df['id'] != query_song['id']]
    
    # Ordenamos de mayor a menor afinidad y extraemos el Top N
    return result_df.sort_values(by='prediction_score', ascending=False).head(top_n)