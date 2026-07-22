#!/usr/bin/env bash
#
# deploy.sh
#
# Script único de despliegue para una instancia EC2 con Ubuntu (22.04/24.04).
# Instala Docker, agrega swap de seguridad, pide las credenciales de la base
# de datos si hace falta, construye las imágenes y levanta backend + frontend.
#
# Uso (parado en la raíz del repo ya clonado, ej. tras `git clone` + `cd`):
#   bash deploy/deploy.sh
#
# Es seguro correrlo más de una vez (idempotente): si Docker/el swap ya están
# instalados, o si .env ya existe, esos pasos se saltan.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> Repositorio: $REPO_ROOT"

# 1. Docker + plugin de Compose, vía el instalador oficial de Docker (cubre
#    Ubuntu/Debian por igual e instala docker-compose-plugin de una vez).
if ! command -v docker &>/dev/null; then
    echo "==> Instalando Docker..."
    sudo apt-get update -y
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    rm -f /tmp/get-docker.sh
    sudo usermod -aG docker "$USER"
else
    echo "==> Docker ya está instalado."
fi

if ! sudo docker compose version &>/dev/null; then
    echo "==> Instalando el plugin de Docker Compose..."
    sudo apt-get update -y
    sudo apt-get install -y docker-compose-plugin
else
    echo "==> Docker Compose ya está instalado."
fi

# 3. Swap de 2GB — red de seguridad de memoria. El backend carga el catálogo
#    completo en memoria (~500MB medidos); en una instancia con poca RAM
#    (ej. t3.micro, 1GB) el swap evita que un pico puntual mate el proceso.
if [ ! -f /swapfile ]; then
    echo "==> Configurando 2GB de swap..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
else
    echo "==> El swap ya está configurado."
fi

# 4. Credenciales de la base de datos
if [ ! -f .env ]; then
    echo "==> No existe .env. Vamos a crearlo."
    echo "    Pega tu DATABASE_URL en formato psycopg (ver .env.example):"
    echo "    postgresql+psycopg://usuario:password@host/dbname?sslmode=require"
    read -rp "DATABASE_URL: " DB_URL
    echo "DATABASE_URL=${DB_URL}" > .env
    echo "==> .env creado."
else
    echo "==> .env ya existe, se usa el que está."
fi

# 5. Construir las imágenes
echo "==> Construyendo las imágenes (puede tardar unos minutos la primera vez)..."
sudo docker compose build

# 6. ETL — NUNCA se corre automático: es destructivo (TRUNCATE) y no hace
#    falta si tu DATABASE_URL ya apunta a una base de datos ya poblada.
echo ""
echo "==> IMPORTANTE: este paso NO corre el ETL automáticamente."
echo "    Solo corre 'docker compose run --rm backend python -m etl.load' si:"
echo "      a) es la primera vez que poblás esta base de datos, Y"
echo "      b) tenés data/songs_final.csv y data/artists.csv en esta instancia"
echo "         (no vienen en el repo por su tamaño — hay que subirlos aparte,"
echo "         ej. con scp, o descargarlos de Kaggle en la instancia)."
echo "    Ese comando hace TRUNCATE de las tablas antes de recargar: si tu"
echo "    base ya tiene datos (ej. la misma de Render que usaste en desarrollo),"
echo "    NO lo corras — solo levantá los contenedores (paso siguiente)."
echo ""

# 7. Levantar los contenedores
echo "==> Levantando backend + frontend..."
sudo docker compose up -d

PUBLIC_IP="$(curl -sf --max-time 3 http://169.254.169.254/latest/meta-data/public-ipv4 || echo '<tu-ip-publica>')"
echo ""
echo "✅ Listo. Backend y frontend corriendo."
echo "   Frontend: http://${PUBLIC_IP}"
echo "   Backend:  http://${PUBLIC_IP}:8000/docs"
echo ""
echo "Para ver logs:      sudo docker compose logs -f"
echo "Para bajar todo:    sudo docker compose down"
echo "Para actualizar:    git pull && sudo docker compose build && sudo docker compose up -d"
