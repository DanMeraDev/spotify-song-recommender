# Imagen del backend (API FastAPI). Se construye con contexto en la raíz del
# repositorio (ver docker-compose.yml) para poder copiar model/ y etl/, de los
# que backend/ depende directamente.
FROM python:3.14-slim

WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ backend/
COPY etl/ etl/
COPY model/ model/
COPY database/ database/

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
