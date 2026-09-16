# HospitalChain - Arquitetura do Sistema

## 📋 Visão Geral

O HospitalChain é um sistema distribuído para rastreabilidade, gerenciamento e redistribuição de bolsas de sangue entre hospitais e hemocentros, utilizando blockchain para garantir a imutabilidade dos registros.

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                         Navegador Web                               │
│                    (Usuário Final)                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React + Vite)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │   Páginas    │  │  Componentes  │  │    Serviços API           │ │
│  │   (Pages)    │  │   (UI)       │  │    (Axios)               │ │
│  └──────────────┘  └──────────────┘  └─────────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │   Contextos  │  │    Hooks     │  │    Utilitários           │ │
│  │   (State)   │  │  (Custom)     │  │    (Helpers)             │ │
│  └──────────────┘  └──────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP/REST (Porta 3000)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Node.js + Express)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │   Rotas      │  │ Controladores│  │    Serviços de Negócio  │ │
│  │   (Routes)   │  │  (Controllers)│  │    (Services)            │ │
│  └──────────────┘  └──────────────┘  └─────────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ Middlewares  │  │   Utilit.    │  │    Blockchain Service     │ │
│  │  (Auth, etc) │  │  (Hash, etc) │  │    (Ethers.js)            │ │
│  └──────────────┘  └──────────────┘  └─────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                        Prisma ORM                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐│ │
│  │  │   Models     │  │  Migrations   │  │    Schema               ││ │
│  │  └──────────────┘  └──────────────┘  └────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │ PostgreSQL (Porta 5432)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │   Tabelas    │  │   Índices     │  │    Relacionamentos        │ │
│  │   (Tables)   │  │  (Indexes)     │  │    (Relationships)         │ │
│  └──────────────┘  └──────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (Hashes + Eventos)
┌─────────────────────────────────────────────────────────────────┐
│                    Blockchain (Hardhat + Solidity)                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    BloodBagRegistry Contract                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │ │
│  │  │  Funções     │  │   Structs    │  │    Events            │  │ │
│  │  │  (Functions) │  │   (Data)     │  │    (Logs)             │  │ │
│  │  └──────────────┘  └──────────────┘  └────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Hardhat Local Node                            │ │
│  │  (Ethereum-like network on port 8545)                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Componentes do Sistema

### 1. Frontend

**Tecnologias:**
- **React 18**: Biblioteca para construção de interfaces
- **Vite**: Bundler rápido para desenvolvimento
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Framework de estilos
- **React Router**: Roteamento
- **Axios**: Client HTTP
- **Recharts**: Gráficos e visualizações
- **qrcode.react**: Geração de QR Codes

**Estrutura:**
```
frontend/
├── public/              # Arquivos estáticos
├── src/
│   ├── assets/          # Imagens, ícones, fontes
│   ├── components/      # Componentes React reutilizáveis
│   │   ├── common/      # Botões, cards, inputs, etc.
│   │   ├── layout/      # Header, Sidebar, Footer
│   │   ├── blood-bags/  # Componentes de bolsas
│   │   ├── demands/     # Componentes de demandas
│   │   └── dashboard/   # Componentes do dashboard
│   ├── context/         # Contextos React (Auth, Theme, etc.)
│   ├── hooks/           # Hooks personalizados
│   │   ├── useAuth.ts   # Autenticação
│   │   ├── useApi.ts    # Chamadas API
│   │   └── useBlockchain.ts
│   ├── pages/           # Páginas da aplicação
│   │   ├── auth/        # Login, Registro
│   │   ├── dashboard/   # Dashboard principal
│   │   ├── blood-bags/  # Listagem, detalhes, etc.
│   │   ├── demands/     # Gerenciamento de demandas
│   │   ├── transfers/   # Transferências
│   │   ├── institutions/# Instituições
│   │   ├── users/      # Usuários (ADMIN)
│   │   └── audit/      # Auditoria (AUDITOR)
│   ├── services/        # Serviços de API
│   │   ├── api.ts      # Configuração Axios
│   │   ├── auth.ts     # Serviço de autenticação
│   │   ├── bloodBags.ts # Serviço de bolsas
│   │   └── ...
│   ├── styles/          # Estilos globais e Tailwind
│   ├── types/           # Tipos TypeScript
│   ├── utils/           # Utilitários
│   ├── App.tsx          # Componente principal
│   └── main.tsx         # Ponto de entrada
├── .env                # Variáveis de ambiente
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 2. Backend

**Tecnologias:**
- **Node.js 20**: Runtime JavaScript
- **Express**: Framework web
- **TypeScript**: Tipagem estática
- **Prisma ORM**: ORM para PostgreSQL
- **JWT**: Autenticação
- **bcrypt**: Hash de senhas
- **Zod**: Validação de dados
- **Ethers.js**: Integração com blockchain

**Estrutura:**
```
backend/
├── prisma/
│   ├── schema.prisma    # Esquema do banco
│   └── migrations/      # Migrações
├── src/
│   ├── config/          # Configurações
│   │   └── index.ts     # Config centralizada
│   ├── controllers/     # Controladores de rota
│   │   ├── auth.controller.ts
│   │   ├── bloodBag.controller.ts
│   │   ├── demand.controller.ts
│   │   ├── institution.controller.ts
│   │   ├── transfer.controller.ts
│   │   ├── user.controller.ts
│   │   └── ...
│   ├── middleware/      # Middlewares
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── routes/          # Definição de rotas
│   │   ├── auth.routes.ts
│   │   ├── blood-bag.routes.ts
│   │   ├── demand.routes.ts
│   │   ├── institution.routes.ts
│   │   ├── transfer.routes.ts
│   │   ├── user.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── temperature.routes.ts
│   │   ├── blockchain.routes.ts
│   │   └── index.ts
│   ├── services/        # Serviços de negócio
│   │   ├── auth.service.ts
│   │   ├── bloodBag.service.ts
│   │   ├── demand.service.ts
│   │   ├── event.service.ts
│   │   ├── inventory.service.ts
│   │   ├── temperature.service.ts
│   │   └── transfer.service.ts
│   ├── blockchain/      # Integração blockchain
│   │   ├── BlockchainService.ts
│   │   └── index.ts
│   ├── prisma/          # Cliente Prisma
│   │   └── index.ts
│   ├── types/           # Tipos TypeScript
│   │   └── index.ts
│   ├── utils/           # Utilitários
│   │   ├── hash.utils.ts
│   │   ├── qrcode.utils.ts
│   │   └── validation.utils.ts
│   ├── app.ts           # Configuração Express
│   └── server.ts        # Servidor
├── .env.example
├── package.json
└── tsconfig.json
```

### 3. Banco de Dados (PostgreSQL)

**Modelos Principais:**

```
┌─────────────────────────────────────────────────────────────────┐
│                           USER                                     │
├─────────────────────────────────────────────────────────────────┤
│ id | email | passwordHash | firstName | lastName | role | ...   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (1:N)
┌─────────────────────────────────────────────────────────────────┐
│                      INSTITUTION                                  │
├─────────────────────────────────────────────────────────────────┤
│ id | name | type | address | city | state | lat | lng | ...    │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ BLOOD_BAG     │   │   DEMAND     │   │  INVENTORY    │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ id | code |   │   │ id | code |   │   │ id | blood |   │
│ bloodType |   │   │ bloodType |  │   │ type | qty |   │
│ factorRh |   │   │ quantity |  │   │ reserved |   │
│ status |    │   │ urgency |   │   │ available |  │
│ institutionId│   │   │ status |    │   │ institutionId│
│ ...         │   │   │ ...        │   │   │ ...        │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │
        ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                          EVENT                                     │
├─────────────────────────────────────────────────────────────────┤
│ id | bagId | type | description | institutionId | userId | hash │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       TRANSFER_REQUEST                             │
├─────────────────────────────────────────────────────────────────┤
│ id | code | fromInstitutionId | toInstitutionId | status | ...   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       TEMPERATURE_READING                          │
├─────────────────────────────────────────────────────────────────┤
│ id | bagId | institutionId | temperature | alertStatus | ...     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          AUDIT_LOG                                  │
├─────────────────────────────────────────────────────────────────┤
│ id | userId | action | entityType | entityId | oldValue | ...│
└─────────────────────────────────────────────────────────────────┘
```

### 4. Blockchain (Hardhat + Solidity)

**Contrato Principal: BloodBagRegistry.sol**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BloodBagRegistry {
    // Structs
    struct BloodBag { ... }
    struct Event { ... }
    struct Transfer { ... }
    struct Demand { ... }
    
    // Mappings
    mapping(uint256 => BloodBag) private _bloodBags;
    mapping(uint256 => Event) private _events;
    mapping(uint256 => Transfer) private _transfers;
    mapping(uint256 => Demand) private _demands;
    
    // Functions
    function registerBloodBag(...) external returns (uint256);
    function registerEvent(...) external returns (uint256);
    function registerTransfer(...) external returns (uint256);
    function registerDemand(...) external returns (uint256);
    function updateBloodBagStatus(...) external returns (bool);
    function updateTransferStatus(...) external returns (bool);
    function updateDemandStatus(...) external returns (bool);
    function verifyBloodBagHash(...) external view returns (bool);
    function getBloodBagEvents(...) external view returns (Event[] memory);
    // ... mais funções
}
```

**Estrutura:**
```
blockchain/
├── contracts/           # Contratos Solidity
│   └── BloodBagRegistry.sol
├── scripts/             # Scripts de deploy
│   └── deploy.ts
├── test/                # Testes
│   └── BloodBagRegistry.test.ts
├── artifacts/           # Artefatos compilados (gerado)
├── hardhat.config.ts
└── package.json
```

## 🔄 Fluxo de Dados

### 1. Registro de uma Bolsa de Sangue

```
1. Usuário (HEMOCENTRO) preenche formulário no Frontend
   ↓
2. Frontend envia dados para Backend (POST /api/blood-bags)
   ↓
3. Backend valida dados com Zod
   ↓
4. Backend cria registro no PostgreSQL
   ↓
5. Backend gera hash da bolsa (SHA-256)
   ↓
6. Backend registra bolsa na Blockchain via BloodBagRegistry
   ↓
7. Blockchain retorna transaction hash
   ↓
8. Backend atualiza registro com blockchainTxId
   ↓
9. Backend gera QR Code
   ↓
10. Backend retorna dados completos para Frontend
   ↓
11. Frontend exibe confirmação e QR Code
```

### 2. Transferência de uma Bolsa

```
1. Hospital cria demanda (POST /api/demands)
   ↓
2. Sistema busca instituições com estoque compatível
   ↓
3. Hemocentro ofertar bolsas (POST /api/transfers)
   ↓
4. Hospital aceita oferta (POST /api/transfers/:id/approve)
   ↓
5. Backend atualiza status para APROVADA
   ↓
6. Backend registra evento na Blockchain
   ↓
7. Bolsas são reservadas no inventário
   ↓
8. Transporte é iniciado (POST /api/transfers/:id/start-transport)
   ↓
9. Backend registra evento TRANSPORTE na Blockchain
   ↓
10. Hospital recebe bolsas (POST /api/transfers/:id/receive)
    ↓
11. Backend atualiza status para RECEBIDA
    ↓
12. Backend registra evento RECEBIMENTO na Blockchain
    ↓
13. Inventário é atualizado
```

### 3. Verificação de Integridade

```
1. Usuário/Auditor acessa página da bolsa
   ↓
2. Frontend solicita dados (GET /api/blood-bags/:id)
   ↓
3. Backend retorna dados da bolsa
   ↓
4. Frontend solicita verificação (GET /api/blood-bags/:id/verify)
   ↓
5. Backend:
   a. Calcula hash atual dos dados
   b. Consulta hash armazenado no PostgreSQL
   c. Consulta hash na Blockchain
   d. Compara hashes
   ↓
6. Backend retorna resultado da verificação
   ↓
7. Frontend exibe status (✓ VERIFICADO ou ⚠ DIVERGENTE)
```

## 🔐 Segurança

### 1. Autenticação
- **JWT (JSON Web Tokens)**: Tokens assinados com segredo secreto
- **Expiração**: Tokens expiram após 24 horas (configurável)
- **Refresh Tokens**: Para renovação automática

### 2. Autorização
- **RBAC (Role-Based Access Control)**:
  - **ADMIN**: Acesso total
  - **HEMOCENTRO**: Coleta, testes, aprovação, transferência
  - **HOSPITAL**: Demandas, recebimento, utilização
  - **AUDITOR**: Somente leitura, verificação

### 3. Proteção de Dados
- **Hashes SHA-256**: Para integridade dos dados
- **bcrypt**: Hash de senhas (cost factor 12)
- **Nunca armazena dados pessoais na blockchain**: Somente IDs e hashes
- **HTTPS**: Recomendado para produção

### 4. Validação
- **Zod**: Validação de entrada de dados
- **Sanitização**: Remoção de caracteres perigosos
- **SQL Injection**: Prevenção via Prisma ORM
- **XSS**: Prevenção via sanitização e CSP headers

## 🌐 Rede

### Portas
- **Frontend**: 3000
- **Backend**: 4000
- **PostgreSQL**: 5432
- **Blockchain (Hardhat)**: 8545

### CORS
- Configurado para permitir apenas origens confiáveis
- Credenciais habilitadas para cookies

### Rate Limiting (Recomendado para Produção)
- Limitar requisições por IP
- Prevenir ataques DDoS

## 💾 Armazenamento

### PostgreSQL
- **Bolsas de Sangue**: ~100.000 registros
- **Eventos**: ~1.000.000 registros
- **Transferências**: ~100.000 registros
- **Demandas**: ~50.000 registros
- **Leituras de Temperatura**: ~10.000.000 registros

### Blockchain
- **Tamanho do Bloco**: ~2MB (configurável)
- **Gas Limit**: 30.000.000 (configurável)
- **Armazenamento**: Todos os nós mantêm cópia completa

## ⚡ Performance

### Frontend
- **Bundle Size**: ~500KB (compressão Gzip)
- **First Paint**: < 2s
- **TTI (Time to Interactive)**: < 5s

### Backend
- **Resposta Média**: < 200ms
- **Throughput**: ~1000 requisições/segundo
- **Concorrência**: Node.js event loop

### Banco de Dados
- **Consultas Simples**: < 10ms
- **Consultas Complexas**: < 100ms
- **Índices**: Otimizados para buscas frequentes

### Blockchain
- **Tempo de Bloco**: 1 segundo (Hardhat local)
- **Confirmação**: ~2 segundos
- **Throughput**: ~100 transações/segundo

## 📊 Escalabilidade

### Horizontal Scaling
- **Frontend**: Múltiplas instâncias atrás de load balancer
- **Backend**: Cluster de Node.js com PM2
- **PostgreSQL**: Réplicas de leitura
- **Blockchain**: Sharding (futuro)

### Vertical Scaling
- **Frontend**: Aumentar recursos da instância
- **Backend**: Aumentar limite de memória
- **PostgreSQL**: Otimizar configurações
- **Blockchain**: Aumentar gas limit

## 🔧 Manutenção

### Monitoramento
- **Logs**: Centralizados (ELK Stack ou similar)
- **Métricas**: Prometheus + Grafana
- **Alertas**: Notificações por email/Slack

### Backups
- **PostgreSQL**: Backups diários automáticos
- **Blockchain**: Todos os nós mantêm cópia
- **Arquivos**: Versionamento com Git

### Atualizações
- **Frontend**: Deploy contínuo
- **Backend**: Zero downtime deployment
- **Blockchain**: Novos contratos com migração de dados

## 🎯 Decisões Arquiteturais

### 1. Por que PostgreSQL?
- **Relacional**: Dados estruturados com relacionamentos
- **ACID**: Transações confiáveis
- **Performance**: Índices e queries otimizadas
- **JSON Support**: Campos JSON para dados flexíveis

### 2. Por que Hardhat + Solidity?
- **EVM Compatível**: Fácil de testar e deployar
- **Hardhat**: Ferramentas de desenvolvimento completas
- **Local Testing**: Rede local para desenvolvimento
- **Flexível**: Pode ser substituído por Hyperledger Fabric

### 3. Por que React + Vite?
- **Modern**: Stack atualizada
- **Fast**: Vite proporciona HMR instantâneo
- **Ecosystem**: Grande comunidade e suporte
- **TypeScript**: Tipagem estática para qualidade

### 4. Por que Prisma ORM?
- **Type-Safe**: Tipagem automatica do banco
- **Migrations**: Controle de versão do esquema
- **Easy to Use**: Sintaxe intuitiva
- **Performance**: Queries otimizadas

### 5. Por que Blockchain?
- **Imutabilidade**: Registros não podem ser alterados
- **Transparência**: Todos os participantes veem os mesmos dados
- **Auditoria**: Histórico completo e verificável
- **Confiança**: Sem necessidade de entidade central

## 🚀 Roadmap de Evolução

### Curto Prazo (1-3 meses)
- [ ] Implementar todos os endpoints da API
- [ ] Criar interface frontend completa
- [ ] Testes automatizados
- [ ] Documentação completa

### Médio Prazo (3-6 meses)
- [ ] Implementar Hyperledger Fabric
- [ ] Adicionar notificações em tempo real (WebSockets)
- [ ] Integração com sistemas externos
- [ ] Aplicativo móvel

### Longo Prazo (6-12 meses)
- [ ] Machine Learning para previsão de demanda
- [ ] IoT integration para monitoramento de temperatura
- [ ] Multi-chain support
- [ ] Federated identity management
