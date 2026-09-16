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

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 20.x ou superior
- npm 9.x ou superior
- PostgreSQL 15.x ou superior
- Docker (opcional)
- Git

### 1. Clonar o Repositório

```bash
git clone https://github.com/lucasscantu/BloodLink.git
hospitalchain
cd hospitalchain
```

### 2. Instalar Dependências

```bash
# Instalar dependências de todos os módulos
npm install -g npm

# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && npm install && cd ..

# Blockchain
cd blockchain && npm install && cd ..
```

### 3. Configurar Banco de Dados

#### Opção A: Usar Docker (Recomendado)

```bash
docker-compose up -d postgres
```

Aguarde o PostgreSQL inicializar (aproximadamente 10-15 segundos).

#### Opção B: PostgreSQL Local

1. Instale o PostgreSQL em seu sistema
2. Crie o banco de dados:
   ```bash
   createdb hospitalchain
   ```
3. Crie um usuário com senha (opcional, o padrão é `postgres:postgres`)

### 4. Configurar Variáveis de Ambiente

```bash
# Backend
cp backend/.env.example backend/.env

# Edite o arquivo backend/.env e verifique as configurações
# Para Docker, o DATABASE_URL já está configurado corretamente
nano backend/.env
```

### 5. Inicializar Banco de Dados

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
cd ..
```

### 6. Iniciar a Blockchain Local

Em um novo terminal:

```bash
cd blockchain
npx hardhat node
```

Deixe este terminal aberto. A blockchain local estará disponível em `http://localhost:8545`.

### 7. Deploy do Contrato Inteligente

Em um novo terminal:

```bash
cd blockchain
npx hardhat compile
npm run deploy
```

Copie o **endereço do contrato** exibido no terminal (ex: `0x5FbDB2315678afecb367f032d93F642f64180aa3`).

Atualize o arquivo `backend/.env`:

```bash
nano backend/.env
```

Adicione o endereço do contrato:
```env
BLOOD_BAG_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Salve o arquivo (`Ctrl+O`, `Enter`, `Ctrl+X`).

### 8. Iniciar os Serviços

#### Opção A: Manual (3 terminais)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Blockchain:** (já deve estar rodando)
```bash
cd blockchain
npx hardhat node
```

#### Opção B: Docker (Recomendado)

```bash
docker-compose up -d
```

### 9. Acessar a Aplicação

Abra seu navegador e acesse:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health
- **Blockchain Explorer**: http://localhost:8545 (apenas para rede local)

## 📊 Verificar Instalação

Para verificar se tudo está funcionando:

```bash
# Verificar backend
curl http://localhost:4000/health

# Deve retornar:
# {"status":"healthy","timestamp":"...","service":"hospitalchain-api"}
```

## 📚 Documentação

- [📋 Guia de Configuração Detalhado](docs/SETUP.md)
- [🏗️ Arquitetura do Sistema](docs/ARCHITECTURE.md)
- [📡 API REST](docs/API.md)
- [⛓️ Blockchain](docs/BLOCKCHAIN.md)

## 🏥 Perfis de Usuário

| Perfil | Descrição |
|--------|-----------|
| **ADMIN** | Gerenciamento completo do sistema, usuários e instituições |
| **HEMOCENTRO** | Coleta, testes, aprovação e transferência de bolsas |
| **HOSPITAL** | Recebimento, utilização, solicitação de bolsas e demandas |
| **AUDITOR** | Consulta e verificação de registros (somente leitura) |

## 🩸 Funcionalidades

### Bolsas de Sangue
- ✅ Cadastro e rastreamento completo
- ✅ Registro de coleta, testes e aprovação
- ✅ Gerenciamento de estoque por tipo sanguíneo
- ✅ Geração de QR Codes únicos
- ✅ Histórico completo de eventos
- ✅ Verificação de integridade na blockchain

### Demandas
- ✅ Criação de demandas por tipo sanguíneo
- ✅ Níveis de urgência (BAIXA, MÉDIA, ALTA, EMERGÊNCIA)
- ✅ Busca automática de fornecedores compatíveis
- ✅ Acompanhamento de status

### Transferências
- ✅ Solicitação de transferência entre instituições
- ✅ Aprovação/rejeição de transferências
- ✅ Acompanhamento de transporte
- ✅ Registro de recebimento

### Blockchain
- ✅ Registro imutável de todos os eventos
- ✅ Verificação de integridade via hashes
- ✅ Transparência total da rede
- ✅ Contrato inteligente BloodBagRegistry

### Dashboard
- ✅ Estatísticas em tempo real
- ✅ Gráficos de estoque por tipo sanguíneo
- ✅ Monitoramento de movimentações
- ✅ Alertas de temperatura
- ✅ Mapa da rede de instituições

### Monitoramento
- ✅ Leituras de temperatura com alertas
- ✅ Histórico de temperatura por bolsa
- ✅ Simulação de sensores

## 🌡️ Monitoramento de Temperatura

Para simular leituras de temperatura:

```bash
# Simular leituras para todas as bolsas
curl -X POST http://localhost:4000/api/temperature/simulate \
  -H "Content-Type: application/json" \
  -d '{"count": 10, "intervalMinutes": 30}'
```

## 🔧 Comandos Úteis

### Desenvolvimento

```bash
# Compilar TypeScript (backend)
cd backend && npm run build

# Compilar contratos (blockchain)
cd blockchain && npx hardhat compile

# Gerar cliente Prisma
cd backend && npx prisma generate

# Criar migração do banco
cd backend && npx prisma migrate dev --name <nome>

# Executar testes
cd backend && npm test
cd blockchain && npm test
```

### Docker

```bash
# Iniciar todos os serviços
docker-compose up -d

# Parar todos os serviços
docker-compose down

# Ver logs
docker-compose logs -f

# Rebuild de imagens
docker-compose build --no-cache
```

### Blockchain

```bash
# Iniciar nó local
npx hardhat node

# Deploy do contrato
npm run deploy

# Console interativo
npx hardhat console

# Testes
npm test
```

## 🛠 Stack

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
- Solidity 0.8.20
- Ethers.js

## 📊 Estrutura do Banco de Dados

O sistema utiliza os seguintes modelos principais:

- **User**: Usuários com roles (ADMIN, HEMOCENTRO, HOSPITAL, AUDITOR)
- **Institution**: Instituições (HEMOCENTRO, HOSPITAL) com localização
- **BloodBag**: Bolsas de sangue com status e histórico
- **Event**: Eventos registrados na blockchain
- **Demand**: Demandas de sangue por instituição
- **TransferRequest**: Transferências entre instituições
- **Inventory**: Estoque por tipo sanguíneo
- **TemperatureReading**: Leituras de temperatura
- **AuditLog**: Logs de auditoria

## 🔐 Segurança

- ✅ Autenticação JWT com expiração
- ✅ RBAC (Role-Based Access Control)
- ✅ Hashes SHA-256 para integridade
- ✅ bcrypt para hash de senhas
- ✅ Validação de entrada com Zod
- ✅ CORS configurado
- ❌ **Nunca armazena dados pessoais na blockchain**

## 📄 Licença

Este é um **protótipo acadêmico** desenvolvido para fins educacionais. Não deve ser utilizado em ambiente de produção médico sem as devidas certificações e adaptações.

## 🤝 Contribuição

Contribuições são bem-vindas! Siga os passos:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte a [documentação](docs/SETUP.md)
2. Verifique os logs dos serviços
3. Abra uma issue no repositório

---

**⚠️ Protótipo Acadêmico** - Não deve ser utilizado em ambiente de produção médico.

*Desenvolvido com ❤️ para a comunidade acadêmica.*
