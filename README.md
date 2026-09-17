# HospitalChain

> **[31mPROT[0m[33mTIP[0mO ACAD[33m[0m[31m[0m[33m[0m** - Sistema de rastreabilidade, gerenciamento e redistribuio de bolsas de sangue entre hospitais e hemocentros utilizando blockchain.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

---

## [36m[0m[1m[0m[36mO QUE [0m[1m[0m[36m[0m

O **HospitalChain**  um **prottipo acadmico** que implementa um sistema completo para:

- [32m[0mRastrear bolsas de sangue do doador at o paciente
- [32m[0mGerenciar estoque entre instituies
- [32m[0mRegistrar eventos imutavelmente na blockchain
- [32m[0mCoordenar demandas e transferncias
- [32m[0mMonitorar condies de armazenamento (temperatura)
- [32m[0mGerar QR Codes para rastreamento fsico

**[31m[0mIMPORTANTE: Este  um prottipo para fins educacionais. NO deve ser utilizado em ambiente de produo mdico sem as devidas certificaes e adaptaes.[0m**

---

## [36m[0m[1m[0m[36mARQUITETURA[0m

```
[34mFRONTEND[0m (React 18 + Vite + TypeScript + Tailwind CSS)
       [37m|[0m
       [37mHTTP/REST[0m
       [37mv[0m
[32mBACKEND[0m (Node.js 20 + Express + TypeScript)
       [37m|[0m
       [37mJWT Auth + Prisma ORM[0m
       [37m|[0m
       [37mv[0m
[35mPOSTGRESQL[0m 15 (Docker)
       [37m|[0m
       [37mv[0m
[36mBLOCKCHAIN[0m (Hardhat + Solidity + Ethers.js)
```

---

## [32m[0m[1m[0mIN[32m[0m[1m[0mCIE R[32m[0m[1m[0mAPIDO[0m

### [33m[0mPr-requisitos[0m

| Requisito | Verso | Verificao |
|-----------|---------|------------|
| Node.js | [32m20.x[0m | `node --version` |
| npm | [32m9.x[0m | `npm --version` |
| Git | [32m2.x[0m | `git --version` |
| Docker | [32m20.x[0m | `docker --version` |
| Docker Compose | [32m2.x[0m | `docker compose version` |

### [33m[0m1. Clonar o Repositrio[0m

```bash
# HTTPS
git clone https://github.com/lucasscantu/BloodLink.git
cd BloodLink

# SSH (se configurado)
git clone git@github.com:lucasscantu/BloodLink.git
cd BloodLink
```

### [33m[0m2. [32m[0mMETODO RECOMENDADO: Docker Compose[0m

```bash
# [31m[0mIMPORTANTE: Execute todos os comandos na raiz do projeto (BloodLink/)[0m

# [36m[0m1. Parar containers existentes (se houver)[0m
docker compose down 2>/dev/null || true

# [36m[0m2. Remover volumes antigos (opcional, para comear do zero)[0m
docker volume prune -f

# [36m[0m3. Build e Start dos containers[0m
docker compose build --no-cache
docker compose up -d

# [36m[0m4. Verificar status[0m
docker compose ps

# [36m[0m5. Ver logs em tempo real[0m
docker compose logs -f
```

**Aguarde 30-60 segundos para todos os servios inicializarem...**

### [33m[0m3. [33m[0mMETODO ALTERNATIVO: Local (sem Docker)[0m

```bash
# [36m[0m1. Instalar dependncias de todos os mdulos[0m
cd BloodLink

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# Blockchain
cd blockchain && npm install && cd ..

# [36m[0m2. Iniciar PostgreSQL (se no tiver Docker)[0m
# Opo A: PostgreSQL local
# Instale o PostgreSQL em seu sistema e crie o banco:
# createdb hospitalchain

# Opo B: PostgreSQL via Docker (apenas o banco)
docker run -d --name hospitalchain-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=hospitalchain \
  -p 5432:5432 \
  postgres:15-alpine

# [36m[0m3. Configurar banco de dados (Backend)[0m
cd backend
npx prisma generate
npx prisma migrate dev --name init
cd ..

# [36m[0m4. Iniciar Blockchain (Hardhat)[0m
cd blockchain
npx hardhat node --host 0.0.0.0 &
cd ..

# [36m[0m5. Deploy do Contrato Inteligente[0m
cd blockchain
npx hardhat compile
npm run deploy
cd ..

# [33m[0mIMPORTANTE: Copie o endereo do contrato exibido e atualize em backend/.env[0m
# Exemplo: BLOOD_BAG_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# [36m[0m6. Iniciar Backend[0m
cd backend
npm run dev &
cd ..

# [36m[0m7. Iniciar Frontend[0m
cd frontend
npm run dev
```

---

## [32m[0m[1m[0mVERIFICAR INSTALA[32m[0m[1m[0m[32m[0m

### [33m[0mScript de Verificao Automtica[0m

```bash
# Executar script de verificao
chmod +x scripts/verify.sh
./scripts/verify.sh
```

### [33m[0mVerificar Manualmente[0m

```bash
# Backend Health Check
curl http://localhost:4000/health
# Deve retornar: {"status":"healthy",...}

# PostgreSQL
curl -I http://localhost:5432 2>&1 | head -1
# Deve conter: HTTP/1.1 200 OK (ou similar)

# Blockchain (Hardhat)
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
# Deve retornar um nmero de bloco

# Frontend
curl -I http://localhost:3000
# Deve retornar: HTTP/1.1 200 OK
```

---

## [32m[0m[1m[0mACESSAR A APLICA[32m[0m[1m[0m[32m[0m

| Servio | URL | Status |
|----------|-----|--------|
| **Frontend** | http://localhost:3000 | [32m[0mOnline[0m |
| **Backend API** | http://localhost:4000 | [32m[0mOnline[0m |
| **Health Check** | http://localhost:4000/health | [32m[0mOnline[0m |
| **Blockchain** | http://localhost:8545 | [32m[0mOnline[0m |

---

## [36m[0m[1m[0mSCRIPTS [31m[0m[1m[0mUTILITARIOS[0m

| Script | Descrio | Uso |
|--------|-------------|-----|
| `init.sh` | Inicializao completa do sistema | `./scripts/init.sh` |
| `dev.sh` | Inicia ambiente de desenvolvimento | `./scripts/dev.sh` |
| `stop.sh` | Para todos os servios | `./scripts/stop.sh` |
| `verify.sh` | Verifica conexes entre servios | `./scripts/verify.sh` |
| `test.sh` | Executa todos os testes | `./scripts/test.sh` |
| `seed.sh` | Popula banco com dados de teste | `./scripts/seed.sh` |

```bash
# Dar permisso de execuo a todos os scripts
chmod +x scripts/*.sh

# Exemplo: Iniciar tudo automaticamente
./scripts/init.sh

# Exemplo: Parar tudo
./scripts/stop.sh
```

---

## [36m[0m[1m[0mFUNCIONALIDADES PRINCIPAIS[0m

### [34m[0m[1m[0m1. Gerenciamento de Bolsas de Sangue[0m

| Funo | Descrio |
|----------|-------------|
| Criar Bolsa | Cadastro de nova bolsa com cdigo nico |
| Coletar | Registro da coleta do doador |
| Testar | Registro de resultados de testes |
| Aprovar/Reprovar | Controle de qualidade |
| Armazenar | Registro de local e temperatura |
| Reservar | Reserva para transferncia |
| Transferir | Envio entre instituies |
| Receber | Registro de recebimento |
| Utilizar | Registro de uso em paciente |
| Descartar | Registro de descarte |
| QR Code | Gerao automtica para rastreamento |

**Status Possveis:**
`COLETADA` [37m[0m-> `EM_TESTE` [37m[0m-> `APROVADA` [37m[0m-> `ARMAZENADA` [37m[0m-> `RESERVADA` [37m[0m-> `EM_TRANSPORTE` [37m[0m-> `RECEBIDA` [37m[0m-> `DISPON[31m[0mVEL`

### [34m[0m[1m[0m2. Gerenciamento de Demandas[0m

| Funo | Descrio |
|----------|-------------|
| Criar Demanda | Solicitao de tipo sanguneo especfico |
| Buscar Fornecedores | Encontra instituies com estoque compatvel |
| Acompanhar Status | `ABERTA` [37m[0m-> `EM_ANALISE` [37m[0m-> `ATENDIDA` |
| Nveis de Urgncia | BAIXA, M[33m[0mEDIA, ALTA, EMERG[31m[0mNCIA |

### [34m[0m[1m[0m3. Transferncias entre Instituies[0m

| Funo | Descrio |
|----------|-------------|
| Solicitar | Hospital solicita bolsas |
| Oferecer | Hemocentro/Outro hospital oferece |
| Aprovar/Rejeitar | Controle da transferncia |
| Iniciar Transporte | Registro de envio |
| Receber | Confirmao de recebimento |
| Atualizar Estoque | Estoque automtico |

**Status de Transferncia:**
`PENDENTE` [37m[0m-> `APROVADA` [37m[0m-> `EM_TRANSPORTE` [37m[0m-> `ENTREGUE`

### [34m[0m[1m[0m4. Blockchain - Registro Imutvel[0m

| Funo | Descrio |
|----------|-------------|
| Registro de Eventos | Todos os eventos so registrados na blockchain |
| Verificao de Integridade | Hash SHA-256 para cada evento |
| Histrico Imutvel | No  possvel alterar registros |
| Transparncia Total | Qualquer instituio pode auditar |

**O que  armazenado na blockchain:**
- ID da bolsa
- Tipo de evento
- Timestamp
- ID da instituio
- ID do usurio
- Hash dos dados

**O que NO  armazenado:**
- Dados pessoais do doador
- Informaes mdicas sensveis
- Localizao exata

### [34m[0m[1m[0m5. Monitoramento de Temperatura[0m

| Funo | Descrio |
|----------|-------------|
| Leituras Automticas | Registro de temperatura por bolsa |
| Alertas | Notificao quando fora da faixa (1-6[33m[0mC) |
| Histrico | Grfico de temperatura ao longo do tempo |
| Simulao | Gerao de dados para teste |

### [34m[0m[1m[0m6. Dashboard e Relatrios[0m

| Visualizao | Descrio |
|------------|-------------|
| Estoque por Tipo | Grfico de barras por tipo sanguneo |
| Movimentaes | Entradas, sadas, transferncias |
| Demandas | Status de todas as demandas |
| Mapa da Rede | Visualizao geogrfica das instituies |
| Alertas de Temperatura | Lista de alertas ativos |

---

## [36m[0m[1m[0mPERFIS DE USUARIOS[0m

| Perfil | Acesso | Funcionalidades |
|--------|--------|-----------------|
| **[31m[0mADMIN[0m** | Total | Gerenciar usurios, instituies, configuraes |
| **[36m[0mHEMOCENTRO[0m** | Restrito | Coletar, testar, aprovar, transferir |
| **[32m[0mHOSPITAL[0m** | Restrito | Criar demandas, receber, utilizar |
| **[33m[0mAUDITOR[0m** | Somente Leitura | Verificar registros, auditar |

---

## [36m[0m[1m[0mAPI REST[0m

### [33m[0mEndpoints Principais[0m

| Mdulo | Base URL | Autenticao |
|---------|----------|---------------|
| Auth | `/api/auth` | [31m[0mNo[0m |
| Users | `/api/users` | [32m[0mSim[0m |
| Institutions | `/api/institutions` | [32m[0mSim[0m |
| Blood Bags | `/api/blood-bags` | [32m[0mSim[0m |
| Demands | `/api/demands` | [32m[0mSim[0m |
| Transfers | `/api/transfers` | [32m[0mSim[0m |
| Events | `/api/events` | [32m[0mSim[0m |
| Blockchain | `/api/blockchain` | [32m[0mSim[0m |
| Dashboard | `/api/dashboard` | [32m[0mSim[0m |
| Temperature | `/api/temperature` | [32m[0mSim[0m |

### [33m[0mExemplo de Autenticao[0m

```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@hospitalchain.com", "password": "admin123"}'

# Resposta
# {
#   "success": true,
#   "message": "Login realizado com sucesso.",
#   "data": {
#     "user": { ... },
#     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
#   }
# }

# Usar token em requisies subsequentes
curl -X GET http://localhost:4000/api/blood-bags \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## [36m[0m[1m[0mTESTES[0m

### [33m[0mExecutar Todos os Testes[0m

```bash
# Script completo
./scripts/test.sh

# Ou manualmente
cd backend && npm test
cd blockchain && npm test
```

### [33m[0mTestes do Backend[0m

```bash
cd backend

# Testes unitrios
npm test

# Testes especficos
npm test -- --testNamePattern="auth"
npm test -- --testNamePattern="blood-bag"
npm test -- --testNamePattern="demand"
```

### [33m[0mTestes do Blockchain[0m

```bash
cd blockchain

# Testes dos contratos
npm test

# Deploy em rede local
npm run deploy
```

---

## [31m[0m[1m[0mRESOLU[31m[0m[1m[0m[31m[0m DE PROBLEMAS[0m

### [33m[0mDocker no funciona ou containers no ficam UP[0m

```bash
# [31m[0mSOLU[31m[0m[33m[0m:[0m

# 1. Verifique se o Docker est rodando
docker ps

# 2. Verifique se no h portas em conflito
netstat -tuln | grep -E "5432|4000|3000|8545"

# 3. Tente com Docker Compose v2 (novo formato)
docker compose down
docker compose build --no-cache
docker compose up -d

# 4. Use o script de inicializao
./scripts/init.sh

# 5. Verifique logs dos containers
docker compose logs backend
docker compose logs blockchain
docker compose logs postgres
```

### [33m[0mErro: npm ci failed[0m

```bash
# O docker-compose.yml j usa npm install em vez de npm ci
# Mas se precisar executar manualmente:

# Remova package-lock.json e node_modules
rm -rf node_modules package-lock.json

# Instale com npm install
npm install
```

### [33m[0mErro: PostgreSQL connection refused[0m

```bash
# Verifique se o PostgreSQL est rodando
docker ps | grep postgres

# Se no estiver, inicie manualmente
docker compose up -d postgres

# Aguarde 10-15 segundos e tente novamente
sleep 15

# Verifique conexo
curl http://localhost:4000/health
```

### [33m[0mErro: Blockchain not available[0m

```bash
# Verifique se o Hardhat est rodando
docker ps | grep blockchain

# Se no estiver, inicie manualmente
cd blockchain
npx hardhat node --host 0.0.0.0

# Verifique conexo
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### [33m[0mFrontend no carrega ou mostra erro[0m

```bash
# Verifique se o Vite est rodando
docker ps | grep frontend

# Verifique logs
docker compose logs frontend

# Tente rebuild
cd frontend
npm install
npm run dev
```

---

## [36m[0m[1m[0mDOCUMENTA[36m[0m[1m[0m[36m[0m

| Documento | Descrio |
|-----------|-------------|
| [[34m[0mSETUP.md[0m](docs/SETUP.md) | Guia de configurao detalhado |
| [[34m[0mARCHITECTURE.md[0m](docs/ARCHITECTURE.md) | Arquitetura do sistema |
| [[34m[0mAPI.md[0m](docs/API.md) | Documentao da API REST |
| [[34m[0mBLOCKCHAIN.md[0m](docs/BLOCKCHAIN.md) | Detalhes da blockchain |
| [[34m[0mDATABASE.md[0m](docs/DATABASE.md) | Esquema do banco de dados |

---

## [36m[0m[1m[0mTECNOLOGIAS[0m

### [34m[0mFrontend[0m
- **React** 18.2.x - Biblioteca principal
- **Vite** 5.x - Build tool
- **TypeScript** 5.x - Tipagem esttica
- **Tailwind CSS** 3.x - Estilizao
- **React Router** 6.x - Roteamento
- **Axios** - Client HTTP
- **Recharts** - Grficos
- **qrcode.react** - Gerao de QR Codes
- **React Query** - Gerenciamento de estado

### [32m[0mBackend[0m
- **Node.js** 20.x - Runtime
- **Express** 4.x - Framework web
- **TypeScript** 5.x - Tipagem esttica
- **Prisma** 5.x - ORM
- **JWT** - Autenticao
- **bcrypt** - Hash de senhas
- **Zod** - Validao de schemas
- **Helmet** - Segurana
- **CORS** - Controle de acesso
- **Morgan** - Logging

### [35m[0mBanco de Dados[0m
- **PostgreSQL** 15.x - Banco relacional

### [36m[0mBlockchain[0m
- **Hardhat** - Framework de desenvolvimento
- **Solidity** 0.8.20 - Linguagem de contratos
- **Ethers.js** - Interao com blockchain
- **@nomicfoundation/hardhat-toolbox** - Plugins

---

## [31m[0m[1m[0mAVISO IMPORTANTE[0m

```
[41m[37m[1m[0m                                                                 [0m
[41m[37m[1m [0m  [31m[1mPROT[37m[1m[31mOTIPO ACAD[37m[1m[31mEMICO[37m[1m [0m  [41m[37m[1m [0m
[41m[37m[1m [0m                                                                 [0m
[41m[37m[1m  Este sistema [31m[1mN[37m[1mAO [31m[1mdeve ser utilizado em ambiente de produo[37m[1m [0m  [41m[37m[1m [0m
[41m[37m[1m  m[37m[1m[31mEDICO[37m[1m [31mSEM[37m[1m as devidas certificaes e adaptaes.[37m[1m [0m  [41m[37m[1m [0m
[41m[37m[1m                                                                 [0m
[0m
```

---

## [36m[0m[1m[0mCONTRIBUI[36m[0m[1m[0m[36m[0m

Contribuies so bem-vindas! Por favor:

1. [32m[0mFork[0m o repositrio
2. [32m[0mCrie uma branch[0m (`git checkout -b feature/nova-feature`)
3. [32m[0mCommit suas mudanas[0m (`git commit -m 'Adiciona nova feature'`)
4. [32m[0mPush para a branch[0m (`git push origin feature/nova-feature`)
5. [32m[0mAbra um Pull Request[0m

---

## [36m[0m[1m[0mLICENA[0m

MIT License - Veja [LICENSE](LICENSE) para detalhes.

---

<p align="center">
  <a href="https://github.com/lucasscantu/BloodLink">
    <img src="https://img.shields.io/github/stars/lucasscantu/BloodLink?style=social" alt="GitHub Stars">
  </a>
  <a href="https://github.com/lucasscantu/BloodLink/forks">
    <img src="https://img.shields.io/github/forks/lucasscantu/BloodLink?style=social" alt="GitHub Forks">
  </a>
</p>

<p align="center">
  Feito com [31m[0m[31m[0m[31m[0m[31m[0m[31m[0m[31m[0m[31m
</p>
