# 🌊 Surf Social API

Backend inicial da rede social para surfistas usando **Node.js + TypeScript + Prisma + PostgreSQL**

---

# 🚀 Setup do projeto

```bash
pnpm install
```

---

# ⚙️ Configurar banco

Crie um `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/surf_social"
```

---

# 🧠 Prisma — como funciona

O Prisma usa um fluxo simples:

```
schema.prisma → migrations → banco → Prisma Client (TS)
```

👉 Você edita **apenas um arquivo**:

```
prisma/schema.prisma
```

---

# 📦 Gerar o Prisma Client

Sempre que instalar ou mudar o schema:

```bash
npx prisma generate
```

👉 Isso gera o client usado no código:

```ts
import { PrismaClient } from "@prisma/client";
```

---

# 🧱 Criar migrations (DESENVOLVIMENTO)

Quando mudar o schema:

```bash
npx prisma migrate dev --name nome_da_mudanca
```

Isso vai:

* comparar mudanças
* gerar SQL automaticamente
* salvar em `prisma/migrations`
* aplicar no banco
* atualizar o client

---

# ⚠️ NÃO usar isso em produção

```bash
npx prisma db push
```

👉 Apenas para protótipo
👉 Não gera histórico de migrations

---

# 🧠 Fluxo correto de desenvolvimento

1. Edita `schema.prisma`
2. Roda:

```bash
npx prisma migrate dev --name descricao
```

3. Prisma faz o resto

---

# 📂 Estrutura de migrations

```
prisma/
  migrations/
    20260319_init/
      migration.sql
    20260320_add_session/
      migration.sql
```

👉 Cada mudança vira uma nova migration versionada (tipo git)

---

# 🧪 Rodar em DEV

```bash
pnpm dev
```

👉 Aqui você usa:

```bash
npx prisma migrate dev
```

---

# 🚀 Produção (IMPORTANTE)

Em produção você NÃO usa `migrate dev`

👉 usa:

```bash
npx prisma migrate deploy
```

Isso:

* aplica apenas migrations existentes
* não cria novas
* seguro para produção

---

# 🧱 Build + Run produção

```bash
pnpm build
pnpm start
```

E antes disso:

```bash
npx prisma migrate deploy
npx prisma generate
```

---

# ⚠️ Boas práticas IMPORTANTES

## ❌ Não alterar banco manualmente

Sempre use migrations:

```
schema → migrate → banco
```

---

## ❌ Não instanciar Prisma várias vezes

Use instância única:

```ts
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

---

## ⚠️ Cuidado com mudanças perigosas

Mudanças como:

* renomear coluna
* trocar tipo

👉 podem precisar ajuste manual na migration

---

## 🧪 Debug de queries (opcional)

```ts
new PrismaClient({
  log: ["query"],
});
```

---

# 🧰 Comandos úteis

```bash
# gerar client
npx prisma generate

# criar migration
npx prisma migrate dev --name nome

# aplicar em produção
npx prisma migrate deploy

# resetar banco (cuidado)
npx prisma migrate reset

# abrir UI do prisma
npx prisma studio
```

---

# 🧠 Dica final

👉 Prisma acelera MUITO o desenvolvimento
👉 mas o diferencial do app não é CRUD

Foque em:

* feed de sessões 🌊
* analytics de surf 📊
* integração com sensores 📡

---

# 🚀 Próximos passos

* autenticação (JWT)
* sistema de follow
* feed estilo Instagram/Strava
* processamento de dados de surf

---
