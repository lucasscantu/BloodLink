# HospitalChain - Setup Guide

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter os seguintes requisitos instalados:

- **Node.js** 20.x ou superior
- **npm** 9.x ou superior
- **Docker** (opcional, para execução com containers)
- **PostgreSQL** 15.x ou superior
- **Git**

## 🚀 Instalação Rápida

### 1. Clonar o Repositório

```bash
git clone <repository-url>
cd hospitalchain
```

### 2. Instalar Dependências

#### Frontend

```bash
cd frontend
npm install
cd ..
```

#### Backend

```bash
cd backend
npm install
cd ..
```

#### Blockchain

```bash
cd blockchain
npm install
cd ..
```

### 3. Configurar Banco de Dados

#### Opção A: Usar PostgreSQL Local

1. Instale o PostgreSQL em seu sistema
2. Crie um banco de dados:
   ```bash
   createdb hospitalchain
   ```
3. Crie um usuário:
   ```bash
   createuser -P postgres
   ```

#### Opção B: Usar Docker (Recomendado)

```bash
docker-compose up -d postgres
```

### 4. Configurar Variáveis de Ambiente

#### Backend

Crie um arquivo `.env` no diretório `backend/` com base no `.env.example`:

```bash
cp backend/.env.example backend/.env
```

Edite o arquivo com suas configurações:

```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hospitalchain?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
BLOCKCHAIN_URL=http://localhost:8545
BLOCKCHAIN_CHAIN_ID=1337
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
BLOOD_BAG_CONTRACT_ADDRESS=
TEMP_MIN=2
TEMP_MAX=6
FRONTEND_URL=http://localhost:3000
```

#### Frontend

Crie um arquivo `.env` no diretório `frontend/`:

```bash
cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:4000
VITE_BLOCKCHAIN_URL=http://localhost:8545
EOF
```

### 5. Configurar Banco de Dados

No diretório `backend/`, execute:

```bash
npx prisma migrate dev --name init
```

Isso criará as tabelas no banco de dados.

### 6. Iniciar a Blockchain Local

No diretório `blockchain/`, execute:

```bash
npx hardhat node
```

Isso iniciará uma rede Ethereum local na porta 8545.

### 7. Deploy do Contrato Inteligente

Em um novo terminal, no diretório `blockchain/`, execute:

```bash
npx hardhat compile
npm run deploy
```

Copie o endereço do contrato gerado e atualize o `.env` do backend:

```env
BLOOD_BAG_CONTRACT_ADDRESS=0x... (endereço do contrato)
```

### 8. Iniciar os Serviços

#### Opção A: Sem Docker

Abra três terminais:

1. **Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Blockchain** (se não estiver rodando):
   ```bash
   cd blockchain
   npx hardhat node
   ```

#### Opção B: Com Docker

```bash
docker-compose up -d
```

### 9. Acessar a Aplicação

Abra seu navegador e acesse:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Blockchain**: http://localhost:8545

## 🧪 Testes

### Testes do Backend

```bash
cd backend
npm test
```

### Testes da Blockchain

```bash
cd blockchain
npm test
```

## 📊 Dados de Demonstração

Para popular o sistema com dados de demonstração, execute:

```bash
cd backend
npx tsx scripts/seed.ts
```

## 🔧 Solução de Problemas

### Problema: Conexão com o Banco de Dados

Verifique se o PostgreSQL está em execução e se as credenciais estão corretas no `.env`.

### Problema: Conexão com a Blockchain

Verifique se o Hardhat node está em execução e se o endereço do contrato está configurado.

### Problema: Erro de CORS

Verifique se a variável `FRONTEND_URL` no `.env` do backend está correta.

### Problema: Portas em Uso

Se as portas 3000, 4000 ou 8545 já estiverem em uso, altere-as nos arquivos `.env` correspondentes.

## 📚 Estrutura do Projeto

Consulte o [README principal](../README.md) para mais informações sobre a estrutura do projeto.

## 🔒 Segurança

- Nunca use as chaves privadas e segredos de desenvolvimento em produção
- Mantenha os arquivos `.env` fora do controle de versão
- Use HTTPS em ambiente de produção
- Configure firewalls e restrições de acesso adequadas

## 🎓 Ambiente de Produção

Para um ambiente de produção, recomenda-se:

1. Usar um banco de dados PostgreSQL gerenciado
2. Usar um serviço de blockchain como Infura ou Alchemy
3. Configurar variáveis de ambiente de produção
4. Usar HTTPS com certificados válidos
5. Implementar balanceamento de carga
6. Configurar monitoramento e logs
7. Implementar backups regulares
