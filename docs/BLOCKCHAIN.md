# HospitalChain - Blockchain Documentation

## 📋 Visão Geral

A blockchain do HospitalChain é implementada utilizando **Hardhat** com **Solidity** para criar uma rede Ethereum local que registra de forma imutável todos os eventos importantes relacionados ao gerenciamento de bolsas de sangue.

## 🏗️ Arquitetura Blockchain

```
┌─────────────────────────────────────────────────────────────────┐
│                    Aplicação (Frontend/Backend)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/Web3 (Porta 8545)
┌─────────────────────────────────────────────────────────────────┐
│                    Hardhat Local Node                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    JSON-RPC API                               │ │
│  │  eth_sendTransaction, eth_call, eth_getBlockByNumber, ...      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    EVM (Ethereum Virtual Machine)               │ │
│  │  Executa bytecode dos contratos inteligentes                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BloodBagRegistry Contract                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Storage (Armazenamento)                      │ │
│  │  _bloodBags: mapping(uint256 => BloodBag)                      │ │
│  │  _events: mapping(uint256 => Event)                           │ │
│  │  _transfers: mapping(uint256 => Transfer)                     │ │
│  │  _demands: mapping(uint256 => Demand)                         │ │
│  │  _bagIdToIndex: mapping(string => uint256)                    │ │
│  │  _bagEventIndices: mapping(uint256 => uint256[])               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Functions (Funções)                         │ │
│  │  registerBloodBag(), registerEvent(), registerTransfer(),    │ │
│  │  registerDemand(), updateBloodBagStatus(), updateTransfer(),   │ │
│  │  updateDemandStatus(), verifyBloodBagHash(), getBloodBag(),     │ │
│  │  getBloodBagEvents(), getTotalBloodBags(), ...                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Events (Eventos Emitidos)                     │ │
│  │  BloodBagRegistered, EventRegistered, TransferRegistered,    │ │
│  │  DemandRegistered                                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Blockchain Data (Dados na Blockchain)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Blood Bag 1  │  │ Blood Bag 2  │  │ Blood Bag 3  │              │
│  │ ID: uuid-1   │  │ ID: uuid-2   │  │ ID: uuid-3   │              │
│  │ Type: O+     │  │ Type: A+     │  │ Type: B-     │              │
│  │ Hash: 0x...  │  │ Hash: 0x...  │  │ Hash: 0x...  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Event 1     │  │ Event 2     │  │ Event 3     │              │
│  │ Bag: uuid-1 │  │ Bag: uuid-1 │  │ Bag: uuid-2 │              │
│  │ Type: COLETA│  │ Type: TESTE │  │ Type: COLETA│              │
│  │ Hash: 0x...  │  │ Hash: 0x...  │  │ Hash: 0x...  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Contrato Inteligente

### BloodBagRegistry.sol

O contrato principal do HospitalChain é o `BloodBagRegistry`, que implementa todas as funcionalidades necessárias para o registro e rastreamento de bolsas de sangue.

#### Structs

```solidity
struct BloodBag {
    string bagId;              // ID único da bolsa
    string bloodType;          // Tipo sanguíneo (A+, A-, B+, B-, AB+, AB-, O+, O-)
    bool factorRh;             // Fator Rh (true = positivo, false = negativo)
    uint256 collectionDate;    // Data de coleta (timestamp Unix)
    uint256 expirationDate;    // Data de validade (timestamp Unix)
    string currentInstitutionId; // ID da instituição atual
    string status;             // Status da bolsa
    string hash;               // Hash SHA-256 dos dados
    uint256 createdAt;         // Timestamp de criação
}

struct Event {
    uint256 eventId;           // ID único do evento
    string bagId;              // ID da bolsa associada
    string eventType;          // Tipo do evento (COLETA, TESTE, APROVACAO, etc.)
    string description;        // Descrição do evento
    string institutionId;      // ID da instituição onde ocorreu
    string userId;             // ID do usuário responsável
    string hash;               // Hash SHA-256 do evento
    uint256 timestamp;         // Timestamp do evento
    string transactionId;      // ID da transação (composto)
}

struct Transfer {
    uint256 transferId;         // ID único da transferência
    string bagId;              // ID da bolsa
    string fromInstitutionId;  // ID da instituição de origem
    string toInstitutionId;    // ID da instituição de destino
    string status;             // Status da transferência
    uint256 requestedAt;       // Timestamp da solicitação
    uint256 approvedAt;        // Timestamp da aprovação
    uint256 completedAt;       // Timestamp da conclusão
    string hash;               // Hash SHA-256 dos dados
}

struct Demand {
    uint256 demandId;           // ID único da demanda
    string institutionId;      // ID da instituição solicitante
    string bloodType;          // Tipo sanguíneo solicitado
    uint256 quantity;          // Quantidade solicitada
    string urgency;            // Urgência (BAIXA, MEDIA, ALTA, EMERGENCIA)
    string status;             // Status da demanda
    uint256 createdAt;         // Timestamp da criação
    uint256 closedAt;          // Timestamp do fechamento
    string hash;               // Hash SHA-256 dos dados
}
```

#### Funções Principais

##### Registro de Bolsas

```solidity
function registerBloodBag(
    string memory bagId,
    string memory bloodType,
    bool factorRh,
    uint256 collectionDate,
    uint256 expirationDate,
    string memory currentInstitutionId,
    string memory status,
    string memory hash
) external returns (uint256)
```

**Parâmetros:**
- `bagId`: Identificador único da bolsa de sangue
- `bloodType`: Tipo sanguíneo (ex: "O+", "A-", etc.)
- `factorRh`: Fator Rh (true = positivo, false = negativo)
- `collectionDate`: Data de coleta em timestamp Unix
- `expirationDate`: Data de validade em timestamp Unix
- `currentInstitutionId`: ID da instituição que possui a bolsa
- `status`: Status inicial da bolsa (ex: "COLETADA")
- `hash`: Hash SHA-256 dos dados da bolsa

**Retorno:**
- `uint256`: Índice da bolsa no contrato

**Evento Emitido:**
```solidity
BloodBagRegistered(bagIndex, bagId, bloodType, currentInstitutionId, timestamp)
```

##### Registro de Eventos

```solidity
function registerEvent(
    string memory bagId,
    string memory eventType,
    string memory description,
    string memory institutionId,
    string memory userId,
    string memory hash
) external returns (uint256)
```

**Parâmetros:**
- `bagId`: ID da bolsa associada ao evento
- `eventType`: Tipo do evento (COLETA, TESTE, APROVACAO, REPROVACAO, etc.)
- `description`: Descrição detalhada do evento
- `institutionId`: ID da instituição onde o evento ocorreu
- `userId`: ID do usuário que realizou a ação
- `hash`: Hash SHA-256 dos dados do evento

**Retorno:**
- `uint256`: ID do evento criado

**Evento Emitido:**
```solidity
EventRegistered(eventId, bagId, eventType, institutionId, timestamp)
```

##### Registro de Transferências

```solidity
function registerTransfer(
    string memory bagId,
    string memory fromInstitutionId,
    string memory toInstitutionId,
    string memory status,
    string memory hash
) external returns (uint256)
```

**Parâmetros:**
- `bagId`: ID da bolsa sendo transferida
- `fromInstitutionId`: ID da instituição de origem
- `toInstitutionId`: ID da instituição de destino
- `status`: Status inicial da transferência (ex: "SOLICITADA")
- `hash`: Hash SHA-256 dos dados da transferência

**Retorno:**
- `uint256`: ID da transferência criada

**Evento Emitido:**
```solidity
TransferRegistered(transferId, bagId, fromInstitutionId, toInstitutionId, status, timestamp)
```

##### Registro de Demandas

```solidity
function registerDemand(
    string memory institutionId,
    string memory bloodType,
    uint256 quantity,
    string memory urgency,
    string memory status,
    string memory hash
) external returns (uint256)
```

**Parâmetros:**
- `institutionId`: ID da instituição que criou a demanda
- `bloodType`: Tipo sanguíneo solicitado
- `quantity`: Quantidade de bolsas solicitadas
- `urgency`: Nível de urgência (BAIXA, MEDIA, ALTA, EMERGENCIA)
- `status`: Status inicial da demanda (ex: "ABERTA")
- `hash`: Hash SHA-256 dos dados da demanda

**Retorno:**
- `uint256`: ID da demanda criada

**Evento Emitido:**
```solidity
DemandRegistered(demandId, institutionId, bloodType, quantity, urgency, timestamp)
```

##### Atualização de Status

```solidity
function updateBloodBagStatus(
    string memory bagId,
    string memory newStatus,
    string memory hash
) external returns (bool)

function updateTransferStatus(
    uint256 transferId,
    string memory newStatus,
    string memory hash
) external returns (bool)

function updateDemandStatus(
    uint256 demandId,
    string memory newStatus,
    string memory hash
) external returns (bool)
```

##### Verificação de Hash

```solidity
function verifyBloodBagHash(
    string memory bagId,
    string memory hash
) external view returns (bool)

function verifyEventHash(
    uint256 eventId,
    string memory hash
) external view returns (bool)
```

##### Funções de Consulta

```solidity
function getBloodBag(uint256 bagIndex) external view returns (BloodBag memory)
function getBloodBagById(string memory bagId) external view returns (BloodBag memory, bool)
function getEvent(uint256 eventId) external view returns (Event memory)
function getBloodBagEvents(string memory bagId) external view returns (Event[] memory)
function getTransfer(uint256 transferId) external view returns (Transfer memory)
function getDemand(uint256 demandId) external view returns (Demand memory)

function getTotalBloodBags() external view returns (uint256)
function getTotalEvents() external view returns (uint256)
function getTotalTransfers() external view returns (uint256)
function getTotalDemands() external view returns (uint256)
```

## 🔧 Configuração

### hardhat.config.ts

```typescript
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@typechain/hardhat';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true,
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk',
      },
      mining: {
        auto: true,
        interval: 1000,
      },
    },
    localhost: {
      url: 'http://localhost:8545',
      chainId: 1337,
      accounts: [
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      ],
    },
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6',
  },
};

export default config;
```

### package.json

```json
{
  "name": "hospitalchain-blockchain",
  "version": "1.0.0",
  "scripts": {
    "compile": "hardhat compile",
    "deploy": "tsx scripts/deploy.ts",
    "test": "hardhat test",
    "node": "hardhat node",
    "clean": "hardhat clean"
  },
  "dependencies": {
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "@openzeppelin/contracts": "^5.0.1",
    "ethers": "^6.11.1",
    "hardhat": "^2.19.4"
  }
}
```

## 🚀 Deploy

### 1. Compilar os Contratos

```bash
npx hardhat compile
```

Este comando:
- Compila todos os contratos Solidity
- Gera os artefatos na pasta `artifacts/`
- Gera os tipos TypeScript na pasta `typechain-types/`

### 2. Iniciar a Rede Local

```bash
npx hardhat node
```

Este comando:
- Inicia um nó Ethereum local
- Cria 20 contas pré-financiadas
- Escuta na porta 8545
- Habilita mineração automática

### 3. Deploy do Contrato

```bash
npm run deploy
```

Ou manualmente:

```bash
npx tsx scripts/deploy.ts
```

Este script:
- Conecta ao nó local
- Deploya o contrato BloodBagRegistry
- Salva o endereço do contrato em `deploy/BloodBagRegistry.json`
- Exibe informações do deploy

### 4. Verificar Deploy

Após o deploy, você pode verificar o contrato:

```bash
npx hardhat console
```

No console:

```javascript
const BloodBagRegistry = await ethers.getContractFactory('BloodBagRegistry');
const contract = BloodBagRegistry.attach('0x...'); // Use o endereço do deploy

// Verificar total de bolsas
const total = await contract.getTotalBloodBags();
console.log('Total de bolsas:', total.toNumber());
```

## 🧪 Testes

### Executar Testes

```bash
npm test
```

Ou:

```bash
npx hardhat test
```

### Exemplo de Teste

```typescript
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BloodBagRegistry } from '../typechain-types';

describe('BloodBagRegistry', function () {
  let bloodBagRegistry: BloodBagRegistry;
  let owner: any;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const BloodBagRegistryFactory = await ethers.getContractFactory('BloodBagRegistry');
    bloodBagRegistry = (await BloodBagRegistryFactory.deploy()) as BloodBagRegistry;
  });

  it('Should register a blood bag', async function () {
    const tx = await bloodBagRegistry.registerBloodBag(
      'O+-2024-001',
      'O+',
      true,
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000) + 86400 * 42,
      'hemocentro-001',
      'COLETADA',
      ethers.keccak256(ethers.toUtf8Bytes('test-hash'))
    );

    await expect(tx).to.emit(bloodBagRegistry, 'BloodBagRegistered');
    
    const total = await bloodBagRegistry.getTotalBloodBags();
    expect(total).to.equal(1);
  });
});
```

## 🔗 Integração com Backend

### BlockchainService

O backend se conecta à blockchain através da classe `HardhatBlockchainService`:

```typescript
import { ethers } from 'ethers';
import { config } from '../config';

export class HardhatBlockchainService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.blockchain.url);
    this.signer = new ethers.Wallet(config.blockchain.privateKey, this.provider);
    this.contract = new ethers.Contract(
      config.blockchain.contractAddress,
      BloodBagRegistryArtifact.abi,
      this.signer
    );
  }

  async registerBloodBag(bag: BloodBag): Promise<string> {
    const tx = await this.contract.registerBloodBag(
      bag.id,
      bag.bloodType,
      bag.factorRh,
      Math.floor(new Date(bag.collectionDate).getTime() / 1000),
      Math.floor(new Date(bag.expirationDate).getTime() / 1000),
      bag.currentInstitutionId,
      bag.status,
      bag.hash
    );
    
    const receipt = await tx.wait();
    return receipt.hash;
  }
}
```

### Fluxo de Integração

1. **Backend recebe requisição** (ex: POST /api/blood-bags)
2. **Valida dados** com Zod
3. **Cria registro no PostgreSQL**
4. **Gera hash SHA-256** dos dados
5. **Chama BlockchainService.registerBloodBag()**
6. **BlockchainService envia transação** para o contrato
7. **Aguarda confirmação** da transação
8. **Atualiza PostgreSQL** com blockchainTxId
9. **Retorna resposta** para o frontend

## 📊 Dados Armazenados na Blockchain

### O que é armazenado:
- ✅ IDs das bolsas de sangue
- ✅ IDs das instituições
- ✅ IDs dos usuários
- ✅ Tipos de eventos
- ✅ Timestamps
- ✅ Hashes dos dados
- ✅ Status das entidades
- ✅ IDs das transações

### O que NÃO é armazenado:
- ❌ Nomes completos de doadores
- ❌ Endereços de doadores
- ❌ CPF/RG de doadores
- ❌ Informações médicas confidenciais
- ❌ Senhas de usuários
- ❌ Dados pessoais sensíveis

## 🔐 Segurança

### 1. Hashes
- Todos os dados são hashados com **SHA-256** antes de serem armazenados
- Os hashes permitem verificar a integridade dos dados sem armazenar os dados propriamente ditos
- Exemplo: `keccak256(abi.encodePacked(bagId, bloodType, timestamp))`

### 2. Assinaturas
- Todas as transações são assinadas com a chave privada do usuário
- Somente usuários autorizados podem registrar eventos
- O contrato verifica o remetente da transação

### 3. Imutabilidade
- Uma vez registrados, os dados não podem ser alterados
- Novos eventos podem ser adicionados, mas eventos existentes são permanentes
- O histórico completo está sempre disponível

### 4. Verificação
- Qualquer pessoa pode verificar a integridade dos dados
- Comparando hashes armazenados com hashes calculados
- Usando a função `verifyBloodBagHash()` ou `verifyEventHash()`

## 📈 Monitoramento

### Eventos do Contrato

Todos os eventos emitidos pelo contrato podem ser monitorados:

```javascript
contract.on('BloodBagRegistered', (bagIndex, bagId, bloodType, institutionId, timestamp) => {
  console.log(`Nova bolsa registrada: ${bagId} do tipo ${bloodType}`);
});

contract.on('EventRegistered', (eventId, bagId, eventType, institutionId, timestamp) => {
  console.log(`Novo evento: ${eventType} para bolsa ${bagId}`);
});

contract.on('TransferRegistered', (transferId, bagId, from, to, status, timestamp) => {
  console.log(`Nova transferência: ${bagId} de ${from} para ${to}`);
});

contract.on('DemandRegistered', (demandId, institutionId, bloodType, quantity, urgency, timestamp) => {
  console.log(`Nova demanda: ${quantity} unidades de ${bloodType} por ${institutionId}`);
});
```

### Estatísticas

O contrato fornece funções para obter estatísticas:

```javascript
const totalBags = await contract.getTotalBloodBags();
const totalEvents = await contract.getTotalEvents();
const totalTransfers = await contract.getTotalTransfers();
const totalDemands = await contract.getTotalDemands();
```

## 🔄 Migração para Hyperledger Fabric

Para migração futura para Hyperledger Fabric, a arquitetura está preparada:

### 1. Interface Abstrata

```typescript
export interface IBlockchainService {
  connect(): Promise<void>;
  isConnected(): boolean;
  
  registerBloodBag(bag: BloodBag): Promise<string>;
  registerEvent(...): Promise<string>;
  registerTransfer(...): Promise<string>;
  registerDemand(...): Promise<string>;
  
  getBloodBagEvents(bagId: string): Promise<any[]>;
  verifyBloodBagHash(bagId: string, hash: string): Promise<boolean>;
  
  getTotalBloodBags(): Promise<number>;
  getTotalEvents(): Promise<number>;
}
```

### 2. Implementação Fabric

```typescript
export class FabricBlockchainService implements IBlockchainService {
  // Implementação usando Hyperledger Fabric SDK
  // Mesma interface, implementação diferente
}
```

### 3. Configuração

Basta alterar a configuração para usar a implementação Fabric:

```typescript
// Em src/blockchain/index.ts
let blockchainService: IBlockchainService;

if (config.blockchain.type === 'hardhat') {
  blockchainService = new HardhatBlockchainService();
} else if (config.blockchain.type === 'fabric') {
  blockchainService = new FabricBlockchainService();
}

export { blockchainService };
```

## 📚 Melhores Práticas

### 1. Gerenciamento de Chaves
- Nunca armazene chaves privadas no código
- Use variáveis de ambiente
- Para produção, use um HSM (Hardware Security Module) ou serviço de gerenciamento de chaves

### 2. Gas Limit
- Defina gas limit adequado para cada transação
- Monitore o consumo de gas
- Otimize contratos para reduzir consumo de gas

### 3. Testes
- Teste todas as funções do contrato
- Teste cenários de erro
- Teste com diferentes entradas
- Teste de segurança (reentrancy, overflow, etc.)

### 4. Monitoramento
- Monitore o nó blockchain
- Monitore as transações
- Monitore o consumo de gas
- Monitore erros

### 5. Backups
- Mantenha backups dos dados do contrato
- Exporte periodicamente o estado do contrato
- Armazene em local seguro

## 🚨 Solução de Problemas

### Problema: Conexão com o Nó

**Sintomas:**
- Erro de conexão ao tentar se conectar ao nó
- Timeout em requisições

**Soluções:**
1. Verifique se o nó está em execução: `npx hardhat node`
2. Verifique a URL do nó no `.env`: `BLOCKCHAIN_URL=http://localhost:8545`
3. Verifique se a porta está aberta
4. Teste a conexão manualmente:
   ```bash
   curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545
   ```

### Problema: Contrato não Encontrado

**Sintomas:**
- Erro ao tentar interagir com o contrato
- "Contract not deployed"

**Soluções:**
1. Verifique se o contrato foi deployado
2. Verifique o endereço do contrato no `.env`: `BLOOD_BAG_CONTRACT_ADDRESS`
3. Redeploy o contrato: `npm run deploy`
4. Verifique se o endereço está correto

### Problema: Transação Falhou

**Sintomas:**
- Transação revertida
- Erro de execução

**Soluções:**
1. Verifique os parâmetros da transação
2. Verifique o gas limit
3. Verifique o saldo da conta
4. Consulte o erro específico no receipt da transação
5. Teste a função no console do Hardhat

### Problema: Erro de Compilação

**Sintomas:**
- Erro ao compilar contratos
- Erros de sintaxe

**Soluções:**
1. Verifique a versão do Solidity
2. Verifique a sintaxe do contrato
3. Verifique as dependências no `package.json`
4. Execute `npm install` para instalar dependências
5. Consulte a documentação do Solidity

## 📖 Recursos Adicionais

- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethereum Documentation](https://ethereum.org/en/developers/docs/)

## 🎓 Conclusão

A blockchain do HospitalChain fornece:
- ✅ **Imutabilidade**: Registros não podem ser alterados
- ✅ **Transparência**: Todos os participantes veem os mesmos dados
- ✅ **Auditoria**: Histórico completo e verificável
- ✅ **Confiança**: Sem necessidade de entidade central
- ✅ **Segurança**: Hashes e assinaturas garantem integridade
- ✅ **Flexibilidade**: Pode ser substituída por outras implementações

A implementação com Hardhat + Solidity é ideal para:
- Desenvolvimento e teste local
- Demonstrações e protótipos
- Ambientes de desenvolvimento
- Aprendizagem e experimentação

Para produção, considere:
- Hyperledger Fabric para redes permissionadas
- Ethereum Mainnet para decentralização completa
- Polkadot ou Cosmos para interoperabilidade
