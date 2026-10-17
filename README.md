# Personal Financial Assistance App

A mobile-first financial assistance app for Ethiopia with a clean starter architecture for:

- React Native + Expo mobile app
- Node.js + TypeScript API
- PostgreSQL + Prisma schema
- JWT auth endpoints
- dashboard, budget, goal, and assistance flow scaffolding

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

## API auth endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

## Notes

This scaffold is intended for an Ethiopia-focused MVP with ETB-aware UI and mobile-first flows. It includes core domain models for transactions, budgets, goals, and assistance requests to support the next development phase.
