# Datos

Los archivos CSV de este proyecto no se suben al repositorio por su tamaño
(~491.632 filas en `songs_final.csv`). Están ignorados en `.gitignore`.

## Dataset

**490K Spotify Song Audio Embeddings & Metadata**
Kaggle: https://www.kaggle.com/datasets/rodolfofigueroa/spotify-12m-songs

## Instrucciones de descarga

1. Crear una cuenta en [Kaggle](https://www.kaggle.com/) si no se tiene una.
2. Ingresar al link del dataset y descargar el `.zip` (botón "Download").
3. Descomprimir el `.zip`.
4. Copiar los siguientes archivos dentro de esta carpeta (`data/`):
   - `songs_final.csv`
   - `artists.csv`

## Archivos esperados

| Archivo | Filas aprox. | Columnas principales |
|---|---|---|
| `songs_final.csv` | 491.632 | `id, name, album_name, artists, danceability, energy, key, loudness, mode, speechiness, valence, genre, popularity, artist_ids, primary_artist_id` |
| `artists.csv` | 63.857 | `id, name, followers, popularity, genres, main_genre` |

> El ETL une canción↔artista por `primary_artist_id` (ID de Spotify limpio, 22 chars)
> contra `artists.id` — empareja el 100% del catálogo. La columna `artists` contiene
> **nombres**, no IDs, por lo que no se usa para el JOIN.

## Destino de los datos

`python -m etl.load` procesa estos CSV y puebla directamente **PostgreSQL** (ver
`database/schema.sql`), configurada mediante `DATABASE_URL` en `.env` (plantilla
en `.env.example` en la raíz del proyecto). No se generan archivos intermedios.
