"""
main.py

Responsable: Persona 2 (lógica) / Persona 3 (consumo desde el frontend)

Propósito:
API FastAPI del sistema de recomendación. Expone endpoints para listar/buscar
canciones (paginado) y para generar el Top N de recomendaciones sobre el
catálogo cargado desde PostgreSQL al iniciar el servidor.
"""
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.catalog import get_catalog, load_catalog, search_catalog
from backend.schemas import RecommendationResponse, SongList
from etl.load import save_recommendations
from model.recommender import get_recommendations

FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("⏳ Cargando catálogo desde PostgreSQL...")
    catalog = load_catalog()
    print(f"✅ Catálogo cargado: {len(catalog):,} canciones.")
    yield


app = FastAPI(title="Spotify Song Recommender API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _row_to_summary(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "artists": row["artists_display"],
        "main_genre": row["main_genre"],
        "mood_quadrant": row["mood_quadrant"],
        "popularity": int(row["popularity"]),
    }


def _row_to_detail(row):
    return {
        **_row_to_summary(row),
        "valence": float(row["valence"]),
        "energy": float(row["energy"]),
        "danceability_n": float(row["danceability_n"]),
        "energy_n": float(row["energy_n"]),
        "loudness_n": float(row["loudness_n"]),
        "speechiness_n": float(row["speechiness_n"]),
    }


@app.get("/api/songs", response_model=SongList)
def list_songs(search: str = "", offset: int = 0, limit: int = Query(50, le=200)):
    """Lista el catálogo por lotes, o filtra por nombre de canción/artista si se pasa `search`."""
    catalog = get_catalog()
    if search.strip():
        visible = search_catalog(catalog, search, limit=limit)
        total = len(visible)
    else:
        total = len(catalog)
        visible = catalog.iloc[offset: offset + limit]
    return {"total": total, "items": [_row_to_summary(r) for _, r in visible.iterrows()]}


@app.get("/api/songs/{song_id}")
def get_song(song_id: str):
    catalog = get_catalog()
    match = catalog[catalog['id'] == song_id]
    if match.empty:
        raise HTTPException(status_code=404, detail="Canción no encontrada")
    return _row_to_detail(match.iloc[0])


@app.get("/api/recommend/{song_id}", response_model=RecommendationResponse)
def recommend(song_id: str, top_n: int = 5, discovery: bool = False):
    """Calcula el Top N de canciones más afines usando el Score multifactorial."""
    catalog = get_catalog()
    match = catalog[catalog['id'] == song_id]
    if match.empty:
        raise HTTPException(status_code=404, detail="Canción no encontrada")
    query_song = match.iloc[0]

    recs = get_recommendations(query_song, catalog, top_n=top_n, discovery=discovery)

    try:
        save_recommendations(query_song['id'], list(zip(recs['id'], recs['prediction_score'])))
    except Exception as e:  # noqa: BLE001
        print(f"⚠️ No se pudo guardar recomendaciones: {e}")

    rec_items = []
    for _, row in recs.iterrows():
        item = _row_to_detail(row)
        item.update({
            "score": float(row['prediction_score']),
            "sim_audio": float(row['sim_audio']),
            "sim_mood": float(row['sim_mood']),
            "sim_genre": float(row['sim_genre']),
            "sim_pop": float(row['sim_pop']),
        })
        rec_items.append(item)

    return {"query": _row_to_detail(query_song), "recommendations": rec_items}
