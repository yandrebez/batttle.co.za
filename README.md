# Batttle Shop Monolith

Next.js full-stack TypeScript app with Prisma (PostgreSQL/Supabase), JWT auth, and role-based access control.

## Stack

- Framework: Next.js (App Router)
- Language: TypeScript
- Backend: Next.js route handlers (`src/app/api/**`)
- Database: PostgreSQL (Supabase)
- ORM: Prisma
- Auth: JWT in httpOnly cookie
- Roles: `ADMIN` and `USER`
- Hosting target: Vercel (single deployment)

## Core Routes

- Public shop: `/`
- Login: `/login`
- Register: `/register`
- Profile redirect: `/profile`
- User profile: `/me`
- Admin dashboard: `/admin`

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/products` (public)
- `GET /api/profile` (authenticated)
- `GET /api/admin/products` (admin)
- `POST /api/admin/products` (admin)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Set real values in `.env`:

- `DATABASE_URL`: Supabase Postgres connection string
- `JWT_SECRET`: long random value

4. Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

5. Start the app:

```bash
npm run dev
```

## Auth Flow

1. User logs in or registers.
2. Server signs a JWT that includes `userId`, `email`, and `role`.
3. JWT is stored in an httpOnly cookie.
4. `/profile` checks role and redirects:
- `ADMIN` -> `/admin`
- `USER` -> `/me`
5. Protected API routes validate the JWT and enforce role checks.

## Scalability Path

- Phase 1: Current monolith on Next.js + Vercel
- Phase 2: Extract API to NestJS while keeping frontend in Next.js
- Phase 3: Add caching, queues, and microservices as scale grows
