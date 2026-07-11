# Spotify Song Recommender

Proyecto universitario de Business Intelligence. Sistema de recomendación musical
que, dada una canción de entrada, predice y recomienda las canciones más afines
utilizando un modelo de **filtrado basado en contenido** con una fórmula de
similitud multifactorial (audio features + género + popularidad).

## Dataset

**490K Spotify Song Audio Embeddings & Metadata** (Kaggle)
Link: https://www.kaggle.com/datasets/rodolfofigueroa/spotify-12m-songs

Archivos utilizados:

- `songs.csv` (~491.632 filas): `id, name, album_name, artists, danceability, energy, key, loudness, mode, speechiness`
- `artists.csv` (~63.857 filas): `id, name, followers, popularity, genres, main_genre`

Los CSV no se versionan en este repositorio por su tamaño. Ver `data/README.md`
para las instrucciones de descarga.

## Estructura del proyecto

```
spotify-song-recommender/
├── data/                # CSVs de origen (no versionados) + instrucciones de descarga
├── etl/                 # Extracción, transformación y carga de datos
│   ├── extract.py
│   ├── transform.py
│   └── load.py
├── database/            # Esquema relacional y modelo entidad-relación
│   ├── schema.sql
│   └── modelo_er.md
├── model/                # Motor de recomendación
│   ├── similarity.py
│   ├── recommender.py
│   └── formulas.md
├── app/                  # Aplicación Streamlit (dashboard BI)
│   ├── main.py
│   └── charts.py
└── docs/                 # Informe y validación
    ├── informe_ieee/
    ├── formulario_SUS.md
    └── validacion.md
```

## División de tareas

| Persona | Rol | Carpetas a cargo |
|---|---|---|
| Persona 1 | Datos | `etl/`, `database/` |
| Persona 2 | Fórmulas / motor de recomendación | `model/`, lógica de `app/` |
| Persona 3 | Informe / validación | `docs/`, parte visual de `app/` |

## Instalación

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

## Cómo correr la app

```bash
streamlit run app/main.py
```

## Estado del proyecto

En construcción. Estructura base creada, lógica de ETL, base de datos, modelo de
recomendación y dashboard pendientes de implementación.
