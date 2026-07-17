#!/usr/bin/env bash
# Levanta el entorno de desarrollo de Ensambla desde cero:
# mata lo que ocupe el puerto de la app, limpia locks viejos de Next,
# se asegura de que el Postgres local esté corriendo y arranca `next dev`.
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-3001}"          # 3000 suele estar ocupado por otro proyecto
DB_CONTAINER="ensambla-db"    # Postgres local (puerto host 5433)

# 1. Matar procesos que ocupen el puerto de la app.
PIDS=$(lsof -nP -t -iTCP:"$PORT" -sTCP:LISTEN || true)
if [ -n "$PIDS" ]; then
  echo "▶ Matando procesos en el puerto $PORT: $PIDS"
  kill $PIDS 2>/dev/null || true
  sleep 1
  # Si alguno sigue vivo, forzar.
  for pid in $PIDS; do
    kill -9 "$pid" 2>/dev/null || true
  done
fi

# 2. Limpiar el lock de dev server de Next (queda huérfano si murió mal).
rm -rf .next/dev

# 3. Postgres local: arrancar el container si existe y está parado.
if command -v docker >/dev/null 2>&1; then
  STATE=$(docker inspect -f '{{.State.Running}}' "$DB_CONTAINER" 2>/dev/null || echo "missing")
  case "$STATE" in
    true)    echo "▶ Postgres ($DB_CONTAINER) ya está corriendo." ;;
    false)   echo "▶ Arrancando Postgres ($DB_CONTAINER)…"; docker start "$DB_CONTAINER" >/dev/null ;;
    missing) echo "⚠ No existe el container $DB_CONTAINER. Crealo con:"
             echo "  docker run -d --name $DB_CONTAINER -e POSTGRES_USER=ensambla -e POSTGRES_PASSWORD=ensambla -e POSTGRES_DB=ensambla -p 5433:5432 postgres:17-alpine"
             exit 1 ;;
  esac
else
  echo "⚠ Docker no está disponible; asumo que Postgres corre por otro lado."
fi

# 4. Levantar la app.
echo "▶ Levantando Next.js en http://localhost:$PORT"
exec npm run dev -- --port "$PORT"
