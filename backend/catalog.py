"""
catalog.py

Responsable: Persona 2 (Fórmulas / motor)

Propósito:
Carga el catálogo de canciones desde PostgreSQL (JOIN canciones-artistas) y lo
mantiene cacheado en memoria (un único pandas.DataFrame) para que el motor de
recomendación (model/recommender.py) calcule similitud sin volver a golpear la
base de datos en cada consulta.
"""
import ast

import pandas as pd

from backend.db import engine

CATALOG_QUERY = """
    SELECT
        c.id, c.name, c.artists, c.artist_id AS primary_artist_id,
        c.mood_quadrant, c.popularity, c.valence, c.energy,
        c.danceability_n, c.energy_n, c.loudness_n, c.speechiness_n,
        a.main_genre, a.genres, a.popularity AS artist_popularity
    FROM canciones c
    JOIN artistas a ON c.artist_id = a.id
"""

# Columnas de baja cardinalidad -> category (mucho más liviano que texto plano).
# primary_artist_id y genres son, en la práctica, atributos por ARTISTA
# (se repiten en cada una de sus canciones), así que su cardinalidad real es
# la cantidad de artistas (~64K), no la de canciones (~491K).
_CATEGORY_COLS = ['main_genre', 'mood_quadrant', 'primary_artist_id', 'genres']
# Columnas numéricas -> float32 (la mitad de memoria que el float64 por defecto).
_FLOAT32_COLS = [
    'valence', 'energy', 'danceability_n', 'energy_n', 'loudness_n', 'speechiness_n',
]

_CHUNK_SIZE = 20_000

_catalog = None


def _format_artists(raw):
    """Convierte el campo artists ('["A", "B"]') en texto legible 'A, B'."""
    try:
        parsed = ast.literal_eval(raw)
        if isinstance(parsed, (list, tuple)):
            return ", ".join(str(a) for a in parsed)
    except (ValueError, SyntaxError, TypeError):
        pass
    return str(raw) if raw is not None else ""


def _read_catalog_query():
    """
    Ejecuta la consulta con un cursor server-side (stream_results) y la trae en
    lotes en vez de un solo `pd.read_sql`.

    Sin esto, psycopg vuelca las ~491K filas crudas en memoria de una sola vez
    antes de que pandas arme el DataFrame final, duplicando el uso de RAM en el
    pico (medido: ~1.1 GB vs ~350 MB en streaming) — inviable en una instancia
    con memoria limitada como la del backend desplegado.
    """
    with engine.connect().execution_options(stream_results=True) as conn:
        chunks = list(pd.read_sql(CATALOG_QUERY, conn, chunksize=_CHUNK_SIZE))
    df = pd.concat(chunks, ignore_index=True)
    del chunks
    return df


def load_catalog():
    """Carga el catálogo completo desde PostgreSQL. Se ejecuta una sola vez al iniciar el backend."""
    global _catalog
    df = _read_catalog_query()

    for col in _FLOAT32_COLS:
        df[col] = df[col].astype('float32')
    for col in _CATEGORY_COLS:
        df[col] = df[col].astype('category')

    # Se ordena ANTES de calcular las columnas derivadas (menos columnas que
    # reordenar = menor pico de memoria) y con ignore_index para no necesitar
    # un reset_index aparte.
    df.sort_values('popularity', ascending=False, inplace=True, ignore_index=True)

    df['artists_display'] = df['artists'].apply(_format_artists)
    df['search_key'] = (df['name'].fillna('') + ' ' + df['artists_display']).str.lower()
    # 'artists' (texto crudo) ya no hace falta una vez calculado artists_display.
    df.drop(columns=['artists'], inplace=True)

    _catalog = df
    return _catalog


def get_catalog():
    """Devuelve el catálogo cacheado, cargándolo si es la primera vez."""
    if _catalog is None:
        return load_catalog()
    return _catalog


def search_catalog(catalog, query, limit=50):
    """Filtrado eficiente por subcadena (barrido vectorizado en C sobre todo el catálogo)."""
    mask = catalog['search_key'].str.contains(query.strip().lower(), regex=False, na=False)
    return catalog[mask].head(limit)
