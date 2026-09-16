# HospitalChain

Sistema de rastreabilidade, gerenciamento e redistribuição de bolsas de sangue entre hospitais e hemocentros utilizando blockchain.

## 📋 Visão Geral

O HospitalChain é um protótipo acadêmico que permite o gerenciamento completo do ciclo de vida de bolsas de sangue em uma rede permissionada, com registro imutável de eventos na blockchain.

## 🏗️ Arquitetura

```
Frontend (React + Vite + TypeScript)
   ↓ HTTP/REST
Backend (Node.js + Express + TypeScript)
   ↓ PostgreSQL
Banco de Dados (PostgreSQL)
   ↓
Blockchain (Hardhat + Solidity)
```

## 📁 Estrutura do Projeto

```
hospitalchain/
├── frontend/                 # Aplicação web
│   ├── public/              # Arquivos estáticos
│   ├── src/
│   │   ├── assets/          # Imagens, ícones
│   │   ├── components/      # Componentes React
│   │   ├── context/         # Contextos React
│   │   ├── hooks/           # Hooks personalizados
│   │   ├── pages/           # Páginas
│   │   ├── services/        # Serviços API
│   │   ├── styles/          # Estilos
│   │   ├── types/           # Tipos TypeScript
│   │   ├── utils/           # Utilitários
│   │   ├── App.tsx          # Componente principal
│   │   └── main.tsx         # Ponto de entrada
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                  # API
│   ├── prisma/
│   │   └── schema.prisma    # Esquema do banco
│   ├── src/
│   │   ├── config/          # Configurações
│   │   ├── controllers/     # Controladores
│   │   ├── middleware/      # Middlewares
│   │   ├── prisma/          # Cliente Prisma
│   │   ├── routes/          # Rotas
│   │   ├── services/        # Serviços de negócio
│   │   ├── types/           # Tipos TypeScript
│   │   ├── utils/           # Utilitários
│   │   ├── blockchain/      # Integração blockchain
│   │   ├── app.ts           # Configuração Express
│   │   └── server.ts        # Servidor
│   ├── package.json
│   └── tsconfig.json
│
├── blockchain/               # Contratos inteligentes
│   ├── contracts/           # Contratos Solidity
│   ├── scripts/             # Scripts de deploy
│   ├── test/                # Testes
│   ├── hardhat.config.ts
│   └── package.json
│
├── docs/                    # Documentação
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── BLOCKCHAIN.md
│   └── SETUP.md
│
├── docker-compose.yml       # Orquestração
└── README.md
```

## 🛠️ Stack

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Axios
- Recharts (gráficos)
- qrcode.react (QR Codes)

### Backend
- Node.js 20
- Express
- TypeScript
- JWT (autenticação)
- bcrypt (hash de senhas)
- Zod (validação)
- Prisma ORM

### Banco de Dados
- PostgreSQL 15

### Blockchain
- Hardhat
- Solidity
- Ganache (rede local)

## 🚀 Configuração

Consulte [docs/SETUP.md](docs/SETUP.md) para instruções detalhadas.

## 📄 Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Blockchain](docs/BLOCKCHAIN.md)

## 🔐 Perfis de Usuário

- **ADMIN**: Gerenciamento completo do sistema
- **HEMOCENTRO**: Coleta, testes, aprovação e transferência de bolsas
- **HOSPITAL**: Recebimento, utilização e solicitação de bolsas
- **AUDITOR**: Consulta e verificação de registros

## 📊 Funcionalidades

- Cadastro e rastreamento de bolsas de sangue
- Gerenciamento de estoque
- Criação e atendimento de demandas
- Transferência entre instituições
- Registro imutável na blockchain
- Geração de QR Codes
- Monitoramento de temperatura
- Dashboard analítico
- Mapa da rede

## 🎓 Status

⚠️ **Protótipo Acadêmico** - Não deve ser utilizado em ambiente de produção médico.
