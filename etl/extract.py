"""
extract.py

Responsable: Persona 1 (Datos)

Propósito:
Lectura de los archivos fuente `songs_final.csv` y `artists.csv` (en data/) y
carga en memoria como DataFrames de pandas para su transformación en transform.py.
Los dtypes se fijan explícitamente para optimizar el uso de memoria.
"""
import os

import pandas as pd

SONGS_PATH = os.path.join("data", "songs_final.csv")
ARTISTS_PATH = os.path.join("data", "artists.csv")

SONGS_DTYPES = {
    'id': 'string',
    'name': 'string',
    'album_name': 'string',
    'artists': 'string',
    'danceability': 'float32',
    'energy': 'float32',
    'key': 'int8',
    'loudness': 'float32',
    'mode': 'int8',
    'speechiness': 'float32',
    'valence': 'float32',
    'genre': 'string',
    'popularity': 'int16',
    'artist_ids': 'string',
    'primary_artist_id': 'string'
}

ARTISTS_DTYPES = {
    'id': 'string',
    'name': 'string',
    'followers': 'float64',  # float para admitir nulos y números grandes
    'popularity': 'int8',
    'genres': 'string',
    'main_genre': 'string'
}

def check_files_exist():
    """Validar la existencia de los archivos y manejar el caso en que falten."""
    missing_files = []
    if not os.path.exists(SONGS_PATH):
        missing_files.append(SONGS_PATH)
    if not os.path.exists(ARTISTS_PATH):
        missing_files.append(ARTISTS_PATH)
        
    if missing_files:
        raise FileNotFoundError(
            f"❌ Faltan archivos requeridos: {missing_files}.\n"
            "👉 Revisa las instrucciones de descarga en 'data/README.md'."
        )

def extract_songs():
    """Lee songs_final.csv en un DataFrame."""
    check_files_exist()
    print("⏳ Extrayendo songs_final.csv...")
    return pd.read_csv(SONGS_PATH, dtype=SONGS_DTYPES)

def extract_artists():
    """Lee artists.csv en un DataFrame."""
    check_files_exist()
    print("⏳ Extrayendo artists.csv...")
    return pd.read_csv(ARTISTS_PATH, dtype=ARTISTS_DTYPES)

if __name__ == "__main__":
    try:
        songs = extract_songs()
        artists = extract_artists()
        print(f"✅ Extracción exitosa. Canciones: {songs.shape[0]}, Artistas: {artists.shape[0]}")
    except Exception as e:
        print(e)