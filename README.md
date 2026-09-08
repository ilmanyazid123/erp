# FaizERP — Website Clone

Replikasi website marketing [FaizERP.id](https://faizerp.id/) — ERP untuk UMKM Indonesia.

Dibangun dengan Next.js 16, TypeScript, Tailwind CSS 4, next-themes, dan lucide-react.

## Fitur

- Single-page marketing site dengan 12 section (Hero → Problem Patterns → Features → Workflow → Screenshots → Benefits → Pricing → Documentation → Philosophy → FAQ → Final CTA → Footer)
- Toggle bahasa **Indonesia ⇄ English** (default ID, tersimpan di localStorage)
- Theme switcher (System / Light / Dark) via tab mengambang di sisi kanan
- Login & Register modal (demo)
- Mockup UI berbasis CSS (dashboard, POS, team chat, login, register) — tidak butuh gambar eksternal
- Responsive: mobile-first, dengan nav horizontal-scroll di mobile
- SEO metadata lengkap (Open Graph, Twitter Card)

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + CSS variables (OKLCH) |
| Theme | next-themes |
| Icons | lucide-react |
| Font | Roboto (Google Fonts) |
| Package manager | Bun |

## Cara Menjalankan

```bash
# Install dependencies
bun install

# Jalankan dev server
bun run dev
# Buka http://localhost:3000

# Build untuk production
bun run build

# Lint
bun run lint
```

## Struktur Proyek

```
src/
├── app/
│   ├── globals.css          # Color tokens (OKLCH) + noise texture + utilities
│   ├── layout.tsx           # Roboto font + metadata + providers
│   └── page.tsx             # Home page (semua 12 section)
├── components/
│   ├── sections/             # 12 homepage section components
│   ├── appearance-tab.tsx    # Floating right-edge theme switcher modal
│   ├── auth-dialog.tsx       # Login + Register modals
│   ├── dashboard-mockups.tsx # CSS-based ERP UI mockups
│   ├── faiz-logo.tsx         # SVG FaizERP logo
│   ├── page-loader.tsx       # Brief branded loading overlay
│   ├── providers.tsx         # Language + Auth + Theme providers
│   ├── site-footer.tsx       # 3-column footer
│   └── site-header.tsx       # Sticky blue blur header
└── lib/
    └── i18n.ts               # Bilingual ID/EN string table
```

## Deployment

Lihat bagian deployment di dokumentasi Next.js untuk:
- **Vercel** (paling mudah): https://nextjs.org/docs/app/building-your-application/deploying#vercel
- **Static export**: ubah `next.config.ts` jadi `output: "export"` lalu `bun run build` → upload folder `out/`
- **VPS + PM2**: `bun run build` → jalankan `node .next/standalone/server.js`
- **Docker**: lihat contoh Dockerfile di Next.js docs

## Catatan

- Email footer (`support@faizerp.id`) dan URL Open Graph masih mengarah ke faizerp.id — ganti ke domain Anda sendiri di `src/lib/i18n.ts` dan `src/app/layout.tsx`.
- Form login/register hanya demo (tidak terhubung ke backend). Untuk produksi, integrasikan dengan NextAuth.js yang sudah terinstall.

## Lisensi

Replikasi ini dibuat untuk tujuan edukasi/pembelajaran. Tidak berafiliasi dengan FaizERP.id.
