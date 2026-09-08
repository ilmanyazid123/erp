# FaizERP — Website Clone + Backend

Replikasi website marketing [FaizERP.id](https://faizerp.id/) dengan backend lengkap — ERP untuk UMKM Indonesia.

Dibangun dengan Next.js 16, TypeScript, Tailwind CSS 4, NextAuth.js, Prisma (SQLite), dan lucide-react.

## Fitur

### Frontend (Marketing Site)
- Single-page marketing site dengan 12 section (Hero → Problem Patterns → Features → Workflow → Screenshots → Benefits → Pricing → Documentation → Philosophy → FAQ → Final CTA → Footer)
- Toggle bahasa **Indonesia ⇄ English** (default ID, tersimpan di localStorage)
- Theme switcher (System / Light / Dark) via tab mengambang di sisi kanan
- Mockup UI berbasis CSS (dashboard, POS, team chat, login, register) — tidak butuh gambar eksternal
- Responsive: mobile-first, dengan nav horizontal-scroll di mobile
- SEO metadata lengkap (Open Graph, Twitter Card)

### Backend (Production-Ready)
- **Authentication**: NextAuth.js dengan Credentials provider (email + password, bcrypt hashing, JWT session 30 hari)
- **Database**: Prisma + SQLite (17 model ERP lengkap)
- **API Routes**:
  - `POST /api/auth/register` — register + buat business + branch + warehouse + subscription trial 30 hari
  - `GET/POST /api/auth/[...nextauth]` — login, logout, session (NextAuth)
  - `GET /api/me` — profil user + business + subscription aktif
  - `GET /api/products` — list produk bisnis ini (with search)
  - `GET /api/dashboard/stats` — agregasi sales, cash, approval, low stock untuk dashboard mockup
  - `GET /api/activities` — recent audit log untuk activity feed
- **Auto-login** setelah register sukses
- **Header dinamis**: tampilkan nama bisnis + tombol Logout kalau sudah login, atau tombol Login kalau belum
- **Dashboard mockup** menampilkan data real dari API ketika login (fallback ke mock data kalau belum login)
- **Seed data**: 1 demo business (`demo@faizerp.id` / `password123`) dengan 10 produk, 1 customer, 1 supplier, 30 hari sales history, 5 pending approvals

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + CSS variables (OKLCH) |
| Auth | NextAuth.js v4 (Credentials + JWT) |
| Database | Prisma + PostgreSQL (Neon / Vercel Postgres / Supabase) |
| Password hashing | bcryptjs |
| Theme | next-themes |
| Icons | lucide-react |
| Font | Roboto (Google Fonts) |
| Package manager | Bun |

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Setup environment
cp .env.example .env
# Edit .env — isi DATABASE_URL (pooler) + DIRECT_URL (direct) dari Neon/Vercel Postgres/Supabase
# Generate NEXTAUTH_SECRET: openssl rand -base64 32

# 3. Buat database schema (17 tabel)
bun run db:push

# 4. Seed demo data (opsional, tapi recommended)
bun run scripts/seed.ts

# 5. Jalankan dev server
bun run dev
# Buka http://localhost:3000
```

## Database Setup (PostgreSQL)

Schema Prisma menggunakan PostgreSQL dengan dua connection string:

| Env Var | Kegunaan | Format URL |
|--------|----------|------------|
| `DATABASE_URL` | App runtime (via PgBouncer pooler untuk serverless) | `postgresql://...?pgbouncer=true&connect_timeout=15` |
| `DIRECT_URL` | Migration (db:push / db:migrate — butuh direct connection) | `postgresql://...` (tanpa `pgbouncer`) |

### Provider yang Didukung

- **Neon** (recommended): https://neon.tech — free tier unlimited projects, autoscale, branching
- **Vercel Postgres**: built-in di Vercel dashboard → tab Storage
- **Supabase**: https://supabase.com — free 500MB + auth + storage + realtime

Untuk Neon, hostname pooler = `ep-xxx-pooler.region.aws.neon.tech`, hostname direct = `ep-xxx.region.aws.neon.tech` (tanpa `-pooler`).

## Demo Account

Setelah seed:
- **Email**: `demo@faizerp.id`
- **Password**: `password123`
- **Bisnis**: Demo Toko Sembako (subscription Team, trial 30 hari)
- **Data demo**: 10 produk sembako, 1 customer (Warung Bu Sari), 1 supplier (PT Sembako Jaya), 30 hari sales history, 5 pending approvals

## API Reference

### Auth
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Daftar bisnis baru + user owner. Body: `{ businessName, name, email, password, confirmPassword }` |
| `/api/auth/signin` | POST | (NextAuth) Login dengan credentials |
| `/api/auth/signout` | POST | (NextAuth) Logout |
| `/api/auth/session` | GET | (NextAuth) Get current session |

### Data (requires auth)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/me` | GET | Profil user + business + subscription |
| `/api/products?search=...` | GET | List produk (max 100) |
| `/api/dashboard/stats` | GET | Sales, cash, approval, low stock untuk dashboard |
| `/api/activities` | GET | 10 audit log terakhir |

## Struktur Proyek

```
.
├── prisma/
│   └── schema.prisma          # 17 model ERP: User, Business, Branch, Warehouse, Product, Customer, Supplier, InventoryItem, StockMovement, PurchaseOrder(+items), SalesOrder(+items), Invoice, Payment, Approval, ChatMessage, Subscription, AuditLog
├── scripts/
│   └── seed.ts                # Seed demo data (idempotent)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts   # NextAuth handler
│   │   │   │   └── register/route.ts        # Register + create business
│   │   │   ├── me/route.ts                  # Current user profile
│   │   │   ├── products/route.ts            # Products CRUD (GET)
│   │   │   ├── dashboard/stats/route.ts     # Dashboard aggregation
│   │   │   └── activities/route.ts           # Audit log feed
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── sections/                         # 12 homepage section components
│   │   ├── appearance-tab.tsx                # Floating right-edge theme switcher
│   │   ├── auth-dialog.tsx                  # Login + Register modals (real API)
│   │   ├── dashboard-mockups.tsx            # CSS ERP mockups (real data when logged in)
│   │   ├── faiz-logo.tsx
│   │   ├── page-loader.tsx
│   │   ├── providers.tsx                     # SessionProvider + Language + AuthModal
│   │   ├── site-footer.tsx
│   │   └── site-header.tsx                   # Adaptive: shows Logout when authed
│   └── lib/
│       ├── auth.ts                          # NextAuth config + helpers
│       ├── api-utils.ts                      # Error helpers
│       ├── db.ts                            # Prisma client singleton
│       └── i18n.ts                          # Bilingual ID/EN string table
├── .env.example
└── README.md
```

## Deployment

### Vercel (recommended)
1. Push repo ke GitHub
2. Import di Vercel — auto-detect Next.js
3. Tambahkan env vars di Vercel dashboard → Settings → Environment Variables:
   - `DATABASE_URL` — Neon pooler connection string (with `?pgbouncer=true`)
   - `DIRECT_URL` — Neon direct connection string (without `pgbouncer`)
   - `NEXTAUTH_SECRET` — generate baru dengan `openssl rand -base64 32`
   - `NEXTAUTH_URL` — `https://<your-domain>.vercel.app`
4. Deploy → Vercel auto-deploy setiap push ke main branch

### VPS + PM2
```bash
bun run build
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/public
cd .next/standalone
pm2 start server.js --name faizerp
```

### Docker (untuk portable deploy)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

## Catatan

- Email footer (`support@faizerp.id`) dan URL OpenGraph masih mengarah ke faizerp.id — ganti ke domain Anda sendiri di `src/lib/i18n.ts` dan `src/app/layout.tsx`.
- Form login & register **sudah berfungsi penuh** dengan backend NextAuth + Prisma + bcrypt.
- Database: **PostgreSQL via Neon** (atau Vercel Postgres / Supabase). SQLite sebelumnya sudah diganti untuk mendukung deployment serverless.
- Untuk produksi: tambahkan rate limiting di `/api/auth/*`, setup SMTP untuk reset password, dan pertimbangkan indexes untuk query performance pada dataset besar.
- Token NextAuth di `.env` harus diganti dengan `openssl rand -base64 32`. Jangan commit `.env` ke git (sudah di-gitignore).

## Lisensi

Replikasi ini dibuat untuk tujuan edukasi/pembelajaran. Tidak berafiliasi dengan FaizERP.id.
