# 🌊 Surf Social API

Backend layer of thesis application. Stack consists of
**Node.js, Prisma, GraphQL, PostgreSQL**

---

# 🚀 Project Setup

What you will need:
- Node.js
- Docker
- pnpm (recommended)

Start by installing the packages:

```bash
pnpm install
```

---

# ⚙️ Configuring a local database

Create a `.env` file:

```env
DATABASE_URL="postgresql://admin:password@localhost:5432/thesis_db?schema=public"
```

Then create and run the Docker container:

```
docker-compose up -d
```

---

# 🧠 Running the project

Lastly, execute the migrations and start the server.

```bash
pnpm db-create && pnpm dev
```
