"""
load.py

Responsable: Persona 1 (Datos)

Propósito:
Inserción de los datos ya transformados (transform.py) en la base de datos
definida en database/schema.sql (tablas: canciones, artistas, generos,
recomendaciones).

TODO:
- Establecer la conexión a la base de datos (SQLite por defecto, ver
  database/schema.sql).
- Implementar función para insertar/actualizar la tabla de artistas.
- Implementar función para insertar/actualizar la tabla de canciones.
- Implementar función para insertar/actualizar la tabla de géneros.
- Manejar inserciones en lote (batch insert) dado el volumen de datos
  (~491.632 canciones).
"""
import sys
import os

# Asegurar rutas para que Python encuentre los módulos locales
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Importamos formalmente desde tus otros archivos del ETL
from etl.extract import extract_songs, extract_artists
from etl.transform import clean_and_transform_data

def run_pipeline():
    print("=== INICIANDO PIPELINE ETL ===")
    
    # 1. EXTRACT (Fase de Extracción)
    songs_df = extract_songs()
    artists_df = extract_artists()
    
    # 2. TRANSFORM (Fase de Transformación)
    print("⚙️ Procesando unificación y cálculo de vectores de Mood (Russell)...")
    processed_df = clean_and_transform_data(songs_df, artists_df)
    
    # 3. LOAD (Fase de Carga - Temporalmente a CSV maestro para la app)
    print("💾 Guardando el catálogo maestro para la aplicación...")
    processed_df.to_csv(os.path.join("data", "processed_songs.csv"), index=False)
    
    print("✅ ¡Proceso completado con éxito! Se creó 'data/processed_songs.csv'.")

if __name__ == "__main__":
    run_pipeline()