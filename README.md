# BloodLink

Sistema web **acadêmico** de rastreabilidade, gerenciamento e redistribuição de bolsas de sangue entre hospitais e hemocentros, utilizando blockchain para garantir a imutabilidade do histórico de custódia.

> ⚠️ **Este é um projeto acadêmico/protótipo.** Ele não deve ser utilizado como software médico em produção. Todos os dados de demonstração são fictícios. Nenhum dado real de pacientes ou doadores foi ou deve ser utilizado.

---

## Status de verificação deste projeto

Antes de cada entrega, o projeto é validado de ponta a ponta. Resultado da verificação mais recente:

| Camada | Verificação | Resultado |
|---|---|---|
| Backend | `tsc -b` (checagem de tipos) | ✅ Sem erros próprios do código |
| Backend | `npm test` (Jest + Supertest) | ✅ **60/60 testes passando**, em 10 suítes |
| Frontend | `tsc -b` (checagem de tipos) | ✅ Sem erros |
| Frontend | `npm test` (Vitest + Testing Library) | ✅ **49/49 testes passando**, em 10 arquivos |
| Frontend | `npm run build` (build de produção) | ✅ Gera `dist/` normalmente |
| Docker | `docker-compose.yml` | ✅ YAML válido, 4 serviços, 2 volumes |
| Docker | scripts de entrypoint | ✅ Sintaxe validada (`sh -n`) |
| Banco de dados | Migration inicial (`prisma/migrations/`) | ✅ **Aplicada e testada contra um PostgreSQL 16 real** — todos os `CREATE TYPE`/`CREATE TABLE`/`CREATE INDEX`/`ALTER TABLE` executados com sucesso, incluindo um teste funcional completo de inserts, joins e regras de integridade referencial (`RESTRICT` e `SET NULL`) |
| Blockchain | `hardhat compile` / `hardhat test` | ⚠️ Não executável **neste ambiente de build específico** — ver nota abaixo |
| Schema Prisma | parsing do `schema.prisma` | ✅ Sintaxe válida (revisado manualmente + confirmado pelo próprio parser do Prisma) |

**Sobre o item pendente:** o ambiente usado para montar e validar este projeto tem acesso à internet restrito a alguns domínios (registro npm, GitHub, repositórios do Ubuntu). `npx hardhat compile` baixa o compilador Solidity de `binaries.soliditylang.org`, que não está entre os domínios liberados nesse ambiente de build — por isso esse comando específico não pôde ser executado ali. **Isso não é uma limitação do projeto**: em qualquer máquina de desenvolvedor ou runner de CI com acesso normal à internet, ele funciona sem nenhuma configuração extra, como em qualquer projeto Hardhat comum. O contrato Solidity foi revisado manualmente linha a linha para garantir a sintaxe.

Já a camada de banco de dados **foi validada de verdade**: como o repositório de pacotes do Ubuntu (`archive.ubuntu.com`) estava acessível, foi possível instalar um PostgreSQL 16 local nesse mesmo ambiente e rodar a migration inicial contra ele de ponta a ponta — criação de todos os tipos/tabelas/índices/chaves estrangeiras, inserts simulando exatamente o que os services do backend fazem, joins equivalentes aos `include` do Prisma, e checagem das regras de `onDelete` (`RESTRICT` numa relação obrigatória, `SET NULL` numa opcional). Isso é independente do binário do engine do Prisma (que baixa de `binaries.prisma.sh`, também fora da lista de domínios liberados) — a suíte de testes do backend usa um stub de `@prisma/client` (ver [Testes](#testes)) justamente para não depender desse download.

### Histórico de correções relevantes

Encontradas e corrigidas em revisões posteriores, listadas aqui por transparência:

| # | Problema | Onde | Como foi encontrado |
|---|---|---|---|
| 1 | `node:20-alpine` não vem com OpenSSL, e o engine do Prisma não conseguia detectar a versão da libssl (aviso nos logs, quebraria as queries em runtime) | `backend/Dockerfile` | Reportado nos logs reais do `docker compose up` |
| 2 | `prisma migrate deploy` (usado no Docker) não cria tabelas a partir do zero — ele só aplica migrations já existentes, e a pasta `prisma/migrations/` nunca tinha sido gerada; o banco ficaria completamente vazio | `backend/prisma/migrations/` (não existia) | Revisão proativa após o problema nº 1; confirmado aplicando a migration escrita manualmente contra um PostgreSQL 16 real instalado no ambiente de build |
| 3 | `BloodBagService.list()` filtrava por um campo chamado `instituicaoId`, mas o campo real do model `BloodBag` é `instituicaoAtualId` — o Prisma rejeitaria essa query em runtime (e, com o client gerado, o `tsc` nem deixaria a imagem Docker terminar de buildar). Afetava o botão "Ver bolsas" na página de detalhe da demanda, parte central do fluxo de demonstração | `backend/src/services/BloodBagService.ts` | Varredura sistemática comparando todo `where`/`data`/`include` de cada service contra os nomes de campo exatos do `schema.prisma` |
| 4 | O índice real do evento na blockchain (`eventIndex`, retornado pelo próprio contrato) era calculado mas nunca gravado no banco. A verificação de integridade tentava reconstruir esse índice reordenando os eventos da bolsa por `timestamp` — algo frágil, já que dois eventos da mesma bolsa podem cair no mesmo milissegundo numa rede local rápida (Hardhat minera quase instantaneamente), gerando um falso "registro divergente" | `backend/src/services/EventService.ts`, `schema.prisma` (nova coluna `eventIndex`) | Revisão da lógica de `verifyIntegrity`, cruzando com o que `EvmBlockchainService.registerEvent` já retornava e descartava |
| 5 | `TransferService.accept()` e `.receive()` não verificavam o status atual da transferência antes de agir — diferente de `.offer()`, que já tinha essa guarda. Um clique duplo (ou uma chamada direta à API) podia reprocessar uma transferência já aceita/recebida, duplicando eventos numa trilha que se propõe imutável | `backend/src/services/TransferService.ts` | Comparação de consistência entre os três métodos do fluxo de transferência; também achei e removi uma variável morta (`reserved`, nunca lida) no caminho |
| 6 | `DemandService.findById()`/`.list()` não incluíam `destinationInstitution` nas transferências de uma demanda, mas a página de detalhe da demanda no frontend renderiza `t.destinationInstitution.name` sem verificação de nulo — resultaria em "Cannot read properties of undefined" bem no meio do fluxo de demonstração, assim que uma demanda tivesse ao menos uma transferência | `backend/src/services/DemandService.ts` | Auditoria sistemática de cada campo aninhado acessado no frontend (`X.Y.Z`) contra o `include` real do endpoint correspondente no backend; confirmado com um JOIN equivalente rodado contra o Postgres real |
| 7 | O botão "Aprovar bolsa" só aparecia quando `bag.status === "EM_TESTE"` — mas nenhuma bolsa jamais chega nesse status: `BloodBagService.create()` sempre cria a bolsa como `COLETADA`, e não existe nenhum código que transicione para `EM_TESTE`. Na prática, uma bolsa cadastrada pela UI nunca podia ser aprovada por um usuário HEMOCENTRO — ficava presa para sempre. Também não existia nenhum botão de "Reprovar" ou "Descartar" na tela, embora os endpoints já existissem no backend e estivessem documentados nas permissões de cada perfil | `frontend/src/pages/BloodBagDetail.tsx` | Comparação entre a condição de exibição do botão e o status real atribuído por `BloodBagService.create()` |
| 8 | As rotas `/users` e `/settings` (só para ADMIN na sidebar e no backend) não tinham nenhuma guarda no roteamento do frontend — qualquer usuário autenticado digitando a URL diretamente caía numa página quebrada (lista vazia, formulário que sempre falhava com 403). Não é uma falha de segurança (o backend já bloqueia certo com RBAC), mas é uma experiência ruim | `frontend/src/App.tsx` | Revisão das rotas que dependem de papel específico, comparando o que a sidebar esconde com o que o roteador de fato protege |
| 9 | O formulário "Cadastrar bolsa" não tinha nenhum campo para escolher a instituição responsável, mas o backend exige esse dado quando o usuário logado não pertence a nenhuma instituição (caso do ADMIN) — resultava no erro "Instituição responsável pela coleta é obrigatória." sem nenhuma forma de resolver pela tela. O formulário "Nova demanda" tinha exatamente o mesmo problema em relação ao hospital solicitante | `frontend/src/pages/CreateBloodBag.tsx`, `frontend/src/pages/Demands.tsx` | Reportado pelo usuário ao tentar cadastrar uma bolsa; ao corrigir, encontrei o mesmo padrão no formulário de demandas por analogia |
| 10 | `EvmBlockchainService` é um singleton que compartilha a mesma carteira (wallet) entre todas as requisições HTTP concorrentes, e o `ethers.js` não serializa transações concorrentes de uma mesma wallet automaticamente. Duas requisições simultâneas (ex.: dois usuários cadastrando bolsas ao mesmo tempo) podiam calcular o mesmo nonce, fazendo uma das transações falhar em produção sob uso concorrente real — um cenário que o Hardhat local (mineração quase instantânea) mascara bem na maior parte das vezes durante testes manuais | `backend/src/blockchain/EvmBlockchainService.ts` | Revisão da camada de blockchain em busca de condições de corrida, já que ela é compartilhada entre requisições — corrigido com uma fila que serializa as escritas, e testado forçando duas transações concorrentes com promises controladas manualmente |
| 11 | `POST /api/institutions` (cadastro de instituição, capacidade documentada do ADMIN) não tinha nenhum formulário na tela de Instituições — só listagem | `frontend/src/pages/Institutions.tsx` | Mesma varredura de paridade UI↔backend que já tinha achado os itens 7 e 9 (recursos documentados/existentes no backend sem nenhum ponto de entrada na interface) |

Os itens 2 a 11 foram encontrados numa varredura proativa (sem um erro reportado ainda, exceto o item 9) depois de corrigir o item 1: revisando cada `where`, `data` e `include` de cada service contra o `schema.prisma`, testando a migration contra um banco real, comparando a consistência das guardas de transição de estado entre métodos irmãos do mesmo fluxo, cruzando cada acesso a campo aninhado no frontend contra o `include` real do endpoint que o alimenta, comparando a condição de cada botão de ação contra o status que a bolsa de fato assume em cada etapa, conferindo se toda rota que a sidebar esconde por papel também é protegida no roteador, adicionando os campos de formulário que faltavam para os casos que o backend já exigia, e checando a camada de blockchain (compartilhada entre requisições) em busca de condições de corrida.

---

## Sumário

1. [Descrição e objetivo](#descrição-e-objetivo)
2. [Problema que o sistema resolve](#problema-que-o-sistema-resolve)
3. [Arquitetura](#arquitetura)
4. [Tecnologias](#tecnologias)
5. [Como a blockchain é usada](#como-a-blockchain-é-usada)
6. [QR Code — geração e escaneamento](#qr-code--geração-e-escaneamento)
7. [Modelo de dados](#modelo-de-dados)
8. [Instalação e execução](#instalação-e-execução)
9. [Usuários de demonstração](#usuários-de-demonstração)
10. [Fluxo de demonstração guiado](#fluxo-de-demonstração-guiado)
11. [Endpoints da API](#endpoints-da-api)
12. [Testes](#testes)
13. [Estrutura do projeto](#estrutura-do-projeto)
14. [Segurança e privacidade](#segurança-e-privacidade)
15. [Solução de problemas](#solução-de-problemas)
16. [Limitações conhecidas](#limitações-conhecidas)
17. [Possíveis melhorias futuras](#possíveis-melhorias-futuras)

---

## Descrição e objetivo

O BloodLink simula uma rede permissionada de instituições de saúde (hemocentros e hospitais) que compartilham e rastreiam bolsas de sangue do momento da coleta até o uso ou descarte final. O objetivo acadêmico é demonstrar, de forma **executável**, como uma blockchain pode ser usada para:

- garantir que o histórico de custódia de uma bolsa de sangue não possa ser alterado retroativamente;
- permitir a verificação independente de integridade dos registros (qualquer instituição pode conferir que um evento não foi adulterado);
- coordenar a redistribuição de estoque entre instituições diferentes, sem uma autoridade central controlando todos os dados.

## Problema que o sistema resolve

Hoje, o controle de estoque de sangue costuma ser feito de forma isolada por cada instituição, dificultando:

- a visibilidade de estoque excedente em uma instituição enquanto outra enfrenta desabastecimento;
- a auditoria confiável do histórico de uma bolsa quando ela passa por múltiplas instituições;
- a detecção de adulterações ou inconsistências nos registros de custódia.

O BloodLink propõe uma rede compartilhada com registro de eventos em blockchain para mitigar esses problemas, mantendo os dados sensíveis fora da chain.

## Arquitetura

```
Frontend (React + Vite)
        │  HTTP/JSON
        ▼
Backend / API (Node + Express + TypeScript)
        │
        ├──► PostgreSQL (Prisma ORM)      — dados detalhados, nunca dados sensíveis na chain
        │
        └──► BlockchainService (interface) — isola a implementação concreta
                   │
                   ▼
        EvmBlockchainService (Hardhat local + ethers.js)
                   │
                   ▼
        Smart contract BloodChainRegistry.sol
```

A blockchain registra **apenas**: identificador da bolsa, tipo de evento, instituição responsável, usuário responsável e o **hash SHA-256** dos dados detalhados do evento. Os dados completos (e qualquer dado sensível) permanecem exclusivamente no PostgreSQL. O backend pode recalcular o hash a partir dos dados atuais e compará-lo com o valor gravado on-chain para verificar integridade.

A camada de blockchain é isolada atrás da interface `BlockchainService` (`backend/src/blockchain/BlockchainService.ts`), para que a implementação concreta (hoje EVM/Hardhat) possa ser trocada por outra rede permissionada (ex.: Hyperledger Fabric) sem alterar controllers, serviços de domínio ou o frontend.

## Tecnologias

| Camada | Stack |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS, React Router, Axios, Recharts, qrcode.react, html5-qrcode |
| Testes do frontend | Vitest + Testing Library (React) |
| Backend | Node.js, TypeScript, Express, JWT, bcrypt, Zod, Prisma ORM |
| Testes do backend | Jest + Supertest |
| Banco de dados | PostgreSQL |
| Blockchain | Rede EVM local (Hardhat) + Solidity (`BloodChainRegistry.sol`) + ethers.js |
| Testes do contrato | Hardhat + Chai |
| Infra | Docker Compose (4 serviços), Nginx (serve o frontend em produção) |

## Como a blockchain é usada

O contrato `BloodChainRegistry.sol` é **append-only**: não existe função de alteração ou remoção de eventos já registrados, apenas `registerEvent`, que sempre adiciona um novo evento ao final do histórico de uma bolsa. Isso garante a imutabilidade.

Cada operação relevante do domínio (coleta, aprovação, reprovação, armazenamento, oferta de transferência, aceite, reserva, transporte, recebimento, uso, descarte, leitura de temperatura fora da faixa) passa pelo `EventService` do backend, que:

1. calcula um hash SHA-256 determinístico dos metadados do evento;
2. chama `BlockchainService.registerEvent(...)`, que efetivamente envia uma transação para o contrato na rede local;
3. grava no PostgreSQL o `BloodBagEvent` com o hash e o id da transação blockchain associada (`BlockchainTransaction`).

A verificação de integridade (`GET /api/blood-bags/:id/verify` e `GET /api/blockchain/verify/:id`) recalcula/consulta o hash registrado on-chain e compara com o hash armazenado no banco, retornando `✓ íntegro` ou `⚠ divergente`.

## QR Code — geração e escaneamento

Cada bolsa tem um QR Code que aponta para sua página de detalhe (`/blood-bags/<codigo>`), cobrindo tanto a geração quanto a leitura:

- **Geração** (`frontend/src/pages/BloodBagDetail.tsx`): renderizado com `qrcode.react`, o QR codifica a URL completa da bolsa. Pode ser impresso e afixado fisicamente na bolsa.
- **Escaneamento** (`frontend/src/pages/ScanQrCode.tsx`, rota `/scan`, acessível pela sidebar ou pelo botão "📷 Escanear QR Code" na página de Bolsas): usa `html5-qrcode` para acessar a câmera do dispositivo (celular ou webcam) e decodificar o QR **inteiramente no navegador** — nenhuma imagem é enviada a um servidor. Ao detectar um código, extrai o identificador da bolsa (função `extractBagCodeFromScan`, em `frontend/src/utils/qrcode.ts`) e navega direto para a página de detalhe/histórico daquela bolsa.
- A extração de código funciona com três formatos de entrada — URL completa, caminho relativo (`/blood-bags/<codigo>`) ou o código puro — o que também permite reaproveitar o mesmo scanner para QR Codes gerados por outra instância do sistema.
- Há um campo de **digitação manual** como alternativa, para quando a câmera não está disponível, a permissão é negada pelo usuário, ou o QR Code físico está danificado/ilegível.

Esse par geração/leitura foi testado de ponta a ponta: `qrcode.test.ts` cobre a função de extração isoladamente (6 casos, incluindo URL com querystring e caracteres codificados) e `ScanQrCode.test.tsx` cobre a página completa com a câmera mockada (inicialização do scanner, navegação após leitura bem-sucedida, aviso quando o navegador não suporta câmera, e o fluxo de digitação manual).

## Modelo de dados

Entidades principais (ver `backend/prisma/schema.prisma` para o detalhamento completo):

- **Institution** — hemocentros e hospitais participantes da rede
- **User** — usuários com papéis ADMIN, HEMOCENTRO, HOSPITAL, AUDITOR
- **BloodBag** — a bolsa de sangue e seu estado atual
- **BloodBagEvent** — cada evento imutável do histórico de uma bolsa, com hash e referência à transação blockchain
- **BloodDemand** — demandas de sangue criadas por hospitais
- **BloodTransfer** — transferências entre instituições, associadas ou não a uma demanda
- **TemperatureReading** — leituras de temperatura (simuladas) de armazenamento/transporte
- **BlockchainTransaction** — metadados de cada transação enviada à blockchain
- **AuditLog** — logs administrativos (ex.: login)

## Instalação e execução

### Pré-requisitos

- Node.js 20+
- PostgreSQL 16 (local ou via Docker)
- npm
- Acesso à internet na primeira execução (para `npm install`, `prisma generate` e o download do compilador Solidity pelo Hardhat)

### Com Docker (recomendado — sobe tudo com um único comando)

```bash
docker compose up --build
```

Isso sobe **os quatro serviços** e deixa tudo funcional automaticamente, sem passos manuais:

1. **postgres** — banco de dados;
2. **blockchain** — sobe o nó Hardhat local e implanta o contrato `BloodChainRegistry` assim que o nó fica disponível, publicando `deployed.json` em um volume compartilhado;
3. **backend** — espera o contrato ser implantado e o PostgreSQL responder, roda `prisma migrate deploy` e, se o banco estiver vazio, executa o **seed de demonstração automaticamente** (isso registra eventos reais na blockchain, então a primeira subida pode levar alguns minutos);
4. **frontend** — build de produção do React servido via Nginx.

Depois que os logs do backend mostrarem `BloodLink backend rodando em http://localhost:3333`, acesse:

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3333/api/health
- **RPC da blockchain:** http://localhost:8545

Para reiniciar do zero (apagando banco e blockchain e refazendo o seed):

```bash
docker compose down -v
docker compose up --build
```

Para acompanhar o progresso do seed (que roda dentro do container `backend` na primeira subida):

```bash
docker compose logs -f backend
```

### Passo a passo (ambiente local, sem Docker — útil para desenvolvimento com hot-reload)

```bash
# 1. Instalar dependências de todos os pacotes
npm run install:all

# 2. Configurar variáveis de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# edite backend/.env se necessário (ex.: credenciais do PostgreSQL)

# 3. Subir o PostgreSQL (se não tiver um rodando localmente)
docker run -d --name bloodlink-postgres \
  -e POSTGRES_USER=bloodlink -e POSTGRES_PASSWORD=bloodlink -e POSTGRES_DB=bloodlink \
  -p 5432:5432 postgres:16-alpine

# 4. Iniciar a rede blockchain local (mantenha este terminal aberto)
npm run blockchain:start

# 5. Em outro terminal: compilar e implantar o smart contract
npm run blockchain:compile
npm run blockchain:deploy

# 6. Rodar as migrations e gerar o cliente Prisma
npm run db:generate
npm run db:migrate

# 7. Popular o banco com dados de demonstração (isso registra eventos reais na blockchain)
npm run db:seed

# 8. Iniciar o backend (em outro terminal)
npm run backend:dev

# 9. Iniciar o frontend (em outro terminal)
npm run frontend:dev
```

Acesse o frontend em **http://localhost:5173**. A API fica disponível em **http://localhost:3333/api**.

## Usuários de demonstração

Todos usam a senha **`senha123`**:

| E-mail | Perfil | Instituição |
|---|---|---|
| `admin@bloodlink.com` | ADMIN | — |
| `hemocentro@bloodlink.com` | HEMOCENTRO | Hemocentro Central |
| `hospitalA@bloodlink.com` | HOSPITAL | Hospital São Lucas |
| `hospitalB@bloodlink.com` | HOSPITAL | Hospital Municipal |
| `auditor@bloodlink.com` | AUDITOR | — |

## Fluxo de demonstração guiado

1. Login como `hospitalA@bloodlink.com`.
2. Vá em **Demandas** → já existe uma demanda urgente de O- criada pelo seed (ou crie uma nova).
3. Abra a demanda: o sistema lista automaticamente instituições com estoque O- compatível (ex.: Hemocentro Central, Hospital Municipal).
4. Faça login como `hospitalB@bloodlink.com` (Hospital Municipal) em outra aba/sessão e, na mesma demanda, ofereça uma bolsa disponível.
5. Volte para a sessão do Hospital A e **aceite** a oferta — a bolsa é automaticamente reservada e colocada em transporte.
6. Em **Transferências**, confirme o **recebimento** — a bolsa passa a pertencer ao Hospital A e fica `DISPONIVEL`.
7. Abra a bolsa em **Bolsas** e consulte o **histórico completo** — ou vá em **Escanear QR Code** e aponte a câmera para o QR gerado na página da bolsa (ou para o QR impresso, se você tiver gerado um) para chegar direto a essa mesma página.
8. Clique em **VERIFICAR INTEGRIDADE** — o sistema recalcula os hashes e confirma `✓ Registro íntegro` comparando com os dados gravados na blockchain.
9. Em **Blockchain**, veja a lista de transações reais enviadas ao contrato `BloodChainRegistry`.
10. Em **Alertas**, veja a bolsa de demonstração com leitura de temperatura fora da faixa segura (2°C–6°C).

## Endpoints da API

Todas as rotas abaixo (exceto login e o healthcheck) exigem `Authorization: Bearer <token>`. A coluna **Papéis** lista quem, além do ADMIN (que sempre tem acesso), pode chamar o endpoint — "todos" significa qualquer usuário autenticado.

| Método e rota | Papéis permitidos | Descrição |
|---|---|---|
| `GET /api/health` | público | Healthcheck, sem autenticação |
| `POST /api/auth/login` | público | Login, retorna o JWT |
| `GET /api/auth/me` | todos | Dados do usuário autenticado |
| `GET /api/blood-bags` | todos | Lista bolsas (filtros: status, tipoSanguineo, instituicaoId) |
| `POST /api/blood-bags` | HEMOCENTRO | Cadastra bolsa (evento COLETA) |
| `GET /api/blood-bags/:id` | todos | Detalhe de uma bolsa (aceita id ou código) |
| `GET /api/blood-bags/:id/history` | todos | Histórico completo de eventos |
| `GET /api/blood-bags/:id/verify` | todos | Verifica a integridade de todos os eventos da bolsa |
| `POST /api/blood-bags/:id/approve` | HEMOCENTRO | Aprova → armazena → disponibiliza |
| `POST /api/blood-bags/:id/reject` | HEMOCENTRO | Reprova a bolsa |
| `POST /api/blood-bags/:id/use` | HOSPITAL | Registra utilização |
| `POST /api/blood-bags/:id/discard` | HOSPITAL, HEMOCENTRO | Registra descarte |
| `GET /api/demands` | todos | Lista demandas |
| `POST /api/demands` | HOSPITAL | Cria demanda |
| `GET /api/demands/:id` | todos | Detalhe + fornecedores compatíveis |
| `POST /api/demands/:id/offer` | HEMOCENTRO, HOSPITAL | Oferece uma bolsa para a demanda |
| `POST /api/demands/:id/accept` | HOSPITAL | Aceita uma oferta de transferência |
| `GET /api/transfers` | todos | Lista transferências |
| `POST /api/transfers/:id/receive` | HOSPITAL, HEMOCENTRO | Confirma recebimento |
| `POST /api/transfers/:id/reject` | HOSPITAL, HEMOCENTRO | Recusa a transferência |
| `GET /api/institutions` | todos | Lista instituições |
| `POST /api/institutions` | ADMIN | Cadastra instituição |
| `GET /api/users` | ADMIN | Lista usuários |
| `POST /api/users` | ADMIN | Cadastra usuário |
| `GET /api/dashboard` | todos | Métricas e dados dos gráficos |
| `GET /api/audit` | ADMIN, AUDITOR | Eventos registrados (auditoria) |
| `GET /api/audit/logs` | ADMIN, AUDITOR | Logs administrativos (ex.: login) |
| `GET /api/blockchain/transactions` | todos | Transações enviadas ao contrato |
| `GET /api/blockchain/verify/:eventId` | todos | Verifica um evento específico contra a chain |
| `GET /api/blockchain/network` | todos | Rede/implementação de blockchain em uso |
| `GET /api/temperature/alerts` | todos | Leituras fora da faixa segura |
| `GET /api/temperature/:bagId` | todos | Histórico de temperatura de uma bolsa |
| `POST /api/temperature/:bagId` | todos | Registra uma leitura de temperatura |

## Testes

```bash
npm run test:all          # roda backend, frontend e blockchain em sequência

npm run backend:test      # testes do backend (Jest + Supertest)
npm run frontend:test     # testes do frontend (Vitest + Testing Library)
npm run blockchain:test   # testes do smart contract (Hardhat + Chai)
```

O projeto tem cobertura de teste nas três camadas — **119 testes ao todo**, todos passando neste repositório (ver [Status de verificação](#status-de-verificação-deste-projeto) para o que pôde ser executado no ambiente de build usado aqui):

**Backend (Jest) — 60 testes em 10 suítes**
- `hash.test.ts` — determinismo do hash SHA-256 e conversão para `bytes32`
- `auth.middleware.test.ts` — `requireAuth` (token ausente/inválido/válido) e `requireRole` (RBAC)
- `BloodBagService.test.ts` — criação (com QR Code e evento COLETA), cascata de aprovação (APROVADA → ARMAZENADA → DISPONIVEL com 2 eventos na blockchain), reprovação, uso, descarte, agregação de estoque, filtro por instituição mapeado para o campo real do model
- `DemandService.test.ts` — criação de demanda, busca de fornecedores compatíveis (excluindo a própria instituição), cálculo de status a partir das transferências (ATENDIDA/PARCIALMENTE_ATENDIDA), inclusão de `destinationInstitution` nas transferências retornadas
- `TemperatureService.test.ts` — geração de alerta fora da faixa 2°C–6°C, simulação de leituras
- `EventService.test.ts` — cálculo de hash + registro on-chain + persistência do `eventIndex` real, verificação de integridade usando esse índice (íntegro/divergente/índices altos)
- `AuthController.test.ts` — login com credenciais corretas/incorretas/usuário inativo, emissão de JWT válido, registro em auditoria
- `transferFlow.test.ts` — regra de negócio de que só bolsas `DISPONIVEL` podem ser oferecidas, e que `accept()`/`receive()` só avançam transferências no status esperado (`OFERTADA`/`EM_TRANSPORTE`)
- `app.integration.test.ts` — sobe o Express real (via Supertest) e testa autenticação, validação Zod e RBAC ponta a ponta nas rotas (`/api/blood-bags`, `/api/demands`, `/api/audit`)
- `EvmBlockchainService.test.ts` — serialização de transações concorrentes (a segunda só é enviada depois que a primeira termina, evitando conflito de nonce) e recuperação da fila após uma transação com erro

Os testes usam Prisma e o `BlockchainService` **mockados** (a lógica de negócio é testada isoladamente), incluindo um stub de `@prisma/client` (`backend/src/__mocks__/prismaClientStub.ts`) com os enums do schema — isso torna a suíte determinística e independente de rede, sem precisar baixar o engine binário do Prisma só para rodar os testes.

**Frontend (Vitest + Testing Library) — 49 testes em 10 arquivos**
- `components/UI.test.tsx` — `StatusBadge` (cores por status), `BLOOD_TYPE_LABELS`, `MetricCard`, `PageHeader`
- `hooks/useAuth.test.tsx` — estado inicial deslogado, restauração de sessão do `localStorage`, `login()` chamando a API e persistindo token/usuário, `logout()` limpando tudo
- `pages/Login.test.tsx` — formulário pré-preenchido, mensagem de erro em credenciais inválidas, chamada correta à API ao submeter
- `utils/qrcode.test.ts` — extração do código da bolsa a partir do texto lido do QR (URL completa, com querystring, caminho relativo, código puro, e caracteres codificados como `%2B`)
- `pages/ScanQrCode.test.tsx` — inicialização do scanner de câmera (mockado), navegação ao ler um QR com sucesso, aviso quando o navegador não suporta câmera, e o fluxo de digitação manual do código
- `pages/BloodBagDetail.test.tsx` — visibilidade dos botões de ação por status real da bolsa e papel do usuário (Aprovar/Reprovar em `COLETADA`/`EM_TESTE`, Registrar utilização/Descartar em `DISPONIVEL`, nenhum botão em `UTILIZADA`), e chamada correta à API ao aprovar
- `App.test.tsx` — `PrivateRoute` (redireciona para `/login` sem sessão) e `RoleRoute` (usuários não-ADMIN são redirecionados para o Dashboard ao tentar acessar `/users`/`/settings` diretamente pela URL; ADMIN acessa normalmente)
- `pages/CreateBloodBag.test.tsx` — seletor de instituição responsável populado pela API, pré-selecionado para o usuário logado, exigido explicitamente para ADMIN, e enviado corretamente no corpo da requisição
- `pages/Demands.test.tsx` — mesma cobertura para o seletor de hospital solicitante no formulário de nova demanda
- `pages/Institutions.test.tsx` — botão/formulário de criação visível só para ADMIN, validação de latitude/longitude numéricas, envio correto dos dados

**Blockchain (Hardhat + Chai) — 10 testes**

`test/BloodChainRegistry.test.ts` cobre: registro e leitura de histórico, natureza *append-only* (múltiplos eventos em ordem), `verifyEvent` (hash correto/divergente), `eventCount` sincronizado, isolamento do histórico entre bolsas diferentes, `getBloodBagHistory` vazio para bolsa inexistente, `getEvent` por índice (incluindo revert para índice fora do range), emissão do evento `EventRegistered` com os dados corretos, e uma checagem de que a interface pública do contrato não expõe nenhuma função de update/delete (garantindo a imutabilidade por design).

## Estrutura do projeto

```
bloodlink/
├── frontend/                Frontend: React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/      Componentes reutilizáveis (StatusBadge, MetricCard...) + testes
│   │   ├── pages/            Uma página por rota + testes (Login, Dashboard, Bolsas, ScanQrCode...)
│   │   ├── layouts/          Layout principal com sidebar responsiva (menu mobile)
│   │   ├── services/         Cliente Axios configurado
│   │   ├── hooks/             useAuth (contexto de autenticação) + testes
│   │   ├── types/             Tipos TypeScript compartilhados
│   │   ├── utils/              Extração do código da bolsa a partir do QR escaneado + testes
│   │   └── test/              Setup global dos testes (Vitest)
│   ├── Dockerfile             Build multi-stage + Nginx
│   └── nginx.conf
│
├── backend/                  Backend: Node + Express + TypeScript + Prisma
│   ├── src/
│   │   ├── controllers/       Um controller por recurso + testes
│   │   ├── services/           Regras de negócio (BloodBagService, DemandService...) + testes
│   │   ├── routes/             Definição das rotas Express
│   │   ├── middlewares/        Autenticação, RBAC, validação Zod
│   │   ├── blockchain/         BlockchainService (interface) + EvmBlockchainService
│   │   ├── utils/               Cálculo de hash SHA-256
│   │   ├── __mocks__/           Stub de @prisma/client usado só nos testes
│   │   ├── __tests__/           Testes de integração e testes que não têm um módulo 1:1
│   │   ├── app.ts               Criação do app Express (usado pelos testes com supertest)
│   │   └── index.ts             Ponto de entrada (chama app.listen)
│   ├── prisma/                  schema.prisma + migrations/ (migration inicial) + seed.ts
│   ├── scripts/                 docker-bootstrap.ts (migrations + seed automáticos no Docker)
│   └── Dockerfile
│
├── blockchain/                Hardhat + Solidity
│   ├── contracts/              BloodChainRegistry.sol
│   ├── scripts/                 deploy.ts
│   ├── test/                    Testes do contrato (Hardhat + Chai)
│   └── Dockerfile
│
├── docker-compose.yml          Orquestra os 4 serviços (postgres, blockchain, backend, frontend)
├── package.json                 Scripts orquestradores (install:all, test:all, db:seed...)
└── README.md
```

## Segurança e privacidade

- Autenticação via JWT; senhas armazenadas com bcrypt (nunca em texto plano ou hardcoded).
- Controle de acesso por papel (RBAC) em todos os endpoints sensíveis (ver tabela em [Endpoints da API](#endpoints-da-api)).
- Validação de entrada com Zod em todos os endpoints de escrita.
- CORS restrito à origem do frontend configurada por variável de ambiente.
- Rate limiting básico na API.
- **Nenhum dado pessoal, médico ou de identificação (nome de doador, CPF, dados clínicos) é armazenado na blockchain** — apenas identificadores lógicos, tipos de evento e hashes.
- Nenhuma chave privada é exposta no frontend; toda interação com a blockchain acontece no backend.

## Solução de problemas

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| `HH502: Couldn't download compiler version list` ao compilar o contrato | Sem acesso a `binaries.soliditylang.org` | Verifique a conexão/firewall/proxy; em redes corporativas, pode ser necessário liberar esse domínio |
| `Failed to fetch the engine file` no `prisma generate` | Sem acesso a `binaries.prisma.sh` | Mesma causa acima, para o domínio do Prisma |
| Backend fica preso em "Aguardando o contrato ser implantado..." (Docker) | O container `blockchain` ainda não terminou de implantar o contrato | Normal na primeira subida; acompanhe com `docker compose logs -f blockchain` |
| Seed demora vários minutos na primeira subida | Esperado — o seed registra ~100+ bolsas com eventos reais na blockchain, uma transação por vez | Aguarde; acompanhe com `docker compose logs -f backend` |
| `EADDRINUSE` / porta já em uso (3333, 5173, 5432 ou 8545) | Outro processo (ou uma execução anterior) já está usando a porta | Pare o processo conflitante, ou ajuste a porta publicada no `docker-compose.yml`/`.env` |
| Troquei a porta do Postgres no `docker-compose.yml` (ex.: 5432 → 5435) e agora o backend fica preso para sempre em "Aguardando o PostgreSQL aceitar conexões..." | O mapeamento de porta é `"HOST:CONTAINER"` — só o lado esquerdo deveria mudar. Se o lado direito também mudou, ou se a porta na `DATABASE_URL` do serviço `backend` foi alterada para acompanhar, a comunicação interna entre os containers quebra (ela usa sempre `postgres:5432`, a porta *interna*, independente da porta exposta para o seu host) | No `docker-compose.yml`, deixe `ports: - "5435:5432"` (só o lado esquerdo mudou) e mantenha `DATABASE_URL: postgresql://bloodlink:bloodlink@postgres:5432/...` sem alterar o `5432`. Depois rode `docker compose down -v && docker compose up --build` |
| Login retorna "credenciais inválidas" mesmo com a senha certa, logo após subir o Docker | Sintoma do item acima (ou de qualquer outra causa que impeça o backend de terminar o startup): se o backend nunca chega a rodar migrations + seed, o banco fica sem nenhum usuário, e qualquer tentativa de login falha | Resolva primeiro o que está impedindo o backend de subir (veja `docker compose logs -f backend`); depois que ele conseguir migrar e semear o banco, o login com os usuários de demonstração volta a funcionar |
| Depois de um `docker restart` no serviço `blockchain`, a verificação de integridade passa a falhar | O nó Hardhat perdeu o estado da chain e reimplantou o contrato num endereço novo (ver [Limitações](#limitações-conhecidas)) | Rode `docker compose down -v && docker compose up --build` para um reset completo e consistente |
| Erro de tipo mencionando enums do Prisma (`BloodBagStatus`, `BloodType`...) ao rodar `tsc` fora do Jest | O `npx prisma generate` ainda não rodou com sucesso (precisa de internet) | Rode `npm run db:generate` com acesso à internet liberado |
| Frontend carrega mas todas as chamadas de API falham | `VITE_API_URL` aponta para o backend errado | Confira `frontend/.env` (local) ou o build-arg `VITE_API_URL` no `docker-compose.yml` (Docker) |
| `Prisma failed to detect the libssl/openssl version...` nos logs do `backend` | A imagem `node:20-alpine` não vem com OpenSSL instalado por padrão, e o engine do Prisma precisa dele | Já corrigido no `backend/Dockerfile` (instala `openssl` antes do `prisma generate`) e no `schema.prisma` (`binaryTargets` incluindo as variantes `linux-musl`); se o aviso ainda aparecer após um `docker compose up --build`, rode `docker compose build --no-cache backend` para forçar a reconstrução da imagem |
| `relation "User" does not exist` (ou qualquer outra tabela) | Alguém alterou `schema.prisma` sem criar uma migration correspondente — `prisma migrate deploy` (usado no Docker) só aplica migrations que já existem em `prisma/migrations/`, ele não cria tabelas a partir do schema sozinho | Rode `npx prisma migrate dev --name <descricao>` localmente (com um banco acessível) para gerar a nova migration, comite o SQL gerado em `prisma/migrations/`, e então rode `docker compose build --no-cache backend && docker compose up` |
| A página "Escanear QR Code" não abre a câmera / fica em branco | Permissão de câmera negada, ou a página não está em `localhost`/HTTPS | Verifique a permissão de câmera do navegador para o site; em produção, sirva o frontend via HTTPS. Enquanto isso, use o campo de digitação manual do código na mesma página |

## Limitações conhecidas

- **Protótipo acadêmico**: não passou por validação clínica, regulatória ou de segurança para uso em ambiente hospitalar real.
- A blockchain utilizada é uma rede EVM local (Hardhat) de single-node, adequada para demonstração; em um cenário real de produção, recomenda-se uma rede permissionada multi-nó (ex.: Hyperledger Fabric), para o qual a interface `BlockchainService` já está preparada.
- O monitoramento de temperatura é **simulado** (`TemperatureService.simulateTemperature`), pois não há hardware de sensores físico neste protótipo.
- O mapa da rede usa coordenadas fictícias e uma projeção simplificada, sem um provedor de mapas real.
- A verificação de integridade compara o hash persistido no PostgreSQL com o hash gravado on-chain; como o payload bruto do evento não é reconstruído a partir do banco (apenas seus metadados), a garantia de integridade recai sobre a imutabilidade da blockchain como fonte da verdade, e não sobre uma reconstrução byte-a-byte do payload original.
- **No ambiente Docker**, o nó Hardhat roda em memória dentro do container `blockchain`: se esse container for reiniciado (crash, `docker restart`, etc.) sem um `docker compose down -v`, ele perde todo o histórico da chain e reimplanta o contrato do zero. Nesse caso, os eventos gravados no PostgreSQL antes do reinício ficam com referências a transações que não existem mais na nova instância da chain, e o container `backend` também precisa ser reiniciado para reconectar ao novo endereço do contrato. Para um reset completo e consistente, use sempre `docker compose down -v && docker compose up --build`.
- ~~Criação de demanda e cadastro de bolsa exigiam a instituição do usuário logado sem oferecer um seletor no formulário para o caso de ADMIN~~ — corrigido (ver item 9 do histórico de correções).
- `TransferService.reject()` não reverte o status da bolsa se a transferência já estava aceita/reservada/em transporte (a bolsa ficaria presa em `RESERVADA`/`EM_TRANSPORTE` mesmo com a transferência marcada como `RECUSADA`). Na prática isso não é alcançável pela interface atual — nenhuma tela chama `POST /api/transfers/:id/reject` — mas fica documentado aqui caso esse endpoint venha a ganhar um botão no futuro.
- O escaneamento de QR Code usa `navigator.mediaDevices.getUserMedia`, que os navegadores só liberam em **contexto seguro** (HTTPS) ou em `localhost`. Rodando localmente ou via Docker em `http://localhost`, funciona normalmente; se o frontend for publicado em outro host sem HTTPS, a câmera não será liberada pelo navegador (a página continua funcionando via digitação manual do código, que não depende da câmera).

## Possíveis melhorias futuras

- Implementar uma segunda `BlockchainService` para Hyperledger Fabric e permitir alternância por configuração.
- Substituir a simulação de temperatura por integração real com sensores IoT.
- Adicionar assinatura digital por usuário em cada evento, além do hash.
- Adicionar notificações em tempo real (WebSocket) quando uma demanda urgente for aberta.
- Internacionalização da interface.
- Seletor de instituição no formulário de cadastro de bolsa/demanda quando o usuário logado for ADMIN.
- Pipeline de CI (GitHub Actions) rodando `test:all` a cada push, com cache dos binários do Prisma/Solidity para builds mais rápidas e reprodutíveis.
