# Spotify Song Recommender

Proyecto universitario de Business Intelligence. Sistema de recomendación musical
que, dada una canción de entrada, predice y recomienda las canciones más afines
utilizando un modelo de **filtrado basado en contenido** con una fórmula de
similitud multifactorial (audio features + mood + género + popularidad).

Arquitectura: **frontend React** + **backend FastAPI** + **PostgreSQL**.

## Dataset

**490K Spotify Song Audio Embeddings & Metadata** (Kaggle)
Link: https://www.kaggle.com/datasets/rodolfofigueroa/spotify-12m-songs

Archivos utilizados: `songs_final.csv` (~491.632 filas) y `artists.csv` (~63.857
filas). Los CSV no se versionan en este repositorio por su tamaño. Ver
`data/README.md` para las instrucciones de descarga.

## Estructura del proyecto

```
spotify-song-recommender/
├── .env.example          # plantilla de credenciales de PostgreSQL
├── data/                 # CSVs de origen (no versionados) + instrucciones de descarga
├── etl/                  # Extracción, transformación y carga a PostgreSQL
│   ├── extract.py
│   ├── transform.py
│   └── load.py
├── database/             # Esquema relacional (PostgreSQL) y modelo entidad-relación
│   ├── schema.sql
│   └── modelo_er.md
├── model/                # Motor de recomendación (pandas puro, sin dependencias web)
│   ├── similarity.py
│   ├── recommender.py
│   └── formulas.md
├── backend/              # API FastAPI
│   ├── config.py         # lee .env
│   ├── db.py             # engine SQLAlchemy
│   ├── catalog.py        # carga el catálogo desde PostgreSQL (cacheado en memoria)
│   ├── schemas.py        # modelos Pydantic de las respuestas
│   └── main.py           # endpoints
├── frontend/              # Vite + React + TypeScript + Tailwind + Recharts
│   └── src/
└── docs/                  # Informe, validación y PDFs de referencia
    ├── informe_ieee/
    ├── formulario_SUS.md
    └── validacion.md
```

## División de tareas

| Persona | Rol | Carpetas a cargo |
|---|---|---|
| Persona 1 | Datos | `etl/`, `database/` |
| Persona 2 | Fórmulas / motor de recomendación | `model/`, `backend/` |
| Persona 3 | Informe / validación | `docs/`, `frontend/` |

## Instalación

### 1. Base de datos (PostgreSQL)

Copia `.env.example` a `.env` en la raíz y completa `DATABASE_URL` con las
credenciales de tu instancia de PostgreSQL (por ejemplo, una en la nube:
Supabase, Neon, Railway...):

```bash
cp .env.example .env
# editar .env con tus credenciales
```

### 2. Backend (Python)

```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r backend/requirements.txt

# Poblar la base de datos (requiere data/songs_final.csv y data/artists.csv)
python -m etl.load

# Levantar la API
uvicorn backend.main:app --reload
```

La API queda en `http://localhost:8000` (docs interactivas en `/docs`).

### 3. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

La app queda en `http://localhost:5173` (el dev server proxea `/api` hacia el
backend en el puerto 8000).

## Estado del proyecto

Pipeline ETL, base de datos, motor de recomendación, backend y frontend
funcionales. Pendiente: informe IEEE, formulario SUS y validación con
usuarios (`docs/`).
