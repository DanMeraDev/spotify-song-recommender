"""
load.py

Responsable: Persona 1 (Datos)

Propósito:
Orquesta el pipeline ETL completo (extract -> transform -> load) y puebla
PostgreSQL (tablas artistas, canciones, generos, recomendaciones) según
database/schema.sql. Usa COPY (vía psycopg) para la carga masiva, mucho más
rápido que INSERT fila por fila incluso contra una base de datos en la nube.
"""
import io
import os
import sys

# Asegurar rutas para que Python encuentre los módulos locales
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.db import engine
from etl.extract import extract_songs, extract_artists
from etl.transform import clean_and_transform_data
from model.recommender import _parse_genres

SCHEMA_PATH = os.path.join("database", "schema.sql")

ARTISTAS_COLS = ['id', 'name', 'followers', 'popularity', 'main_genre', 'genres']
CANCIONES_COLS = [
    'id', 'name', 'album_name', 'artists', 'artist_id', 'danceability', 'energy', 'key',
    'loudness', 'mode', 'speechiness', 'valence', 'genre', 'popularity',
    'danceability_n', 'energy_n', 'loudness_n', 'speechiness_n', 'mood_quadrant',
]


def _create_schema(conn):
    """Crea las tablas ejecutando database/schema.sql (idempotente: CREATE IF NOT EXISTS)."""
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        conn.exec_driver_sql(f.read())


def _copy_dataframe(conn, table, df, columns):
    """Carga masiva de un DataFrame a una tabla vía COPY FROM STDIN (formato CSV)."""
    buf = io.StringIO()
    df[columns].to_csv(buf, index=False, header=False, na_rep='')
    buf.seek(0)
    cols_sql = ", ".join(columns)
    raw_cursor = conn.connection.cursor()
    with raw_cursor.copy(f"COPY {table} ({cols_sql}) FROM STDIN WITH (FORMAT csv, NULL '')") as copy:
        copy.write(buf.read())


def populate_database(enriched_df, artists_df):
    """Puebla PostgreSQL con artistas, canciones y el bridge de géneros (idempotente)."""
    with engine.begin() as conn:
        print("🗑️  Limpiando tablas (TRUNCATE)...")
        _create_schema(conn)
        conn.exec_driver_sql(
            "TRUNCATE recomendaciones, generos, canciones, artistas RESTART IDENTITY CASCADE"
        )

        print("💾 Cargando tabla artistas...")
        artistas = artists_df[ARTISTAS_COLS].copy()
        # followers viene como float64 (admite nulos); a entero nullable para que
        # COPY no escriba "67223.0" en una columna INTEGER.
        artistas['followers'] = artistas['followers'].astype('Int64')
        _copy_dataframe(conn, 'artistas', artistas, ARTISTAS_COLS)

        print("💾 Cargando tabla canciones...")
        canciones = enriched_df.rename(columns={'primary_artist_id': 'artist_id'})[CANCIONES_COLS]
        _copy_dataframe(conn, 'canciones', canciones, CANCIONES_COLS)

        print("💾 Cargando tabla generos (bridge)...")
        rows = [
            (artist_id, g)
            for artist_id, genres_str in zip(artists_df['id'], artists_df['genres'])
            for g in _parse_genres(genres_str)
        ]
        if rows:
            import pandas as pd
            generos_df = pd.DataFrame(rows, columns=['artist_id', 'genre'])
            _copy_dataframe(conn, 'generos', generos_df, ['artist_id', 'genre'])

        print(f"✅ Base de datos poblada: {len(canciones):,} canciones, "
              f"{len(artistas):,} artistas, {len(rows):,} pares artista-género.")


def save_recommendations(origen_id, recommended_ids_scores):
    """
    Persiste un Top N generado por el backend en la tabla recomendaciones.
    recommended_ids_scores: lista de tuplas (song_recomendada_id, score) en orden.
    """
    with engine.begin() as conn:
        rows = [
            {"origen": origen_id, "reco": song_id, "score": float(score), "rank": rank}
            for rank, (song_id, score) in enumerate(recommended_ids_scores, start=1)
        ]
        conn.exec_driver_sql(
            "INSERT INTO recomendaciones (song_origen_id, song_recomendada_id, score, rank) "
            "VALUES (%(origen)s, %(reco)s, %(score)s, %(rank)s)",
            rows,
        )


def run_pipeline():
    print("=== INICIANDO PIPELINE ETL ===")

    songs_df = extract_songs()
    artists_df = extract_artists()

    print("⚙️ Procesando unificación, mood (Russell) y normalización de features...")
    processed_df = clean_and_transform_data(songs_df, artists_df)

    print("💾 Cargando catálogo en PostgreSQL...")
    populate_database(processed_df, artists_df)

    print("✅ ¡Proceso completado!")


if __name__ == "__main__":
    run_pipeline()
