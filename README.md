# Microservices — Programação Web II

Projeto acadêmico desenvolvido na disciplina **Programação Web II**, do curso de Análise e Desenvolvimento de Sistemas (ADS).

A aplicação foi construída com **NestJS, TypeScript, Prisma ORM 7 e PostgreSQL**, utilizando uma arquitetura de microserviços com comunicação TCP e um API Gateway HTTP.

O projeto acompanha o **Tutorial NestJS — Microserviços, Parte 2**, incluindo a implementação principal e os exercícios práticos complementares propostos pelo professor.

## 1. Objetivo

Demonstrar o desenvolvimento e a integração de microserviços utilizando NestJS, com responsabilidades separadas, comunicação entre aplicações e persistência independente de dados.

Os principais objetivos são:

- Implementar operações CRUD utilizando NestJS e Prisma.
- Utilizar DTOs e validação de dados com `class-validator`.
- Integrar microserviços por mensagens TCP.
- Centralizar as requisições HTTP por meio de um API Gateway.
- Separar os bancos de dados de usuários e pedidos.
- Validar a existência de usuários antes de criar pedidos.
- Tratar exceções RPC e erros HTTP.
- Implementar timeouts para chamadas entre serviços.
- Aplicar regras de negócio envolvendo diferentes microserviços.

## 2. Tecnologias utilizadas

- **Node.js** — ambiente de execução JavaScript.
- **TypeScript** — linguagem utilizada no desenvolvimento.
- **NestJS 12** — framework para construção das aplicações.
- **NestJS Microservices** — comunicação TCP entre serviços.
- **Prisma ORM 7** — acesso e persistência de dados.
- **PostgreSQL 17** — banco de dados relacional.
- **Docker** — execução do PostgreSQL em contêiner.
- **RxJS** — comunicação assíncrona e gerenciamento de timeouts.
- **class-validator** e **class-transformer** — validação e transformação de dados.
- **Insomnia** — realização de testes das requisições HTTP.

## 3. Arquitetura da aplicação

O sistema possui três aplicações NestJS independentes, organizadas em um único repositório.

| Aplicação | Porta | Protocolo | Responsabilidade |
|---|---|---|---|
| API Gateway | 3000 | HTTP | Receber requisições dos clientes |
| Users Service | 3001 | TCP | Gerenciar usuários |
| Orders Service | 3002 | TCP | Gerenciar pedidos |

### Comunicação entre serviços

```text
                  Cliente HTTP
                       |
                       v
                 API Gateway
                 Porta 3000
                       |
              Comunicação TCP
                       |
             +---------+---------+
             |                   |
             v                   v
       Users Service       Orders Service
        Porta 3001           Porta 3002
             |                   |
             v                   v
          users_db            orders_db
             PostgreSQL / Docker
```

O API Gateway recebe as requisições HTTP e encaminha mensagens TCP aos microserviços responsáveis.

Os microserviços possuem seus próprios bancos de dados e não acessam diretamente as tabelas pertencentes ao outro serviço.

### Comunicação entre Users e Orders

Quando um pedido é criado, o Orders Service consulta o Users Service para verificar se o usuário informado existe.

O processo ocorre da seguinte maneira:

1. O cliente envia `POST /orders` ao API Gateway.
2. O Gateway envia a mensagem TCP `orders.create`.
3. O Orders Service recebe os dados do pedido.
4. Orders envia `users.findOne` ao Users Service.
5. Users consulta seu banco de dados utilizando Prisma.
6. Se o usuário existir, Orders registra o pedido no banco `orders_db`.
7. O resultado retorna ao cliente por meio do API Gateway.

A comunicação utiliza `ClientProxy.send()` e `@MessagePattern()`, seguindo o padrão de requisição e resposta (*request-response*).

## 4. Estrutura do projeto

```text
microservices-progweb2/
|
|-- apps/
|   |-- api-gateway/
|   |   |-- src/
|   |       |-- filters/
|   |       |-- app.module.ts
|   |       |-- main.ts
|   |       |-- users.controller.ts
|   |       |-- orders.controller.ts
|   |
|   |-- users/
|   |   |-- src/
|   |       |-- filters/
|   |       |-- main.ts
|   |       |-- prisma.service.ts
|   |       |-- users.module.ts
|   |       |-- users.controller.ts
|   |       |-- users.service.ts
|   |
|   |-- orders/
|       |-- src/
|           |-- filters/
|           |-- main.ts
|           |-- prisma.service.ts
|           |-- orders.module.ts
|           |-- orders.controller.ts
|           |-- orders.service.ts
|
|-- libs/
|   |-- contracts/
|       |-- src/
|           |-- users.dto.ts
|           |-- orders.dto.ts
|           |-- index.ts
|
|-- prisma/
|   |-- users/
|   |   |-- schema.prisma
|   |   |-- migrations/
|   |
|   |-- orders/
|   |   |-- schema.prisma
|   |   |-- migrations/
|   |
|   |-- users.config.ts
|   |-- orders.config.ts
|
|-- generated/
|   |-- users/
|   |-- orders/
|
|-- .env.example
|-- .gitignore
|-- nest-cli.json
|-- package.json
|-- package-lock.json
|-- tsconfig.json
|-- README.md
```

A pasta `generated/` contém os clientes Prisma produzidos automaticamente e está incluída no `.gitignore`.

Ela será criada novamente durante a preparação do ambiente.

## 5. Pré-requisitos

Para executar o projeto, é necessário possuir:

- Node.js e npm instalados.
- Docker Desktop instalado e em execução.
- Git para clonar o repositório.
- Um cliente HTTP, como Insomnia, para realizar os testes.

O projeto foi desenvolvido e testado em ambiente Windows, utilizando Node.js 24, NestJS 12 e PostgreSQL 17.

## 6. Instalação

### 6.1. Clonar o repositório

```bash
git clone https://github.com/Bentim-Luccas/microservices-progweb2.git
```

Acesse a pasta:

```bash
cd microservices-progweb2
```

### 6.2. Instalar as dependências

```bash
npm ci
```

O comando utiliza o `package-lock.json` para instalar as dependências do projeto.

### 6.3. Configurar as variáveis de ambiente

Na raiz do projeto, copie o arquivo `.env.example`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com as credenciais do PostgreSQL.

Exemplo:

```dotenv
USERS_DATABASE_URL="postgresql://postgres:SENHA@127.0.0.1:5434/users_db"
ORDERS_DATABASE_URL="postgresql://postgres:SENHA@127.0.0.1:5434/orders_db"
```

Substitua `SENHA` pela senha configurada na sua instância PostgreSQL.

**Importante:** o arquivo `.env` contém informações locais de conexão e não deve ser enviado ao repositório. O `.gitignore` já está configurado para ignorá-lo.

## 7. Configuração do PostgreSQL

O projeto utiliza dois bancos de dados independentes:

| Banco | Microserviço |
|---|---|
| `users_db` | Users Service |
| `orders_db` | Orders Service |

Durante o desenvolvimento, ambos foram criados na mesma instância PostgreSQL, executada em um contêiner Docker, com a porta `5434` exposta no computador.

### 7.1. Criar o contêiner

Caso ainda não exista uma instância PostgreSQL configurada, é possível criar uma utilizando:

```bash
docker run -d --name microservices_progweb2 -e POSTGRES_PASSWORD=SENHA -p 5434:5432 -v progweb2_pgdata:/var/lib/postgresql/data postgres:17
```

Substitua `SENHA` por uma senha escolhida para o ambiente local.

Essa senha deverá corresponder à utilizada nas URLs de conexão do arquivo `.env`.

Caso o contêiner já tenha sido criado anteriormente, basta iniciá-lo:

```bash
docker start microservices_progweb2
```

### 7.2. Criar os bancos de dados

Execute:

```bash
docker exec -it microservices_progweb2 psql -U postgres -c "CREATE DATABASE users_db;"
```

```bash
docker exec -it microservices_progweb2 psql -U postgres -c "CREATE DATABASE orders_db;"
```

Os bancos precisam existir antes da aplicação das migrations.

### 7.3. Verificar os bancos

Para listar os bancos da instância:

```bash
docker exec -it microservices_progweb2 psql -U postgres -l
```

O resultado deverá incluir `users_db` e `orders_db`.

## 8. Configuração do Prisma

O projeto utiliza **Prisma ORM 7**, com configurações independentes para cada microserviço.

Cada serviço possui:

- Seu próprio `schema.prisma`.
- Seu próprio histórico de migrations.
- Seu próprio Prisma Client gerado.
- Sua própria variável de conexão com PostgreSQL.

O acesso ao banco é realizado por meio de um `PrismaService` que utiliza o adaptador `PrismaPg`.

### 8.1. Aplicar as migrations de Users

```bash
npx prisma migrate deploy --config prisma/users.config.ts
```

### 8.2. Aplicar as migrations de Orders

```bash
npx prisma migrate deploy --config prisma/orders.config.ts
```

Esses comandos aplicam as migrations já existentes no repositório.

### 8.3. Gerar o Prisma Client de Users

```bash
npx prisma generate --config prisma/users.config.ts
```

### 8.4. Gerar o Prisma Client de Orders

```bash
npx prisma generate --config prisma/orders.config.ts
```

Os clientes serão gerados em:

```text
generated/users/
generated/orders/
```

**Atenção:** como `generated/` não é versionada, é necessário executar os dois comandos de geração após clonar o projeto e instalar as dependências.

Caso um schema Prisma seja alterado futuramente, o cliente correspondente deverá ser regenerado.

## 9. Executando os microserviços

A aplicação utiliza três processos NestJS independentes.

Abra três terminais na raiz do projeto.

### Terminal 1 — Users Service

```bash
npm run start:dev users
```

O microserviço ficará disponível para comunicação TCP em `127.0.0.1:3001`.

### Terminal 2 — Orders Service

```bash
npm run start:dev orders
```

O microserviço utilizará a porta TCP `3002`.

### Terminal 3 — API Gateway

```bash
npm run start:dev api-gateway
```

O API Gateway disponibilizará as rotas HTTP em:

```text
http://localhost:3000
```

**Importante:** todas as aplicações devem permanecer em execução durante os testes de integração.

Os microserviços Users e Orders não disponibilizam suas operações diretamente por HTTP. As requisições externas devem ser encaminhadas ao API Gateway.

## 10. Endpoints HTTP

Todas as rotas são disponibilizadas pelo API Gateway na porta `3000`.

### 10.1. Usuários

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/users` | Cadastrar usuário |
| GET | `/users` | Listar usuários |
| GET | `/users/:id` | Buscar usuário pelo ID |
| PATCH | `/users/:id` | Atualizar usuário |
| DELETE | `/users/:id` | Excluir usuário sem pedidos |

Exemplo de cadastro:

**POST** `/users`

```json
{
  "name": "Carlos",
  "email": "carlos@email.com"
}
```

Exemplo de atualização:

**PATCH** `/users/1`

```json
{
  "name": "Carlos Silva"
}
```

O sistema utiliza validações para os dados recebidos, incluindo verificação de e-mail e tamanho mínimo do nome.

### 10.2. Pedidos

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/orders` | Criar pedido |
| GET | `/orders` | Listar todos os pedidos |
| GET | `/orders/:id` | Buscar pedido pelo ID |
| GET | `/orders/user/:userId` | Listar pedidos de determinado usuário |
| PATCH | `/orders/:id` | Atualizar pedido |
| DELETE | `/orders/:id` | Excluir pedido |

Exemplo de criação:

**POST** `/orders`

```json
{
  "userId": 1,
  "description": "Notebook",
  "total": 4500.00
}
```

O `userId` informado precisa corresponder a um usuário existente.

Exemplo de atualização:

**PATCH** `/orders/1`

```json
{
  "description": "Notebook Dell",
  "total": 4200.00
}
```

A atualização de pedidos permite modificar `description` e `total`, preservando o `userId` original.

### Consulta de pedidos por usuário

**GET** `/orders/user/1`

Retorna um array com os pedidos associados ao usuário informado.

Se o usuário não possuir pedidos, a consulta retornará um array vazio:

```json
[]
```

### Representação dos valores monetários

O campo `total` é armazenado no PostgreSQL como `Decimal(10,2)`.

O Prisma pode serializar esse valor como uma string na resposta JSON:

```json
{
  "total": "4500"
}
```

Esse comportamento preserva a representação decimal do valor.

## 11. Comunicação TCP

A comunicação entre as aplicações utiliza padrões de mensagens do NestJS.

### Mensagens de Users

| Mensagem | Responsabilidade |
|---|---|
| `users.create` | Criar usuário |
| `users.findAll` | Listar usuários |
| `users.findOne` | Buscar usuário |
| `users.update` | Atualizar usuário |
| `users.remove` | Excluir usuário |

### Mensagens de Orders

| Mensagem | Responsabilidade |
|---|---|
| `orders.create` | Criar pedido |
| `orders.findAll` | Listar pedidos |
| `orders.findOne` | Buscar pedido |
| `orders.findByUser` | Consultar pedidos por usuário |
| `orders.update` | Atualizar pedido |
| `orders.remove` | Excluir pedido |

Os controllers dos microserviços utilizam `@MessagePattern()` para receber as mensagens.

O API Gateway utiliza `ClientProxy.send()` para encaminhar as solicitações e aguardar seus resultados.

## 12. Contratos e validação

Os contratos compartilhados estão localizados em:

```text
libs/contracts/src/
```

Os DTOs definem os dados esperados nas operações de usuários e pedidos.

O projeto utiliza decorators de validação como:

- `@IsString()` — valida valores textuais.
- `@IsEmail()` — valida endereços de e-mail.
- `@IsInt()` — valida números inteiros.
- `@IsNumber()` — valida valores numéricos.
- `@Min()` — define um valor mínimo.
- `@MinLength()` — define um tamanho mínimo.
- `@IsOptional()` — permite campos opcionais.

As aplicações utilizam `ValidationPipe` com as opções `whitelist` e `transform`.

O compartilhamento dos DTOs permite padronizar os contratos sem compartilhar diretamente as regras de negócio ou o acesso aos bancos de dados.

## 13. Tratamento de erros e timeouts

O projeto implementa tratamento de exceções RPC e tradução de erros para respostas HTTP.

Os microserviços utilizam filtros de exceção para padronizar erros produzidos durante o processamento de mensagens TCP.

O API Gateway possui um filtro responsável por converter erros recebidos em respostas HTTP.

### Exemplos de comportamento

| Situação | Status HTTP |
|---|---|
| Usuário inexistente | 404 |
| Usuário possui pedidos e não pode ser excluído | 409 |
| Timeout na comunicação | 504 |
| Erro inesperado | 500 |

As chamadas TCP do API Gateway possuem timeout de três segundos, implementado por meio do operador `timeout(3000)` do RxJS.

O Orders Service também utiliza timeout ao consultar Users.

Esses mecanismos evitam que determinadas requisições aguardem indefinidamente uma resposta de outro microserviço.

O tratamento ainda possui limitações, especialmente na tradução de erros específicos do Prisma quando registros inexistentes são alterados ou excluídos.

## 14. Regras de negócio

### 14.1. Criação de pedidos

Um pedido só pode ser cadastrado quando o usuário informado existir.

O Orders Service realiza uma consulta TCP ao Users Service antes de persistir o pedido.

Se o usuário não existir, a criação é rejeitada.

### 14.2. Exclusão de usuários

Um usuário que possui pedidos não pode ser excluído.

Antes de executar a exclusão, o Users Service consulta o Orders Service para verificar a existência de pedidos associados ao usuário.

Se houver pedidos, a operação é bloqueada com:

```json
{
  "statusCode": 409,
  "message": "Usuário possui pedidos cadastrados"
}
```

Se não houver pedidos, a exclusão é permitida.

Caso a consulta ao Orders Service falhe, a exclusão também é bloqueada, evitando prosseguir sem verificar a existência de pedidos.

## 15. Exercícios práticos implementados

Além da implementação principal do Tutorial 2, foram desenvolvidos os seis exercícios complementares propostos pelo professor.

### Exercício 1 — Atualização e exclusão de pedidos

Implementação das operações `orders.update` e `orders.remove`, incluindo suas respectivas rotas HTTP no API Gateway.

### Exercício 2 — Consulta de pedidos por usuário

Implementação da rota:

```text
GET /orders/user/:userId
```

A consulta utiliza o método `findMany()` do Prisma com filtro pelo campo `userId`.

### Exercício 3 — Tratamento de usuário inexistente

Implementação de tratamento para pedidos associados a usuários inexistentes, utilizando exceções RPC.

Também foram tratados cenários de timeout e falhas na comunicação entre Orders e Users.

### Exercício 4 — Padronização de erros RPC

Criação de filtros de exceção nos microserviços Users e Orders e de um filtro HTTP no API Gateway.

O objetivo é padronizar informações de erro e permitir respostas apropriadas aos clientes HTTP.

### Exercício 5 — Timeout no API Gateway

Aplicação de `timeout(3000)` às chamadas TCP realizadas pelo Gateway.

Foi realizado um teste controlado com atraso artificial de quatro segundos no Orders Service, confirmando o retorno de `504 Gateway Timeout`.

Após o teste, o atraso artificial foi removido.

### Exercício 6 — Proteção contra exclusão de usuários com pedidos

Implementação de comunicação entre Users e Orders antes da exclusão de usuários.

Foram testados dois cenários:

- Usuário com pedidos: exclusão bloqueada com `409 Conflict`.
- Usuário sem pedidos: exclusão permitida.

Os dois cenários foram validados utilizando o Insomnia.

## 16. Testes realizados

As funcionalidades foram verificadas manualmente utilizando o Insomnia.

Os principais testes realizados foram:

- Cadastro e listagem de usuários.
- Consulta de usuários por ID.
- Atualização e exclusão de usuários.
- Cadastro de pedidos para usuários existentes.
- Rejeição de pedidos para usuários inexistentes.
- Listagem de pedidos.
- Consulta de pedidos por ID.
- Atualização e exclusão de pedidos.
- Consulta de múltiplos pedidos de um usuário.
- Tratamento de exceções RPC.
- Simulação de timeout de comunicação.
- Bloqueio de exclusão de usuários com pedidos.
- Exclusão de usuários sem pedidos.

As aplicações também foram compiladas individualmente utilizando os comandos do NestJS CLI.

### Comandos de compilação

```bash
npx nest build users
```

```bash
npx nest build orders
```

```bash
npx nest build api-gateway
```

Esses testes não substituem uma suíte automatizada de testes unitários e de integração.

## 17. Limitações conhecidas

O projeto possui finalidade acadêmica e não está preparado para utilização em produção.

Entre as limitações estão:

- Ausência de autenticação e autorização.
- Necessidade de tratamento mais específico para determinados erros do Prisma.
- Ausência de mecanismos completos de retentativa e circuit breaker.
- Ausência de observabilidade distribuída.
- Necessidade de proteção adicional da comunicação interna entre serviços.
- Possibilidade de condições de corrida entre operações nos diferentes bancos de dados.
- Ausência de transações distribuídas para operações que envolvem diferentes microserviços.

Essas limitações demonstram alguns dos desafios existentes em arquiteturas distribuídas.

## 18. Próxima etapa do conteúdo

O próximo tutorial do professor abordará **RabbitMQ e arquitetura orientada a eventos**.

A evolução prevista inclui um microserviço de notificações e a publicação de eventos, como `order.created`.

Essa abordagem permitirá estudar conceitos como filas, exchanges, routing keys, acknowledgements, retries e dead-letter queues.

O presente projeto corresponde ao **Tutorial 2**, com comunicação TCP e operações baseadas principalmente no padrão de requisição e resposta.

## 19. Referência acadêmica

Projeto desenvolvido com base no material didático **Tutorial NestJS — Microserviços, Parte 2: Evoluindo o projeto com CRUD completo, Prisma, Orders Service e comunicação entre microserviços**, disponibilizado na disciplina Programação Web II.

As funcionalidades adicionais da Parte 8 foram implementadas como exercícios de consolidação dos conceitos apresentados no tutorial.

---

**Finalidade:** estudo e prática de arquitetura de microserviços com NestJS, Prisma ORM e PostgreSQL.