"""
charts.py

Responsable: Persona 3 (parte visual)

Propósito:
Gráficas del dashboard de Business Intelligence (Plotly) que acompañan a las
recomendaciones de app/main.py y explican POR QUÉ se recomendó cada canción:
  - mapa de moods (modelo de Russell: valence vs energy),
  - distribución de géneros de las recomendaciones,
  - desglose de la contribución de cada factor al score.
"""
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

from model.recommender import WEIGHTS

# Etiquetas de los cuadrantes de Russell y su posición aproximada en el plano.
_QUADRANTS = [
    (0.75, 0.75, "Enérgico / Festivo"),
    (0.25, 0.75, "Intenso / Agresivo"),
    (0.75, 0.25, "Relajado / Alegre"),
    (0.25, 0.25, "Melancólico"),
]


def mood_map(query_song, recs_df):
    """Scatter valence (x) vs energy (y) con los 4 cuadrantes de Russell."""
    fig = go.Figure()

    # Líneas divisorias de los cuadrantes (umbral 0.5)
    fig.add_hline(y=0.5, line_dash="dot", line_color="gray")
    fig.add_vline(x=0.5, line_dash="dot", line_color="gray")
    for x, y, label in _QUADRANTS:
        fig.add_annotation(x=x, y=y, text=label, showarrow=False,
                           font=dict(size=11, color="gray"), opacity=0.7)

    # Canciones recomendadas
    fig.add_trace(go.Scatter(
        x=recs_df['valence'], y=recs_df['energy'],
        mode='markers', name='Recomendadas',
        marker=dict(size=13, color='#1DB954', line=dict(width=1, color='white')),
        text=recs_df['name'], hovertemplate='%{text}<br>valence=%{x:.2f}<br>energy=%{y:.2f}<extra></extra>',
    ))

    # Canción de entrada (estrella)
    fig.add_trace(go.Scatter(
        x=[query_song['valence']], y=[query_song['energy']],
        mode='markers', name='Tu canción',
        marker=dict(size=20, color='#FF4B4B', symbol='star', line=dict(width=1, color='white')),
        text=[query_song['name']], hovertemplate='%{text}<br>valence=%{x:.2f}<br>energy=%{y:.2f}<extra></extra>',
    ))

    fig.update_layout(
        title="Mapa de moods (modelo de Russell)",
        xaxis=dict(title="Valence (positividad) →", range=[0, 1]),
        yaxis=dict(title="Energy (intensidad) →", range=[0, 1]),
        height=430, legend=dict(orientation="h", yanchor="bottom", y=1.02),
    )
    return fig


def genre_distribution(recs_df):
    """Barra con la distribución de géneros principales de las recomendaciones."""
    counts = recs_df['main_genre'].value_counts().reset_index()
    counts.columns = ['main_genre', 'conteo']
    fig = px.bar(counts, x='conteo', y='main_genre', orientation='h',
                 title="Géneros de las recomendaciones",
                 color='conteo', color_continuous_scale='Greens', text='conteo')
    fig.update_layout(height=430, yaxis_title="", xaxis_title="Canciones",
                      coloraxis_showscale=False)
    return fig


def factor_breakdown(recs_df):
    """Barra apilada: contribución ponderada de cada factor al score por canción."""
    data = recs_df.copy()
    contribs = pd.DataFrame({
        'Canción': data['name'],
        'Audio': WEIGHTS['audio'] * data['sim_audio'].to_numpy(),
        'Mood': WEIGHTS['mood'] * data['sim_mood'].to_numpy(),
        'Género': WEIGHTS['genre'] * data['sim_genre'].to_numpy(),
        'Popularidad': WEIGHTS['pop'] * data['sim_pop'].to_numpy(),
    })
    melted = contribs.melt(id_vars='Canción', var_name='Factor', value_name='Contribución')
    fig = px.bar(melted, x='Contribución', y='Canción', color='Factor', orientation='h',
                 title="¿Por qué se recomendó? (aporte de cada factor al score)",
                 color_discrete_map={'Audio': '#1DB954', 'Mood': '#4B9CD3',
                                     'Género': '#F5A623', 'Popularidad': '#B96BD6'})
    fig.update_layout(height=430, yaxis_title="", xaxis_title="Score acumulado",
                      legend=dict(orientation="h", yanchor="bottom", y=1.02))
    return fig
