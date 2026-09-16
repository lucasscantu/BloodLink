# HospitalChain API Documentation

## 📋 Visão Geral

A API do HospitalChain fornece endpoints RESTful para gerenciamento de bolsas de sangue, instituições, usuários, demandas e transferências. Todos os endpoints retornam JSON e seguem as convenções REST.

## 🏠 Base URL

```
Development: http://localhost:4000/api
Production: https://api.hospitalchain.com/api
```

## 📝 Formato das Respostas

### Resposta de Sucesso

```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso"
}
```

### Resposta de Erro

```json
{
  "success": false,
  "error": "Mensagem de erro",
  "details": [ ... ] // Opcional, para erros de validação
}
```

### Resposta Paginada

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## 🔐 Autenticação

Todas as rotas protegidas requerem um token JWT no header `Authorization`:

```
Authorization: Bearer <token>
```

### Login

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "usuario@instituição.com",
  "password": "senhaSegura123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "usuario@instituição.com",
      "firstName": "João",
      "lastName": "Silva",
      "role": "HEMOCENTRO",
      "institutionId": "uuid"
    }
  }
}
```

### Refresh Token

```
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "token": "refresh-token"
}
```

## 🏥 Instituições

### Listar Instituições

```
GET /api/institutions
```

**Query Parameters:**
- `page` (number): Página (padrão: 1)
- `limit` (number): Itens por página (padrão: 10)
- `type` (string): Filtrar por tipo (HEMOCENTRO, HOSPITAL)
- `search` (string): Buscar por nome

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Hemocentro Central",
      "type": "HEMOCENTRO",
      "address": "Rua das Flores, 123",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567",
      "phone": "(11) 1234-5678",
      "email": "contato@hemocentro.com",
      "latitude": -23.5678,
      "longitude": -46.6543,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": { ... }
}
```

### Criar Instituição (ADMIN)

```
POST /api/institutions
```

**Request Body:**
```json
{
  "name": "Hospital Geral",
  "type": "HOSPITAL",
  "address": "Av. Principal, 456",
  "city": "Rio de Janeiro",
  "state": "RJ",
  "zipCode": "20040-000",
  "phone": "(21) 9876-5432",
  "email": "contato@hospital.com",
  "latitude": -22.9068,
  "longitude": -43.1729
}
```

### Obter Instituição

```
GET /api/institutions/:id
```

### Atualizar Instituição (ADMIN)

```
PUT /api/institutions/:id
```

### Deletar Instituição (ADMIN)

```
DELETE /api/institutions/:id
```

## 👥 Usuários

### Listar Usuários (ADMIN)

```
GET /api/users
```

**Query Parameters:**
- `institutionId` (string): Filtrar por instituição
- `role` (string): Filtrar por papel

### Criar Usuário (ADMIN)

```
POST /api/users
```

**Request Body:**
```json
{
  "email": "novo.usuario@instituição.com",
  "password": "senhaSegura123",
  "firstName": "Maria",
  "lastName": "Santos",
  "role": "HOSPITAL",
  "institutionId": "uuid"
}
```

### Obter Usuário

```
GET /api/users/:id
```

### Atualizar Usuário

```
PUT /api/users/:id
```

**Request Body:**
```json
{
  "firstName": "Maria",
  "lastName": "Santos Silva"
}
```

### Deletar Usuário (ADMIN)

```
DELETE /api/users/:id
```

## 🩸 Bolsas de Sangue

### Listar Bolsas de Sangue

```
GET /api/blood-bags
```

**Query Parameters:**
- `page` (number): Página
- `limit` (number): Itens por página
- `bloodType` (string): Tipo sanguíneo (A+, A-, B+, B-, AB+, AB-, O+, O-)
- `status` (string): Status da bolsa
- `institutionId` (string): Filtrar por instituição atual
- `search` (string): Buscar por código
- `expiresAfter` (date): Filtrar por data de validade

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "O+-2024-001",
      "bloodType": "O_POSITIVE",
      "factorRh": true,
      "volume": 450,
      "collectionDate": "2024-01-01T08:00:00Z",
      "expirationDate": "2024-02-15T08:00:00Z",
      "status": "DISPONIVEL",
      "currentInstitutionId": "uuid",
      "currentInstitution": { ... },
      "collectedBy": { ... },
      "qrCode": "data:image/png;base64,...",
      "hash": "sha256-hash",
      "blockchainTxId": "0x...",
      "storageLocation": "Câmara 1",
      "temperature": 4.5,
      "createdAt": "2024-01-01T08:00:00Z"
    }
  ],
  "meta": { ... }
}
```

### Criar Bolsa de Sangue (HEMOCENTRO)

```
POST /api/blood-bags
```

**Request Body:**
```json
{
  "bloodType": "O_POSITIVE",
  "factorRh": true,
  "volume": 450,
  "collectionDate": "2024-01-01T08:00:00Z",
  "expirationDate": "2024-02-15T08:00:00Z",
  "institutionId": "uuid",
  "storageLocation": "Câmara 1",
  "notes": "Doador regular"
}
```

### Obter Bolsa de Sangue

```
GET /api/blood-bags/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "O+-2024-001",
    "bloodType": "O_POSITIVE",
    "factorRh": true,
    "volume": 450,
    "collectionDate": "2024-01-01T08:00:00Z",
    "expirationDate": "2024-02-15T08:00:00Z",
    "status": "DISPONIVEL",
    "currentInstitutionId": "uuid",
    "currentInstitution": { ... },
    "collectedBy": { ... },
    "qrCode": "data:image/png;base64,...",
    "hash": "sha256-hash",
    "blockchainTxId": "0x...",
    "storageLocation": "Câmara 1",
    "temperature": 4.5,
    "events": [ ... ],
    "temperatureHistory": [ ... ],
    "createdAt": "2024-01-01T08:00:00Z"
  }
}
```

### Atualizar Status da Bolsa

```
PATCH /api/blood-bags/:id/status
```

**Request Body:**
```json
{
  "status": "APROVADA",
  "storageLocation": "Câmara 2"
}
```

### Registrar Coleta (HEMOCENTRO)

```
POST /api/blood-bags/:id/collect
```

**Request Body:**
```json
{
  "storageLocation": "Câmara 1"
}
```

### Registrar Testes (HEMOCENTRO)

```
POST /api/blood-bags/:id/test
```

**Request Body:**
```json
{
  "results": {
    "hiv": "NEGATIVO",
    "hepatiteB": "NEGATIVO",
    "hepatiteC": "NEGATIVO",
    "sifilis": "NEGATIVO"
  },
  "approved": true
}
```

### Aprovar Bolsa (HEMOCENTRO)

```
POST /api/blood-bags/:id/approve
```

### Reprovar Bolsa (HEMOCENTRO)

```
POST /api/blood-bags/:id/reject
```

**Request Body:**
```json
{
  "reason": "Teste positivo para HIV"
}
```

### Armazenar Bolsa (HEMOCENTRO)

```
POST /api/blood-bags/:id/store
```

**Request Body:**
```json
{
  "storageLocation": "Câmara Frigorífica 1",
  "temperature": 4.0
}
```

### Registrar Utilização (HOSPITAL)

```
POST /api/blood-bags/:id/use
```

**Request Body:**
```json
{
  "patientId": "anonimo-123",
  "usageReason": "Transfusão de emergência",
  "usedById": "uuid"
}
```

### Registrar Descarte (HOSPITAL/HEMOCENTRO)

```
POST /api/blood-bags/:id/discard
```

**Request Body:**
```json
{
  "reason": "Vencimento da validade"
}
```

### Obter Histórico da Bolsa

```
GET /api/blood-bags/:id/history
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "bagId": "uuid",
      "type": "COLETA",
      "description": "Coleta de sangue realizada",
      "institutionId": "uuid",
      "institution": { ... },
      "userId": "uuid",
      "user": { ... },
      "hash": "sha256-hash",
      "blockchainTxId": "0x...",
      "isVerified": true,
      "verifiedAt": "2024-01-01T08:00:00Z",
      "createdAt": "2024-01-01T08:00:00Z"
    }
  ]
}
```

### Verificar Integridade na Blockchain

```
GET /api/blood-bags/:id/verify
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bagHashValid": true,
    "eventsHashValid": true,
    "allEventsValid": true,
    "blockchainTransactionId": "0x...",
    "message": "✓ Registro íntegro"
  }
}
```

### Gerar QR Code

```
GET /api/blood-bags/:id/qrcode
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,...",
    "url": "http://localhost:3000/blood-bags/O+-2024-001"
  }
}
```

## 📦 Demandas

### Listar Demandas

```
GET /api/demands
```

**Query Parameters:**
- `page` (number): Página
- `limit` (number): Itens por página
- `institutionId` (string): Filtrar por instituição
- `bloodType` (string): Filtrar por tipo sanguíneo
- `status` (string): Filtrar por status
- `urgency` (string): Filtrar por urgência

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "DEM-2024-001",
      "institutionId": "uuid",
      "institution": { ... },
      "bloodType": "O_POSITIVE",
      "quantity": 10,
      "urgency": "ALTA",
      "reason": "Reposição de estoque",
      "status": "ABERTA",
      "createdBy": { ... },
      "expiresAt": "2024-01-15T00:00:00Z",
      "closedAt": null,
      "blockchainTxId": "0x...",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": { ... }
}
```

### Criar Demanda (HOSPITAL)

```
POST /api/demands
```

**Request Body:**
```json
{
  "bloodType": "O_POSITIVE",
  "quantity": 10,
  "urgency": "ALTA",
  "reason": "Reposição de estoque para cirurgias",
  "expiresAt": "2024-01-15T00:00:00Z"
}
```

### Obter Demanda

```
GET /api/demands/:id
```

### Atualizar Status da Demanda

```
PATCH /api/demands/:id/status
```

**Request Body:**
```json
{
  "status": "ATENDIDA"
}
```

### Cancelar Demanda

```
POST /api/demands/:id/cancel
```

**Request Body:**
```json
{
  "reason": "Demanda não é mais necessária"
}
```

### Procurar Fornecedores para Demanda

```
GET /api/demands/:id/suppliers
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "institution": { ... },
      "availableQuantity": 15,
      "distanceKm": 10.5,
      "estimatedTransportTime": "2 horas"
    }
  ]
}
```

## 🚚 Transferências

### Listar Transferências

```
GET /api/transfers
```

**Query Parameters:**
- `page` (number): Página
- `limit` (number): Itens por página
- `fromInstitutionId` (string): Filtrar por instituição de origem
- `toInstitutionId` (string): Filtrar por instituição de destino
- `status` (string): Filtrar por status
- `demandId` (string): Filtrar por demanda

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "TRANS-2024-001",
      "fromInstitutionId": "uuid",
      "fromInstitution": { ... },
      "toInstitutionId": "uuid",
      "toInstitution": { ... },
      "demandId": "uuid",
      "demand": { ... },
      "status": "APROVADA",
      "requestedBy": { ... },
      "approvedBy": { ... },
      "transportInfo": { ... },
      "estimatedArrival": "2024-01-05T10:00:00Z",
      "arrivedAt": null,
      "blockchainTxId": "0x...",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": { ... }
}
```

### Solicitar Transferência (HOSPITAL)

```
POST /api/transfers
```

**Request Body:**
```json
{
  "toInstitutionId": "uuid",
  "bagIds": ["uuid1", "uuid2"],
  "demandId": "uuid",
  "notes": "Transferência urgente"
}
```

### Aprovar Transferência (HEMOCENTRO)

```
POST /api/transfers/:id/approve
```

**Request Body:**
```json
{
  "estimatedArrival": "2024-01-05T10:00:00Z",
  "transportInfo": {
    "vehicle": "Van Refrigerada",
    "driver": "João Silva"
  }
}
```

### Rejeitar Transferência (HEMOCENTRO)

```
POST /api/transfers/:id/reject
```

**Request Body:**
```json
{
  "reason": "Estoque insuficiente"
}
```

### Iniciar Transporte

```
POST /api/transfers/:id/start-transport
```

### Registrar Recebimento (HOSPITAL)

```
POST /api/transfers/:id/receive
```

**Request Body:**
```json
{
  "receivedBags": [
    {
      "bagId": "uuid",
      "temperature": 4.5,
      "condition": "BOA"
    }
  ]
}
```

### Cancelar Transferência

```
POST /api/transfers/:id/cancel
```

**Request Body:**
```json
{
  "reason": "Problema logístico"
}
```

## 🌡️ Monitoramento de Temperatura

### Listar Leituras de Temperatura

```
GET /api/temperature
```

**Query Parameters:**
- `bagId` (string): Filtrar por bolsa
- `institutionId` (string): Filtrar por instituição
- `limit` (number): Número de leituras

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "bagId": "uuid",
      "bag": { ... },
      "institutionId": "uuid",
      "institution": { ... },
      "temperature": 4.5,
      "unit": "°C",
      "alertStatus": "NORMAL",
      "notes": "Leitura automática",
      "createdAt": "2024-01-01T08:00:00Z"
    }
  ]
}

### Registrar Leitura de Temperatura

```
POST /api/temperature
```

**Request Body:**
```json
{
  "bagId": "uuid",
  "temperature": 4.5,
  "institutionId": "uuid",
  "notes": "Leitura manual"
}
```

### Simular Leituras de Temperatura

```
POST /api/temperature/simulate
```

**Request Body:**
```json
{
  "institutionId": "uuid",
  "count": 10,
  "intervalMinutes": 30
}
```

## 📊 Dashboard

### Estatísticas Gerais

```
GET /api/dashboard/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBloodBags": 150,
    "availableBloodBags": 50,
    "inTransitBloodBags": 10,
    "usedBloodBags": 80,
    "expiredBloodBags": 5,
    "discardedBloodBags": 5,
    "totalDemands": 20,
    "openDemands": 5,
    "urgentDemands": 3,
    "totalTransfers": 15,
    "pendingTransfers": 2,
    "temperatureAlerts": 1
  }
}
```

### Estoque por Tipo Sanguíneo

```
GET /api/dashboard/inventory-by-blood-type
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "bloodType": "A_POSITIVE",
      "total": 20,
      "available": 10,
      "reserved": 5,
      "used": 5
    }
  ]
}

### Movimentações (Gráfico)

```
GET /api/dashboard/movements
```

**Query Parameters:**
- `period` (string): PERIOD (day, week, month, year)
- `startDate` (date): Data inicial
- `endDate` (date): Data final

**Response:**
```json
{
  "success": true,
  "data": {
    "labels": ["01/01", "02/01", "03/01"],
    "datasets": {
      "collections": [10, 15, 8],
      "transfers": [5, 3, 2],
      "usages": [8, 12, 10],
      "discards": [1, 0, 2]
    }
  }
}
```

### Demandas (Gráfico)

```
GET /api/dashboard/demands
```

**Query Parameters:**
- `period` (string): PERIOD (day, week, month, year)

**Response:**
```json
{
  "success": true,
  "data": {
    "labels": ["ABERTA", "EM_ANALISE", "ATENDIDA", "CANCELADA"],
    "values": [5, 3, 10, 2]
  }
}
```

### Mapa da Rede

```
GET /api/dashboard/network-map
```

**Response:**
```json
{
  "success": true,
  "data": {
    "institutions": [
      {
        "id": "uuid",
        "name": "Hemocentro Central",
        "type": "HEMOCENTRO",
        "latitude": -23.5678,
        "longitude": -46.6543,
        "inventory": {
          "A_POSITIVE": 10,
          "A_NEGATIVE": 5,
          "B_POSITIVE": 8,
          "B_NEGATIVE": 3,
          "AB_POSITIVE": 2,
          "AB_NEGATIVE": 1,
          "O_POSITIVE": 15,
          "O_NEGATIVE": 7
        },
        "demands": 3,
        "transfers": 2
      }
    ],
    "connections": [
      {
        "from": "uuid1",
        "to": "uuid2",
        "transfers": 5,
        "distanceKm": 10.5
      }
    ]
  }
}
```

## 🔍 Auditoria

### Listar Logs de Auditoria (ADMIN/AUDITOR)

```
GET /api/audit-logs
```

**Query Parameters:**
- `page` (number): Página
- `limit` (number): Itens por página
- `userId` (string): Filtrar por usuário
- `action` (string): Filtrar por ação
- `entityType` (string): Filtrar por tipo de entidade
- `startDate` (date): Data inicial
- `endDate` (date): Data final

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "user": { ... },
      "action": "CREATE",
      "entityType": "BLOOD_BAG",
      "entityId": "uuid",
      "oldValue": null,
      "newValue": { ... },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0",
      "createdAt": "2024-01-01T08:00:00Z"
    }
  ],
  "meta": { ... }
}
```

## 📄 Blockchain

### Status da Blockchain

```
GET /api/blockchain/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isConnected": true,
    "contractAddress": "0x...",
    "network": "localhost",
    "chainId": 1337,
    "totalBloodBags": 150,
    "totalEvents": 500,
    "totalTransfers": 50,
    "totalDemands": 20
  }
}
```

### Verificar Registro na Blockchain

```
GET /api/blockchain/verify/:entityType/:entityId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entityType": "BLOOD_BAG",
    "entityId": "uuid",
    "onBlockchain": true,
    "transactionId": "0x...",
    "hashValid": true,
    "message": "✓ Registro verificado na blockchain"
  }
}
```

## 🌐 Endpoints Públicos

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "service": "hospitalchain-api"
}
```

### Obter Bolsa por Código (Página do QR Code)

```
GET /api/blood-bags/code/:code
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "O+-2024-001",
    "bloodType": "O_POSITIVE",
    "factorRh": true,
    "status": "DISPONIVEL",
    "currentInstitution": { ... },
    "collectionDate": "2024-01-01T08:00:00Z",
    "expirationDate": "2024-02-15T08:00:00Z",
    "qrCode": "data:image/png;base64,...",
    "hash": "sha256-hash",
    "blockchainVerified": true,
    "history": [ ... ]
  }
}
```
