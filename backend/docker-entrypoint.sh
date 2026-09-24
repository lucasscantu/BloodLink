#!/bin/sh
set -e

DEPLOYED_FILE="${BLOCKCHAIN_DEPLOYED_PATH:-/app/shared/deployed.json}"

echo "[backend] Aguardando o contrato ser implantado ($DEPLOYED_FILE)..."
until [ -f "$DEPLOYED_FILE" ]; do
  sleep 1
done
echo "[backend] Contrato encontrado."

npx ts-node scripts/docker-bootstrap.ts

echo "[backend] Iniciando servidor..."
exec node dist/index.js
