"""
load.py

Responsable: Persona 1 (Datos)

Propósito:
Inserción de los datos ya transformados (transform.py) en la base de datos
definida en database/schema.sql (tablas: canciones, artistas, generos,
recomendaciones).

TODO:
- Establecer la conexión a la base de datos (SQLite por defecto, ver
  database/schema.sql).
- Implementar función para insertar/actualizar la tabla de artistas.
- Implementar función para insertar/actualizar la tabla de canciones.
- Implementar función para insertar/actualizar la tabla de géneros.
- Manejar inserciones en lote (batch insert) dado el volumen de datos
  (~491.632 canciones).
"""
