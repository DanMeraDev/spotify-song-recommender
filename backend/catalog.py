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


def load_catalog():
    """Carga el catálogo completo desde PostgreSQL. Se ejecuta una sola vez al iniciar el backend."""
    global _catalog
    df = pd.read_sql(CATALOG_QUERY, engine)
    df['artists_display'] = df['artists'].apply(_format_artists)
    df['search_key'] = (df['name'].fillna('') + ' ' + df['artists_display']).str.lower()
    df = df.sort_values('popularity', ascending=False).reset_index(drop=True)
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
