"""
main.py

Responsable: Persona 2 (lógica) / Persona 3 (parte visual)

Propósito:
Aplicación Streamlit del sistema de recomendación. El usuario explora el
catálogo por lotes o busca una canción; al elegir una, obtiene el Top 5 de
canciones más afines (según el Score multifactorial) junto con el dashboard BI
que explica el porqué de cada recomendación.
"""
import ast
import os
import sys

import pandas as pd

# IMPORTANTE: usar strings clásicos (object) y no los respaldados en PyArrow que
# pandas 3.x activa por defecto. Esa ruta nueva provoca segfaults nativos dentro
# del servidor de Streamlit al operar sobre columnas grandes (p. ej. el buscador
# sobre ~491K filas). Debe fijarse ANTES de leer cualquier CSV.
pd.set_option("future.infer_string", False)

import streamlit as st

# Asegurar rutas de módulos locales
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import charts
from etl.load import save_recommendations
from model.recommender import get_recommendations

BATCH_SIZE = 50          # canciones por lote en el listado
MAX_SEARCH_RESULTS = 50  # tope de resultados del buscador

st.set_page_config(page_title="Spotify BI Recommender", layout="wide", page_icon="🎵")


def _format_artists(raw):
    """Convierte el campo artists ('["A", "B"]') en texto legible 'A, B'."""
    try:
        parsed = ast.literal_eval(raw)
        if isinstance(parsed, (list, tuple)):
            return ", ".join(str(a) for a in parsed)
    except (ValueError, SyntaxError):
        pass
    return str(raw)


# Solo las columnas que la app y el motor realmente usan (reduce memoria a ~la mitad).
_CATALOG_COLS = [
    'id', 'name', 'artists', 'main_genre', 'mood_quadrant', 'popularity', 'genres',
    'valence', 'energy', 'artist_popularity', 'primary_artist_id',
    'danceability_n', 'energy_n', 'loudness_n', 'speechiness_n',
]


@st.cache_resource(show_spinner="Cargando catálogo de canciones...")
def load_catalog():
    """
    Carga el catálogo enriquecido una sola vez y lo comparte como recurso de solo
    lectura. Se usa cache_resource (no cache_data) para NO copiar/serializar el
    DataFrame de ~491K filas en cada rerun, lo que agotaría la memoria al escribir
    en el buscador. Ninguna parte de la app muta este objeto.
    """
    df = pd.read_csv("data/processed_songs.csv", usecols=_CATALOG_COLS)
    df['artists_display'] = df['artists'].apply(_format_artists)
    # Clave de búsqueda normalizada (minúsculas) para un filtrado vectorizado rápido.
    df['search_key'] = (df['name'].fillna('') + ' ' + df['artists_display']).str.lower()
    # Orden por popularidad para que el listado por defecto muestre lo más relevante.
    df = df.sort_values('popularity', ascending=False).reset_index(drop=True)
    return df


def search_catalog(catalog, query):
    """Filtrado eficiente por subcadena (barrido vectorizado en C sobre ~491K filas)."""
    mask = catalog['search_key'].str.contains(query.strip().lower(), regex=False, na=False)
    return catalog[mask].head(MAX_SEARCH_RESULTS)


# ----------------------------- UI -----------------------------
catalog = load_catalog()

st.title("🎵 Recomendador Musical Multifactorial — Spotify BI")
st.caption(f"Catálogo de {len(catalog):,} canciones · Score = 0.45·Audio + 0.25·Mood + "
           "0.20·Género + 0.10·Popularidad")

# Estado de sesión
if 'batch_offset' not in st.session_state:
    st.session_state.batch_offset = BATCH_SIZE
if 'query' not in st.session_state:
    st.session_state.query = ''

# Buscador dentro de un formulario: la búsqueda se ejecuta solo al enviar (Enter o
# botón), no en cada tecla. Evita reruns/consultas innecesarias sobre 491K filas.
col_search, col_opts = st.columns([3, 1])
with col_search:
    with st.form("form_busqueda", clear_on_submit=False):
        fcol1, fcol2 = st.columns([4, 1])
        with fcol1:
            query_input = st.text_input("🔎 Buscar canción o artista", value=st.session_state.query,
                                        placeholder="Ej: Coldplay, Blinding Lights...",
                                        label_visibility="collapsed")
        with fcol2:
            submitted = st.form_submit_button("🔎 Buscar", width='stretch')
    if submitted:
        st.session_state.query = query_input
with col_opts:
    discovery = st.toggle("Modo descubrimiento", help="Favorece canciones menos conocidas (invierte la popularidad).")

query = st.session_state.query

# Listado: resultados de búsqueda o lote del catálogo
if query.strip():
    with st.spinner(f"🔎 Buscando “{query.strip()}” en {len(catalog):,} canciones..."):
        visible = search_catalog(catalog, query)
    header = f"Resultados de búsqueda ({len(visible)})"
    if st.button("✖️ Limpiar búsqueda"):
        st.session_state.query = ''
        st.rerun()
    st.subheader(header)
else:
    visible = catalog.head(st.session_state.batch_offset)
    st.subheader(f"Catálogo — mostrando {len(visible):,} de {len(catalog):,}")

st.dataframe(
    visible[['name', 'artists_display', 'main_genre', 'mood_quadrant', 'popularity']]
        .rename(columns={'name': 'Canción', 'artists_display': 'Artista',
                         'main_genre': 'Género', 'mood_quadrant': 'Mood',
                         'popularity': 'Popularidad'}),
    width='stretch', hide_index=True, height=280,
)

# Botón "Ver más" (solo en modo listado, no en búsqueda)
if not query.strip() and st.session_state.batch_offset < len(catalog):
    if st.button(f"⬇️ Ver más ({BATCH_SIZE} canciones)"):
        st.session_state.batch_offset += BATCH_SIZE
        st.rerun()

st.markdown("---")

# Selección de canción entre las visibles
if visible.empty:
    st.warning("No se encontraron canciones. Prueba con otro término.")
    st.stop()

labels = {f"{r['name']} — {r['artists_display']}": r['id'] for _, r in visible.iterrows()}
selected_label = st.selectbox("🎧 Elige una canción de la lista para recomendar:", list(labels.keys()))

if st.button("🚀 Recomendar canciones afines", type="primary"):
    query_song = catalog[catalog['id'] == labels[selected_label]].iloc[0]

    st.subheader(f"Canción base: {query_song['name']} — {query_song['artists_display']}")
    st.info(f"**Género:** {query_song['main_genre']}  ·  **Mood:** {query_song['mood_quadrant']}")

    with st.spinner("Calculando similitudes sobre todo el catálogo..."):
        recs = get_recommendations(query_song, catalog, top_n=5, discovery=discovery)

    # Persistir el Top 5 en la tabla recomendaciones (no debe romper la app si falla)
    try:
        save_recommendations(query_song['id'], list(zip(recs['id'], recs['prediction_score'])))
    except Exception as e:  # noqa: BLE001
        st.caption(f"(No se pudo guardar en la BD: {e})")

    st.subheader("🏆 Top 5 recomendaciones")
    st.dataframe(
        recs[['name', 'artists_display', 'main_genre', 'mood_quadrant', 'prediction_score']]
            .rename(columns={'name': 'Canción', 'artists_display': 'Artista',
                             'main_genre': 'Género', 'mood_quadrant': 'Mood',
                             'prediction_score': 'Score'})
            .style.format({'Score': '{:.4f}'}),
        width='stretch', hide_index=True,
    )

    st.markdown("---")
    st.subheader("📊 Análisis BI de la recomendación")
    c1, c2 = st.columns(2)
    with c1:
        st.plotly_chart(charts.mood_map(query_song, recs), width='stretch')
    with c2:
        st.plotly_chart(charts.genre_distribution(recs), width='stretch')
    st.plotly_chart(charts.factor_breakdown(recs), width='stretch')
