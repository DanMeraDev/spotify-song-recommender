"""
load.py

Responsable: Persona 1 (Datos)

Propósito:
Orquesta el pipeline ETL completo (extract -> transform -> load) y persiste el
resultado en dos destinos:
  1. data/spotify.db  : base de datos SQLite poblada (tablas artistas, canciones,
                        generos, recomendaciones) según database/schema.sql.
  2. data/processed_songs.csv : catálogo enriquecido que la app carga en memoria
                        (lo más rápido para calcular similitud sobre ~491K filas).
"""
import os
import sqlite3
import sys

# Asegurar rutas para que Python encuentre los módulos locales
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from etl.extract import extract_songs, extract_artists
from etl.transform import clean_and_transform_data
from model.recommender import _parse_genres

DB_PATH = os.path.join("data", "spotify.db")
CSV_PATH = os.path.join("data", "processed_songs.csv")
SCHEMA_PATH = os.path.join("database", "schema.sql")

# Columnas de la tabla canciones (orden segun schema.sql)
CANCIONES_COLS = [
    'id', 'name', 'album_name', 'artist_id', 'danceability', 'energy', 'key',
    'loudness', 'mode', 'speechiness', 'valence', 'genre', 'popularity',
    'danceability_n', 'energy_n', 'loudness_n', 'speechiness_n', 'mood_quadrant',
]


def _create_schema(conn):
    """Crea las tablas ejecutando database/schema.sql."""
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())


def populate_database(enriched_df, artists_df):
    """Puebla SQLite con artistas, canciones y el bridge de géneros."""
    # Empezar desde cero para que el pipeline sea idempotente
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    try:
        _create_schema(conn)

        # --- artistas ---
        print("💾 Cargando tabla artistas...")
        artistas = artists_df[['id', 'name', 'followers', 'popularity', 'main_genre']]
        artistas.to_sql('artistas', conn, if_exists='append', index=False, chunksize=10000)

        # --- canciones ---
        print("💾 Cargando tabla canciones...")
        canciones = enriched_df.rename(columns={'primary_artist_id': 'artist_id'})[CANCIONES_COLS]
        canciones.to_sql('canciones', conn, if_exists='append', index=False, chunksize=10000)

        # --- generos (bridge N:M artista-género) ---
        print("💾 Cargando tabla generos (bridge)...")
        rows = []
        for artist_id, genres_str in zip(artists_df['id'], artists_df['genres']):
            for g in _parse_genres(genres_str):
                rows.append((artist_id, g))
        conn.executemany("INSERT INTO generos (artist_id, genre) VALUES (?, ?)", rows)

        conn.commit()
        print(f"✅ Base de datos poblada: {len(canciones)} canciones, "
              f"{len(artistas)} artistas, {len(rows)} pares artista-género.")
    finally:
        conn.close()


def save_recommendations(origen_id, recommended_ids_scores):
    """
    Persiste un Top N generado por la app en la tabla recomendaciones.
    recommended_ids_scores: lista de tuplas (song_recomendada_id, score) en orden.
    """
    conn = sqlite3.connect(DB_PATH)
    try:
        rows = [
            (origen_id, song_id, float(score), rank)
            for rank, (song_id, score) in enumerate(recommended_ids_scores, start=1)
        ]
        conn.executemany(
            "INSERT INTO recomendaciones (song_origen_id, song_recomendada_id, score, rank) "
            "VALUES (?, ?, ?, ?)",
            rows,
        )
        conn.commit()
    finally:
        conn.close()


def run_pipeline():
    print("=== INICIANDO PIPELINE ETL ===")

    # 1. EXTRACT
    songs_df = extract_songs()
    artists_df = extract_artists()

    # 2. TRANSFORM
    print("⚙️ Procesando unificación, mood (Russell) y normalización de features...")
    processed_df = clean_and_transform_data(songs_df, artists_df)

    # 3. LOAD
    print("💾 Guardando catálogo maestro para la aplicación...")
    processed_df.to_csv(CSV_PATH, index=False)
    populate_database(processed_df, artists_df)

    print(f"✅ ¡Proceso completado! Se crearon '{CSV_PATH}' y '{DB_PATH}'.")


if __name__ == "__main__":
    run_pipeline()
