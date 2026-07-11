"""
recommender.py

Responsable: Persona 2 (Fórmulas / motor)

Propósito:
Motor de recomendación de canciones. Dada una canción de entrada, calcula
un score de afinidad multifactorial contra el resto del catálogo (usando las
funciones de similarity.py) y retorna el Top 10 de canciones más afines.

TODO:
- Implementar función Score(cancion_origen, cancion_candidata) que combine
  similitud de audio features, género y popularidad del artista.
- Implementar función que, dada una canción de entrada, calcule el Score
  contra todas las candidatas y retorne el Top 10 ordenado.
- Definir pesos de cada factor de la fórmula multifactorial (ver
  model/formulas.md).
- Optimizar el cálculo para el volumen del dataset (~491.632 canciones).
"""
