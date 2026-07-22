"""
similarity.py

Responsable: Persona 2 (Fórmulas / motor)

Propósito:
Funciones de cálculo de similitud entre canciones a partir de sus audio
features (danceability, energy, loudness, speechiness) y de su vector emocional
(valence, energy), incluyendo similitud coseno, similitud de mood (modelo de
Russell basado en distancia euclidiana) y normalización min-max de features.

Ver model/formulas.md para la justificación matemática completa.
"""

import numpy as np
import pandas as pd


def normalize_minmax(data):
    """
    Escala a [0, 1] mediante normalización min-max: (x - min) / (max - min).

    Acepta una pandas.Series o un pandas.DataFrame (normaliza cada columna de
    forma independiente). Se usa en el ETL para dejar las audio features en la
    misma escala antes de calcular la similitud coseno, evitando que loudness
    (rango [-60, 0]) domine sobre las demás features (rango [0, 1]).

    Si una columna es constante (max == min) devuelve 0.0 para evitar dividir
    entre cero.
    """
    min_v = data.min()
    max_v = data.max()
    rango = max_v - min_v
    # Evita división entre cero en columnas constantes
    rango = rango.replace(0, 1) if isinstance(rango, pd.Series) else (rango or 1)
    return (data - min_v) / rango


def calculate_cosine_similarity(vector_a, vector_b):
    """
    Calcula la similitud coseno entre dos vectores: cos(θ) = (A·B)/(||A||·||B||).
    Ideal para comparar perfiles acústicos independientemente de su magnitud.

    Los vectores deben venir ya normalizados (ver normalize_minmax).
    """
    v_a = np.asarray(vector_a, dtype=float)
    v_b = np.asarray(vector_b, dtype=float)
    norm_a = np.linalg.norm(v_a) or 1.0
    norm_b = np.linalg.norm(v_b) or 1.0
    return float(np.dot(v_a, v_b) / (norm_a * norm_b))


def cosine_similarity_batch(matrix, vector):
    """
    Similitud coseno entre cada fila de `matrix` (n, d) y un único `vector` (d,).

    Implementación propia en NumPy (equivalente a
    sklearn.metrics.pairwise.cosine_similarity para este caso) para no depender
    de scikit-learn/scipy en el backend: esas librerías agregan ~70 MB solo al
    importarlas, un costo demasiado alto en una instancia con memoria limitada
    (el backend mantiene además todo el catálogo cargado en memoria).
    """
    matrix = np.asarray(matrix, dtype=float)
    vector = np.asarray(vector, dtype=float).reshape(-1)

    matrix_norms = np.linalg.norm(matrix, axis=1)
    vector_norm = np.linalg.norm(vector) or 1.0
    # Evita división entre cero en vectores nulos (mismo criterio que sklearn).
    matrix_norms = np.where(matrix_norms == 0, 1.0, matrix_norms)

    return (matrix @ vector) / (matrix_norms * vector_norm)


def calculate_russell_mood_similarity(valence_c, energy_c, valence_q, energy_q):
    """
    Calcula la similitud emocional según el Modelo Circumplejo del Afecto de
    Russell (1980). Cada canción es un vector emocional (valence, energy) y la
    similitud es 1 menos la distancia euclidiana normalizada por √2 (la máxima
    distancia posible en el cuadrado unitario):

        Sim_mood(c, q) = 1 - sqrt((Vc-Vq)^2 + (Ec-Eq)^2) / sqrt(2)

    Acepta escalares o arreglos numpy (vectorizado). Devuelve valores en [0, 1],
    donde 1 = mismo estado emocional y 0 = estados opuestos.
    """
    val_c = np.asarray(valence_c, dtype=float)
    energ_c = np.asarray(energy_c, dtype=float)

    distance = np.sqrt((val_c - valence_q) ** 2 + (energ_c - energy_q) ** 2)
    sim_mood = 1.0 - (distance / np.sqrt(2))
    return sim_mood
