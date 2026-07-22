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
├── docker-compose.yml    # orquesta backend + frontend en contenedores
├── .dockerignore
├── deploy/
│   └── deploy.sh          # script único de despliegue en una instancia EC2
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
│   ├── main.py           # endpoints
│   └── Dockerfile
├── frontend/              # Vite + React + TypeScript + Tailwind + Recharts
│   ├── src/
│   ├── Dockerfile         # build multi-stage: Node -> Nginx
│   └── nginx.conf
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

## Despliegue con Docker

El proyecto está dockerizado: `backend/Dockerfile` (API FastAPI) y
`frontend/Dockerfile` (build de Vite servido con Nginx, que además hace de
proxy hacia el backend en `/api`). `docker-compose.yml` orquesta ambos.
La base de datos **no** se dockeriza — se asume una instancia PostgreSQL ya
existente (Render, Supabase, etc.), igual que en el desarrollo local.

### 1. Configurar credenciales

```bash
cp .env.example .env
# completar DATABASE_URL (ver la nota de Render más arriba)
```

### 2. Construir las imágenes

```bash
docker compose build
```

### 3. Poblar la base de datos (solo la primera vez, o cuando quieran refrescar los datos)

```bash
docker compose run --rm backend python -m etl.load
```

Esto monta `data/` como volumen de solo lectura dentro del contenedor — no hace
falta reconstruir la imagen para correr el ETL, y los CSV pesados nunca se
copian a la imagen.

### 4. Levantar todo

```bash
docker compose up -d
```

- Frontend: `http://localhost` (puerto 80)
- Backend: `http://localhost:8000` (docs en `/docs`)

Para ver logs o bajar los contenedores:

```bash
docker compose logs -f
docker compose down
```

## Despliegue en una instancia EC2 (AWS)

Todo el proyecto (backend + frontend) corre en **una sola instancia** vía
`docker compose` — no hace falta separar en varios servicios como en Render.

### 1. Crear la instancia

En la consola de EC2:

- **AMI**: Amazon Linux 2023.
- **Tipo de instancia**: `t3.micro` alcanza (el backend usa ~500 MB de RAM;
  el script de despliegue agrega 2 GB de swap como red de seguridad). Si
  notás lentitud, subí a `t3.small` sin cambiar nada más.
- **Key pair**: creá uno nuevo y descargá el `.pem` — lo vas a necesitar para
  conectarte por SSH.
- **Security group**: abrí los puertos
  - `22` (SSH) — desde tu IP.
  - `80` (frontend) — desde `0.0.0.0/0`.
  - `8000` (backend, opcional, para ver `/docs`) — desde `0.0.0.0/0`.

### 2. Conectarte y desplegar

```bash
ssh -i tu-llave.pem ec2-user@<IP-pública-de-la-instancia>

sudo dnf install -y git
git clone https://github.com/DanMeraDev/spotify-song-recommender.git
cd spotify-song-recommender
bash deploy/deploy.sh
```

Como el repo es **público**, clonar no pide ningún token de GitHub.

`deploy/deploy.sh` es un único script (idempotente, se puede correr de nuevo
sin problema) que instala Docker, agrega 2 GB de swap, pide tu `DATABASE_URL`
si no existe `.env` todavía, construye las imágenes y levanta los contenedores.
**No corre el ETL automáticamente** (es destructivo — hace `TRUNCATE`); si tu
`DATABASE_URL` ya apunta a una base ya poblada (por ejemplo, la misma que
usaste en desarrollo), no hace falta volver a correrlo.

Al terminar, la app queda en `http://<IP-pública-de-la-instancia>`.

### 3. Actualizar tras un cambio en el repo

```bash
cd spotify-song-recommender
git pull
sudo docker compose build
sudo docker compose up -d
```

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
