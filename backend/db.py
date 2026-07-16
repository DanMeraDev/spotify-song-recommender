"""
db.py

Responsable: Persona 1 (Datos)

Propósito:
Motor de conexión SQLAlchemy hacia la base de datos PostgreSQL configurada en
.env (ver backend/config.py).
"""
from sqlalchemy import create_engine

from backend.config import DATABASE_URL

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
