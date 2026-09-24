#!/bin/sh
set -e

echo "[blockchain] Iniciando nó Hardhat local..."
npx hardhat node --hostname 0.0.0.0 &
NODE_PID=$!

echo "[blockchain] Aguardando o nó ficar disponível em 127.0.0.1:8545..."
until curl -s -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' > /dev/null 2>&1; do
  sleep 1
done
echo "[blockchain] Nó disponível."

echo "[blockchain] Implantando o contrato BloodChainRegistry..."
npx hardhat run scripts/deploy.ts --network localhost

echo "[blockchain] Contrato implantado. Arquivo deployed.json publicado em /app/shared."
echo "[blockchain] Nó Hardhat continua rodando em primeiro plano (PID $NODE_PID)."

wait "$NODE_PID"
