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

Copia `.env.example` a `.env` **en la raíz del proyecto** y completa `DATABASE_URL`
con las credenciales de tu instancia de PostgreSQL (por ejemplo, una en la nube:
Render, Supabase, Neon, Railway...):

```bash
cp .env.example .env
# editar .env con tus credenciales
```

> **Si usas Render** (u otro proveedor que te da un link `postgresql://...`):
> hay que ajustarlo antes de pegarlo en `.env`, porque el backend usa el driver
> **psycopg3** vía SQLAlchemy:
> 1. Cambia el esquema `postgresql://` por `postgresql+psycopg://`.
> 2. Agrega `?sslmode=require` al final si no lo trae (Render exige SSL).
> 3. Usa la **External Database URL** (no la Internal — esa solo funciona entre
>    servicios dentro de la red de Render, no desde tu máquina).
>
> Formato final: `postgresql+psycopg://usuario:password@host/dbname?sslmode=require`

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

> **Importante:** los comandos `uvicorn backend.main:app` y `python -m etl.load`
> se corren **siempre desde la raíz del proyecto** (donde están las carpetas
> `backend/`, `etl/`, `model/`, `data/`), **nunca desde adentro de una subcarpeta**
> como `backend/` — si te paras dentro de `backend/` y corres `uvicorn
> backend.main:app`, te va a tirar `ModuleNotFoundError: No module named
> 'backend'` porque Python arma ese paquete relativo a donde estás parado.
> Y también con el `venv` **activado** (`source venv/bin/activate`) — si no,
> el sistema puede ofrecerte instalar un `uvicorn` del sistema operativo (ej.
> `python3-uvicorn` vía `dnf`/`apt`) que no tiene el resto de las dependencias
> del proyecto (FastAPI, SQLAlchemy, psycopg, pandas...) y va a fallar igual.

### 3. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

La app queda en `http://localhost:5173` (el dev server proxea `/api` hacia el
backend en el puerto 8000).

## Volver a correr el ETL (`python -m etl.load`)

Es seguro correrlo más de una vez: antes de cargar, hace `TRUNCATE` de las 4
tablas (`artistas`, `canciones`, `generos`, `recomendaciones`) y las vuelve a
poblar desde cero, así que **no se duplican datos** entre corridas.

Ojo con dos cosas:
- Ese `TRUNCATE` también **borra el historial de `recomendaciones`** que se
  haya acumulado mientras alguien usaba la app (cada Top 5 generado se guarda
  ahí). Si les interesa conservarlo para el informe/validación, respalden esa
  tabla antes de volver a correr el ETL.
- Si varias personas del equipo comparten la misma base de datos en la nube,
  **coordinen quién corre el ETL** — la última corrida sobrescribe los datos
  de las demás.

## Estado del proyecto

Pipeline ETL, base de datos, motor de recomendación, backend y frontend
funcionales. Pendiente: informe IEEE, formulario SUS y validación con
usuarios (`docs/`).
