"""
extract.py

Responsable: Persona 1 (Datos)

Propósito:
Lectura de los archivos fuente `songs.csv` y `artists.csv` (ubicados en data/)
y carga inicial en memoria (DataFrames de pandas) para su posterior
transformación en transform.py.

TODO:
- Definir rutas de lectura de data/songs.csv y data/artists.csv.
- Implementar función para leer songs.csv en un DataFrame.
- Implementar función para leer artists.csv en un DataFrame.
- Validar existencia de los archivos y manejar el caso en que falten
  (referenciar data/README.md para instrucciones de descarga).
- Definir tipos de datos esperados por columna (dtypes) para optimizar memoria.
"""
import pandas as pd
import os

# 1. Definir rutas de lectura fijas (Ubicadas en la carpeta data/)
SONGS_PATH = os.path.join("data", "songs_final.csv")
ARTISTS_PATH = os.path.join("data", "artists.csv")

# 2. Definir tipos de datos esperados (dtypes) para optimizar la memoria RAM (92 MB + 5 MB)
# Esto evita que pandas gaste memoria innecesaria infiriendo tipos de datos.
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
    'speechiness': 'float32'
}

ARTISTS_DTYPES = {
    'id': 'string',
    'name': 'string',
    'followers': 'float64', # Permite manejar números grandes de seguidores o nulos
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
            f"❌ ERROR: Faltan los siguientes archivos requeridos: {missing_files}.\n"
            "👉 Por favor, revisa las instrucciones de descarga en 'data/README.md' "
            "o asegúrate de que los archivos de Rodni estén guardados en la carpeta data/."
        )

def extract_songs():
    """Lee songs_final.csv en un DataFrame optimizado."""
    check_files_exist()
    print("⏳ Extrayendo songs_final.csv de forma optimizada...")
    # Leemos especificando los dtypes definidos
    return pd.read_csv(SONGS_PATH, dtype=SONGS_DTYPES)

def extract_artists():
    """Lee artists.csv en un DataFrame optimizado."""
    check_files_exist()
    print("⏳ Extrayendo artists.csv de forma optimizada...")
    return pd.read_csv(ARTISTS_PATH, dtype=ARTISTS_DTYPES)

if __name__ == "__main__":
    # Prueba de ejecución local del módulo
    try:
        songs = extract_songs()
        artists = extract_artists()
        print(f"✅ Extracción exitosa. Canciones: {songs.shape[0]}, Artistas: {artists.shape[0]}")
    except Exception as e:
        print(e)