# CampusCycle — MVP

This repository contains a minimal production-ready MVP for CampusCycle (campus-only reuse marketplace).

Quick start (requires Docker):

1. Copy env files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Start services:

```bash
docker-compose up --build
```

3. After DB is up, run migrations & seed (from host or inside container):

```bash
# from host with psql installed
docker exec -it <db_container> psql -U postgres -d campuscycle -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
# in backend container
docker exec -it <backend_container> sh -c "npx prisma migrate deploy || true && npm run seed"
```

Development (local without Docker):

- Backend: `cd backend && npm install && npx prisma generate && npm run dev`
- Frontend: `cd frontend && npm install && npm run dev`

Project structure:
- `/backend` — Express + TypeScript API, Prisma schema in `/backend/prisma`.
- `/frontend` — Vite + React + TypeScript + Tailwind.

Notes:
- Email verification is stubbed (logs verification link to console). Replace `src/utils/email.ts` with a real provider for production.
- File uploads saved to `/uploads` (local). Swap storage by adapting `listings` upload logic.
- Socket.IO implemented on backend and usable from frontend via `socket.io-client`.
