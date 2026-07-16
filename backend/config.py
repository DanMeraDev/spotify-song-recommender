"""
config.py

Responsable: Persona 1 (Datos)

Propósito:
Carga la configuración del backend desde el archivo .env en la raíz del
proyecto (ver .env.example para la plantilla). Expone DATABASE_URL para
conectarse a PostgreSQL.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "Falta DATABASE_URL. Copia .env.example a .env en la raíz del proyecto "
        "y completa las credenciales de tu base de datos PostgreSQL."
    )
