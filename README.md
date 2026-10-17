# Personal Financial Assistance App

A mobile-first financial assistance app for Ethiopia with a starter architecture for:

- React Native + Expo mobile app
- Node.js + TypeScript API
- PostgreSQL + Prisma schema
- JWT auth + finance routes
- dashboard, budget, goal, and assistance request support

## Repository structure

- `apps/mobile` — Expo app
- `services/api` — Express + Prisma API

## Quick start

```bash
npm install --workspaces --include-workspace-root
docker compose up -d postgres
cp services/api/.env.example services/api/.env
npm --workspace services/api run prisma:generate
npm --workspace services/api run prisma:migrate
npm --workspace services/api run dev
npm --workspace apps/mobile start
```

## API auth and finance endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard`
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/budgets`
- `POST /api/budgets`
- `GET /api/goals`
- `POST /api/goals`
- `GET /api/assistance-requests`
- `POST /api/assistance-requests`

## Notes

This scaffold is intended for an Ethiopia-focused MVP with ETB-aware UI and a mobile-first workflow. It includes the core transaction, budget, goal, and assistance models required to build the next stage of the product.
