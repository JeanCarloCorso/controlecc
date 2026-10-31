#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"

usage() {
  echo "Uso: ./dev.sh {start|stop|clear}"
}

ensure_env() {
  if [ ! -f .env ]; then
    cp .env.example .env
    echo "Arquivo .env criado a partir de .env.example."
    echo "Revise os segredos antes de usar este ambiente fora do desenvolvimento local."
  fi
}

ensure_env
COMPOSE_PROJECT_NAME=$(sed -n 's/^COMPOSE_PROJECT_NAME=//p' .env | tail -n 1)
if [ -z "$COMPOSE_PROJECT_NAME" ]; then
  echo "Erro: COMPOSE_PROJECT_NAME deve ser definido no arquivo .env." >&2
  exit 1
fi
export COMPOSE_PROJECT_NAME

case "${1:-}" in
  start)
    docker compose --env-file .env up --build --detach postgres minio minio-init mailpit app reverse-proxy
    echo "ControleCC iniciado em http://localhost"
    ;;
  stop)
    docker compose --env-file .env down --remove-orphans
    ;;
  clear)
    docker compose --env-file .env down --remove-orphans
    docker volume rm \
      "${COMPOSE_PROJECT_NAME}_postgres_data" \
      "${COMPOSE_PROJECT_NAME}_minio_data" \
      2>/dev/null || true
    echo "Serviços interrompidos e dados locais do PostgreSQL e MinIO removidos."
    ;;
  *)
    usage
    exit 1
    ;;
esac
