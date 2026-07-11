"""
transform.py

Responsable: Persona 1 (Datos)

Propósito:
Limpieza de los datos extraídos, JOIN entre canciones y artistas, y cálculo
de atributos derivados (por ejemplo, un índice de "mood" a partir de
danceability, energy, loudness y mode) que alimentarán al motor de
recomendación en model/.

TODO:
- Limpiar valores nulos/duplicados en songs.csv y artists.csv.
- Normalizar tipos de datos (ej. géneros como lista, artists como lista).
- Realizar el JOIN entre canciones y artistas (por id de artista).
- Calcular el campo derivado de "mood" a partir de las audio features.
- Dejar el DataFrame final listo para ser insertado en la base de datos
  por load.py.
"""
