"""
similarity.py

Responsable: Persona 2 (Fórmulas / motor)

Propósito:
Funciones de cálculo de similitud entre canciones a partir de sus audio
features (danceability, energy, key, loudness, mode, speechiness, mood),
incluyendo similitud coseno, distancia euclidiana y normalización de
features previa al cálculo.

TODO:
- Implementar función de normalización de audio features (ej. min-max o
  z-score) para que todas las features aporten en la misma escala.
- Implementar cálculo de similitud coseno entre dos vectores de canciones.
- Implementar cálculo de distancia euclidiana entre dos vectores de canciones.
- Definir cómo se combinan estas métricas en la fórmula multifactorial usada
  por recommender.py.
"""


import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def calculate_cosine_similarity(vector_a, vector_b):
    """
    Calcula la similitud coseno entre dos vectores hiperdimensionales.
    Ideal para comparar perfiles acústicos con magnitudes distintas.
    """
    # Convertimos a arreglos de numpy de 2D para que sklearn no arroje warnings
    v_a = np.array(vector_a).reshape(1, -1)
    v_b = np.array(vector_b).reshape(1, -1)
    
    # cosine_similarity devuelve una matriz, extraemos el valor escalar único
    return float(cosine_similarity(v_a, v_b)[0][0])

def calculate_russell_mood_similarity(valence_c, energy_c, valence_q, energy_q):
    """
    Calcula la similitud emocional basándose en la distancia euclidiana 
    dentro del Modelo Circumplejo del Afecto de Russell (1980).
    Normaliza el resultado en el rango [0, 1].
    """
    # Conversión a tipos vectorizados nativos por rendimiento
    val_c = np.array(valence_c)
    energ_c = np.array(energy_c)
    
    # Fórmula analítica: Distancia Euclidiana en R^2
    distance = np.sqrt((val_c - valence_q)**2 + (energ_c - energy_q)**2)
    
    # Similitud normalizada utilizando la distancia máxima teórica (raíz de 2)
    sim_mood = 1.0 - (distance / np.sqrt(2))
    return sim_mood