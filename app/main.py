"""
main.py

Responsable: Persona 2 (lógica) / Persona 3 (parte visual)

Propósito:
Punto de entrada de la aplicación Streamlit. Permite al usuario seleccionar
o buscar una canción y muestra las recomendaciones generadas por
model/recommender.py junto con las gráficas del dashboard BI (charts.py).

TODO:
- Configurar la página de Streamlit (título, layout, sidebar).
- Implementar buscador/selector de canción de entrada.
- Conectar con model/recommender.py para obtener el Top 10 de recomendaciones.
- Mostrar el listado de canciones recomendadas.
- Integrar las visualizaciones definidas en app/charts.py.
"""
import streamlit as st
import pandas as pd
import sys
import os

# Asegurar rutas de módulos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from model.recommender import get_recommendations

st.set_page_config(page_title="Spotify BI Recommender", layout="wide")

@st.cache_data
def load_catalog():
    # Carga el archivo recién creado por tu proceso ETL
    return pd.read_csv("data/processed_songs.csv")

st.title("🎵 Sistema de Recomendación Multifactorial - Spotify BI")
st.markdown("Busca una canción para predecir las pistas más afines usando el Modelo de Russell y Similitud Coseno.")

catalog_df = load_catalog()

# Selector interactivo
catalog_df['search_display'] = catalog_df['name'] + " — " + catalog_df['artists']
selected_display = st.selectbox("Selecciona o escribe una canción del catálogo:", catalog_df['search_display'].values)

query_song = catalog_df[catalog_df['search_display'] == selected_display].iloc[0]

st.subheader(f"Canción seleccionada: {query_song['name']}")
st.info(f"**Género Principal:** {query_song['main_genre']} | **Cuadrante de Mood:** {query_song['mood_quadrant']}")

st.markdown("---")
st.subheader("🚀 Top 10 Recomendaciones Predichas")

with st.spinner("Calculando similitudes matemáticas en tiempo real..."):
    recommendations_df = get_recommendations(query_song, catalog_df, top_n=10)

output_cols = ['name', 'artists', 'main_genre', 'mood_quadrant', 'prediction_score']
st.dataframe(
    recommendations_df[output_cols].style.format({'prediction_score': '{:.4f}'}),
    use_container_width=True
)

st.markdown("---")
st.subheader("📊 Análisis BI de la Recomendación")
st.info("Espacio reservado para los gráficos de dispersión de Mood (Russell) de app/charts.py")