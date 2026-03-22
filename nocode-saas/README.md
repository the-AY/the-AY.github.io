# NoCode SaaS Platform

A scalable no-code SaaS platform for building dynamic applications (websites, POS systems, dashboards) using drag-and-drop.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 16 (or Docker)
- npm 9+

### 1. Start Database
```bash
docker-compose up -d
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Migrations
```bash
cd server
cp ../.env.example .env
npx knex migrate:latest
cd ..
```

### 4. Start Development
```bash
npm run dev
```

- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## Architecture

```
┌──────────────────────────────────────────┐
│           React SPA (Vite)               │
│  Auth │ Dashboard │ DB Builder │ UI      │
│  Builder │ Runtime │ POS Module          │
└──────────────┬───────────────────────────┘
               │ HTTPS + JWT
┌──────────────▼───────────────────────────┐
│        Express API Gateway               │
│  Auth MW │ Tenant MW │ Rate Limiter      │
├──────────────────────────────────────────┤
│  Auth │ Apps │ Schema │ Data │ UI │ POS  │
└──────────────┬───────────────────────────┘
               │
┌──────────────▼───────────────────────────┐
│         PostgreSQL (Multi-tenant)        │
│  public: users, tenants, apps            │
│  tenant_xxx: user-defined tables         │
└──────────────────────────────────────────┘
```

## Tech Stack
- **Frontend**: React 18, Vite 5, dnd-kit, Axios, React Router
- **Backend**: Express 4, Knex, bcrypt, JWT
- **Database**: PostgreSQL 16 (schema-per-tenant)
- **Styling**: Custom CSS, glassmorphism dark theme

## API Endpoints
See [implementation_plan.md](./docs/implementation_plan.md) for full API documentation.
