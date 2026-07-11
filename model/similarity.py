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
