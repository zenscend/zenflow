# ZenFlow

Revenue operations suite for quoting and invoicing — built for the South African market.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Prisma v7** + PostgreSQL
- **NextAuth.js v5 beta** (JWT, credentials)
- **@react-pdf/renderer** for PDF generation
- **pnpm** as package manager

---

## Getting Started

### 1. Install dependencies
```bash
pnpm install
```

### 2. Set up environment
Copy `.env` and fill in your values (already configured for local dev):
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zenflow?schema=public"
AUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Run database migrations
```bash
pnpm dlx prisma migrate dev
```

### 4. Seed the database
Creates the default admin user (`admin@zenflow.local` / `Admin1234!`):
```bash
pnpm db:seed
```

### 5. Start the dev server
```bash
pnpm dev
```

App runs at [http://localhost:3000](http://localhost:3000).

---

## Commands

### Dev
```bash
pnpm dev          # Start dev server (port 3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Database
```bash
# Run migrations (after schema changes)
pnpm dlx prisma migrate dev --name <migration-name>

# Push schema without creating a migration file (prototyping)
pnpm dlx prisma db push

# Open Prisma Studio — visual DB browser at http://localhost:5555
pnpm dlx prisma studio

# Regenerate Prisma client (after schema changes)
pnpm dlx prisma generate

# Seed the database
pnpm db:seed

# Reset database — drops all data and reruns migrations
pnpm dlx prisma migrate reset
```

### Connect directly to the database
```bash
# Interactive psql session
psql postgresql://postgres:postgres@localhost:5432/zenflow

# Run a one-off query
psql postgresql://postgres:postgres@localhost:5432/zenflow -c "SELECT * FROM users;"
```

---

## Default Admin Credentials

| Field    | Value                 |
|----------|-----------------------|
| Email    | `admin@zenflow.local` |
| Password | `Admin1234!`          |

---

## Project Structure

```
src/
  app/
    (auth)/         # Login, register pages
    (dashboard)/    # All authenticated pages + layout
      onboarding/
      dashboard/
      company/
      customers/
      products/
      quotes/
      invoices/
    api/            # API routes
  components/
    layout/         # Sidebar, topbar
    pdf/            # InvoicePDF, QuotePDF (@react-pdf/renderer)
    ui/             # Base UI + shadcn components
  lib/
    auth.ts         # NextAuth config
    prisma.ts       # Prisma client singleton
    utils.ts        # Formatters, helpers
    button-variants.ts
  middleware.ts     # Auth + org routing guards
prisma/
  schema.prisma
  seed.ts
```
