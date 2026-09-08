# FaizERP.id — Comprehensive Website Analysis Report

**URL analyzed:** https://faizerp.id/
**Analysis date:** 2025
**Method:** Headless Chrome via `agent-browser` (snapshots, screenshots, computed styles, DOM extraction)
**Screenshots saved in:** `/home/z/faizerp_analysis/screenshots/`
- `home_full.png` — full Indonesian homepage
- `home_top.png` — homepage above the fold
- `documentation_full.png` — /documentation page
- `login_full.png` — /login page
- `register_full.png` — /register page

---

## 1. Brand Identity

- **Brand name:** FaizERP (styled `FaizERP.id`)
- **Domain:** https://faizerp.id
- **Tagline (meta description):** "FaizERP membantu UMKM mengelola stock, pembelian, penjualan, POS, finance, approval, dan laporan dalam satu sistem sederhana" (FaizERP helps Indonesian SMEs manage stock, purchasing, sales, POS, finance, approvals, and reporting in one simple system)
- **Hero badge (pill above H1):** "Sistem untuk operasional bisnis sehari-hari" (A system for everyday business operations)
- **Hero H1:** "Operasional Bisnis dalam Satu Sistem" (Business Operations in One System)
- **Footer brand label:** "FaizERP Indonesia"
- **Footer philosophy line:** "Dibangun sambil mengamati workflow praktis di bisnis Indonesia yang sedang bertumbung." (Built while observing practical workflows in growing Indonesian businesses.)
- **Market:** Indonesian SMEs (UMKM). Bilingual: **Indonesian (default)** and **English** (full content translation).
- **Product type:** Cloud ERP (inventory, purchasing, sales, POS, finance, approval workflow, dashboard/reporting, team chat, user/role management, audit log, subscription/billing)

---

## 2. Site Structure (Page Hierarchy)

The site is essentially a **single-page marketing site** plus a **documentation subsite** and auth pages.

```
faizerp.id/                         (Homepage — single-page, all sections anchor-linked)
  ├─ #home          (Hero)
  ├─ #features      (System features / 11 modules)
  ├─ #workflow      (Connected workflows — 5 steps)
  ├─ #screenshots   (Product screenshots)
  ├─ #pricing       (Simple Pricing — 4 plans)
  └─ #faq           (Frequently Asked Questions — 3 Q&A)

faizerp.id/documentation           (Documentation hub — 3-column docs layout)
faizerp.id/login                   (Login form)
faizerp.id/register                (Register / workspace creation form)
faizerp.id/locale/en               (Switch UI to English — redirects back)
faizerp.id/locale/id               (Switch UI to Indonesian — redirects back)
```

> Note: "Fitur" (Features), "Harga" (Pricing) and "FAQ" in the nav are **in-page anchors** on the homepage, not separate pages. Only "Dokumentasi" (Documentation) is a separate routed page.

### 2.1 Documentation sidebar categories (from /documentation)
- **Mulai Menggunakan** (Getting Started): Pengenalan, Buat Akun, Setup Perusahaan, Setup Branch, Setup Warehouse
- **Master Data**: Product, Customer, Supplier, Daftar Harga (Price List)
- **Inventory**: Overview, Stock Balance, Kartu Stock, Stock Adjustment, Stock Transfer, Stock Opname
- **Purchasing**: Purchase Order, Goods Receipt, Supplier Invoice, Supplier Payment
- **Sales**: Sales Order, Delivery Order, Sales Invoice, Customer Payment
- **POS**: Cashier Shift, Create Sale, Refund, Closing Harian (Daily Closing)
- **Finance**: Cash Flow, Receivable, Payable, Expense
- **Approval Workflow**: Overview, Purchase Approval, Discount Approval
- **Report**: Dashboard, Sales Report, Inventory Report, Financial Report
- **Administrasi**: Langganan dan Billing (Subscription & Billing), User Management, Role dan Permission, Audit Log
- **FAQ**: Pertanyaan Umum, Troubleshooting

Documentation page layout = **3 columns**: left category sidebar (collapsible disclosure groups), center article (breadcrumb + H1 + sections), right "Di Halaman Ini" (On This Page) anchor nav.

---

## 3. Navigation Menu

### Desktop (visible ≥ lg / 1024px), inside sticky header, right-aligned text links in `text-white/75`:
1. **Fitur** → `#features`
2. **Dokumentasi** → `https://faizerp.id/documentation`
3. **Harga** → `#pricing`
4. **FAQ** → `#faq`

### Header right cluster:
- **Language toggle:** "English" (or "Indonesia" when in EN mode) → `/locale/en` | `/locale/id`
- **Login button** (white pill on blue) → `/login`

### Mobile (below lg), appears as a horizontally-scrollable second row under the header (`order-last flex w-full items-center gap-5 overflow-x-auto border-t border-white/10`):
- Fitur · Dokumentasi · Harga · FAQ (same 4 items, shrink-0, scrollable)

### Global floating element (right edge, vertically centered):
- A small fixed tab (`fixed inset-y-0 right-0 z-50 my-auto … w-14 hover:w-20 h-12 cursor-pointer`) — opens the **Appearance settings modal** (theme switcher: System / Light / Dark). Uses a settings/lucide gear icon.

---

## 4. Homepage Sections (in order, top → bottom)

### SECTION 1 — Hero (`#home`)
- **Background:** solid brand **blue** (`bg-primary`) with a **noise texture overlay** (`bg-noise` PNG) and `overflow-hidden`. White text throughout.
- **Sticky header** sits inside this section (transparent-to-blue, `bg-primary/90 backdrop-blur`, `border-b border-white/10`), height ~73px.
- **Left column (5/12 grid on lg):**
  - Pill badge (rounded-full, `border-white/15 bg-white/10`, text-sm): *"Sistem untuk operasional bisnis sehari-hari"* (with small icon)
  - **H1** (text-4xl → sm:text-5xl → lg:text-6xl, font-semibold, white, ~60px on desktop): *"Operasional Bisnis dalam Satu Sistem"*
  - **Subtitle** (paragraph): *"Kelola persediaan, pembelian, penjualan, POS, keuangan, persetujuan, dan laporan dalam satu tempat."*
  - **Two CTAs (row):**
    - **Primary:** "Buat Akun" (Create an Account) → `/register` — `bg-white text-primary` pill, with icon
    - **Secondary:** "Lihat Tampilan" (Explore the Product) → `#screenshots` — `bg-white/10 text-white border-white/25` pill, with icon
  - **Three category micro-labels** (text-xs text-white/60, with short descriptions):
    - *Persediaan* — "Saldo stok, kartu stok, transfer, dan opname"
    - *Operasional* — "Pembelian, penjualan, invoice, dan pembayaran"
    - *Kontrol* — "Persetujuan, hak akses, laporan, dan audit trail"
- **Right column (7/12):** Large product screenshot `dashboard-page-web.png` (1280×590), labeled *"Tampilan dashboard FaizERP.id"*.

### SECTION 2 — Problem Patterns (no id)
- **Background:** transparent (page background).
- **H2:** "Beberapa pola yang sering terlihat" (A few patterns we keep noticing)
- **Subtitle:** "Spreadsheet, kertas, dan chat itu berguna. Momen yang menarik muncul ketika bisnis mulai cukup kompleks sehingga terlalu banyak konteks harus diingat oleh tim."
- **Grid:** `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` — 4 problem cards, each with icon + h3 + paragraph:
  1. **Banyak file terpisah** (Many separate files) — "Data produk, stok, harga, dan laporan sering dimulai dari file sederhana, lalu perlahan tersebar ke banyak orang."
  2. **Persetujuan di percakapan** (Approvals inside conversations) — "Keputusan pembelian dan diskon sering terjadi di chat, tetapi alasannya mudah hilang ketika ingin diperiksa kembali."
  3. **Perubahan stok sulit ditelusuri** (Stock changes hard to trace) — "Saat stok berubah, tim perlu mengetahui bukan hanya jumlahnya, tetapi juga alasan perubahannya."
  4. **Laporan membutuhkan waktu** (Reports take time) — "Pemilik usaha sering harus menunggu data operasional dirapikan sebelum dapat mengambil keputusan berikutnya."

### SECTION 3 — System Features (`#features`)
- **Background:** `bg-white`, `border-y border-foreground/10`.
- **H2:** "Sistem yang sedang kami bangun" (The system we are building)
- **Subtitle:** "FaizERP.id menghubungkan penjualan, pembelian, persediaan, keuangan, POS, dan persetujuan menggunakan data bisnis, cabang, gudang, pelanggan, pemasok, dan produk yang sama."
- **Grid:** `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` — **11 module cards**. Each card: `rounded-lg border bg-background p-5 shadow-sm`, with icon + h3 title + 4-item bullet list (each bullet has a small check/icon):
  1. **Bisnis & Master Data** — Bisnis/branch/warehouse; Product/kategori/brand/unit; Customer & supplier; Harga & konversi product
  2. **Inventory** — Opening stock & adjustment; Stock balance & kartu stock; Stock transfer; Stock opname
  3. **Purchasing** — Purchase order; Goods receipt; Supplier invoice; Supplier payment
  4. **Sales** — Sales order & delivery order; Customer invoice & payment; Sales return; Monitoring receivable
  5. **Point of Sale** — Cashier shift; Penjualan counter & payment; Posting & receipt; Kontrol void & cancellation
  6. **Cash & Finance** — Cash & bank account; Cash in & cash out; Transfer antar-account; Expense request & payment
  7. **Approval Workflow** — Workflow approval yang dapat diatur; Approval inbox; Approve, reject, & cancel; Catatan keputusan & notes
  8. **Dashboard & Report** — Dashboard bisnis; Stock movement report; Aging receivable & payable; Profit & POS report
  9. **Kolaborasi Tim** (Team Collaboration) — Chat internal bisnis; Attachment percakapan; Notifikasi dalam aplikasi; Tracking percakapan belum dibaca
  10. **Akses & Akuntabilitas** (Access & Accountability) — User & role management; Akses branch & warehouse; Menu & aksi berbasis permission; Audit log & export
  11. **Langganan & Billing** (Subscription & Billing) — Trial gratis 30 hari; Riwayat billing bulanan; Alur checkout QR atau transfer bank; Siklus pembayaran fleksibel di muka

### SECTION 4 — Connected Workflow (`#workflow`)
- **Background:** transparent.
- **Centered intro:** H2 "Alur kerja yang saling terhubung" (Connected operational workflows) + paragraph "Di banyak bisnis, satu dokumen diam-diam membuat tanggung jawab berikutnya: purchase memengaruhi stock, sales memengaruhi delivery, invoice memengaruhi piutang, dan payment memengaruhi cash."
- **Grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-5` — **5 numbered step cards**. Each: `rounded-lg border bg-white p-5 text-center shadow-sm`, with a circular numbered badge (`size-10 rounded-full bg-primary/10 text-primary`) + label:
  1. **Purchase**
  2. **Inventory**
  3. **Sales**
  4. **Invoice**
  5. **Payment**

### SECTION 5 — Screenshots (`#screenshots`)
- **Background:** `bg-foreground/[.03]` (very light gray/blue tint), `border-y`.
- **Top row (12-col grid):** left 5 cols = H2 "Lihat tampilan FaizERP" + subtitle "Beberapa tampilan yang digunakan untuk mengelola operasional sehari-hari." / right 7 cols = large dashboard image in `rounded-lg border bg-white p-3 shadow-xl` frame.
- **Bottom row:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-5` — **5 screenshot thumbnail cards**. Each card: image thumb + icon + title + small description:
  1. **Dashboard** (layout-grid icon) — "Tempat untuk melihat sales, cash, approval, low stock, dan expense secara berdekatan."
  2. **POS Sale** (monitor icon) — "Alur kasir untuk product, payment, posting, dan kontrol struk."
  3. **Team Chat** (chat icon) — "Percakapan internal bisa tetap dekat dengan workspace bisnis."
  4. **Login** (log-in icon) — "Akses sederhana untuk user dan demo account sebelum masuk aplikasi."
  5. **Register** (user-plus icon) — "Bisnis baru bisa membuat workspace dan admin pertama dari sini."
- Note: these thumbnails are **static cards**, not interactive tabs.

### SECTION 6 — Benefits (no id)
- **Background:** transparent.
- **H2:** "Operasional yang lebih mudah dikelola" (Operations that are easier to manage)
- **Subtitle:** "Data yang terhubung membantu tim mengurangi pekerjaan berulang dan menelusuri aktivitas dengan lebih mudah."
- **Layout:** left intro column + `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` of **4 benefit cards** (icon + h3 + paragraph):
  1. **Lebih sedikit pengulangan** (Less repetition) — "Sebagian data cukup dicatat sekali, lalu digunakan kembali pada alur kerja berikutnya."
  2. **Lebih mudah ditelusuri** (Easier to trace) — "Produk, stok, pelanggan, dan pemasok lebih mudah ditelusuri ketika menggunakan sumber data yang sama."
  3. **Lebih mudah dipantau** (Easier to monitor) — "Stok, penjualan, kas, piutang, dan utang dapat dipantau tanpa selalu menunggu rekap."
  4. **Dapat mengikuti pertumbuhan bisnis** (Built to support growth) — "Cabang, gudang, hak akses, dan persetujuan dapat ditambahkan saat bisnis mulai lebih terstruktur."

### SECTION 7 — Pricing (`#pricing`)
- **Background:** `bg-white`, `border-y`.
- **H2:** "Harga Sederhana" (Simple Pricing)
- **Subtitle:** "Semua paket mendapat seluruh fitur. Pilih hanya berdasarkan jumlah user aktif yang dibutuhkan bisnis." (Every plan includes every feature. Choose only by number of active users needed.)
- **Trial note:** "Gratis 30 hari untuk satu user" (30-day free trial for one user)
- **Billing-cycle note:** "Bayar bulanan atau setiap 3, 6, atau 12 bulan. Hemat 5% untuk 6 bulan dan 10% untuk 12 bulan." (Pay monthly or every 3, 6, or 12 months. Save 5% for 6 months and 10% for 12 months.)
- **Grid of 4 pricing cards.** Each card: `relative rounded-lg border bg-background p-5 shadow-sm`. The middle "Team" plan is highlighted with `border-primary ring-2 ring-primary/20` and a **"Rekomendasi" (Recommended)** badge.
  | Plan | Price | Users | CTA |
  |------|-------|-------|-----|
  | **Starter** | Rp50.000 / bulan | 1 user aktif | Buat Akun |
  | **Team** ⭐ Rekomendasi | Rp100.000 / bulan | Hingga 3 user aktif | Buat Akun |
  | **Growth** | Rp175.000 / bulan | Hingga 5 user aktif | Buat Akun |
  | **Unlimited** | Rp399.000 / bulan | Pengguna aktif tanpa batas | Buat Akun |
  - Every card body line: "Termasuk seluruh fitur FaizERP" (All ERP features included) with a check icon.
  - All CTAs link to `/register`.

### SECTION 8 — Documentation cards (no id)
- **Background:** transparent.
- **H2:** "Dokumentasi sebagai bagian dari produk" (Documentation as part of the product)
- **Subtitle:** "Panduan membantu pengguna memahami alur kerja, bukan hanya mengetahui tombol yang harus diklik." (Guides help users understand the workflow, not only which button to click.)
- **Grid:** `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` — **4 documentation cards** (each is a link, with icon + h3 + paragraph):
  1. **Getting Started** — "Setup bisnis, branch, dan warehouse."
  2. **Inventory Guide** — "Pahami kartu stock, transfer, adjustment, dan opname."
  3. **Sales Guide** — "Buat sales order, invoice, retur, dan payment."
  4. **FAQ** — "Cari jawaban untuk pertanyaan setup dan workflow umum."
- **CTA button below grid:** "Buka Dokumentasi" (Open Documentation) → `/documentation`.

### SECTION 9 — Philosophy CTA band (no id)
- **Background:** `bg-primary` (brand blue), `border-y`, **white text** (a full-width blue band breaking the white rhythm).
- **H2:** "Gunakan sistem saat bisnis membutuhkannya" (Use a system when the business needs one)
- **Paragraph:** "Spreadsheet tidak salah. Chat tidak salah. Kertas tidak salah. Setiap alat punya tahap ketika ia bekerja dengan baik. FaizERP.id dibangun untuk momen ketika operasional harian mulai meminta struktur yang lebih jelas." (Spreadsheets, chat, and paper can work well. FaizERP.id is being built for businesses that now need a clearer structure for daily operations.)

### SECTION 10 — FAQ (`#faq`)
- **Background:** transparent.
- **H2:** "Pertanyaan Umum" (Common Questions)
- **3 Q&A blocks** (each: h3 question in a `p-5` container + paragraph answer — appears always visible, no accordion disclosure triangle detected):
  1. **"Apakah FaizERP.id bisa dipakai untuk lebih dari satu warehouse?"** — "Bisa. Sistem mendukung akses branch dan warehouse agar stock bisa dikelola per lokasi."
  2. **"Apakah harga sudah termasuk semua modul?"** — "Ya. Setiap paket mencakup persediaan, pembelian, penjualan, POS, keuangan, alur persetujuan, dan transaksi tanpa batas."
  3. **"Apakah tim bisa pindah bertahap dari spreadsheet?"** — "Bisa. Mulai dari master data dan inventory, lalu tambah purchasing, sales, POS, finance, dan approval ketika workflow sudah siap."

### SECTION 11 — Final CTA (no id)
- **Background:** transparent.
- **H2:** "Jelajahi sistemnya dengan santai" (Explore the system at your own pace)
- **Paragraph:** "Mulai dari workflow yang sudah dikenal tim, lalu lihat apakah struktur yang lebih terhubung cocok dengan cara kerja Anda." (Start from the workflows your team already recognizes, then see whether a more connected structure fits the way you work.)
- **CTA button:** "Buat Akun" → `/register`.

### SECTION 12 — Footer
- **Background:** transparent (page background), `border-t border-foreground/10`, `px-5 py-8`.
- **3-column grid** (lg: 3 cols, sm: 2 cols):
  1. **Brand column:** `logo-on-light.png` (174×134) + "FaizERP Indonesia" (`text-foreground/80`)
  2. **Address column (`<address>`):**
     - Map-pin icon + "Sukamaju, Kec. Cilodong, Kota Depok, Jawa Barat 16417" (Indonesia)
     - Mail icon + `support@faizerp.id` (mailto link, hover:text-primary)
  3. **Tagline column** (right-aligned on lg): "Dibangun sambil mengamati workflow praktis di bisnis Indonesia yang sedang bertumbuh."
- **No social media icons/links. No phone number.** Only email + physical address.

---

## 5. Color Scheme & Visual Design

The site uses **Tailwind CSS v4** with **OKLCH color tokens** (CSS variables like `bg-primary`, `bg-background`, `text-foreground`, `border-foreground/10`). Computed values measured from the live DOM:

| Token / Usage | OKLCH / OKLab | Approx. HEX | Role |
|---|---|---|---|
| `bg-primary` (hero, philosophy band, header bg, accents, recommended card border) | `oklch(0.379 0.146 265.522)` | **~#2563eb** (blue-600) | **Primary brand color** |
| `text-foreground` / `text-foreground/70` (body, headings) | `oklch(0.372 0.044 257.287)` | **~#1e293b** (slate-800) | Main dark text |
| `bg-background` (page bg, card bg) | `oklch(0.984 0.003 247.858)` | **~#f8fafc** (slate-50) | Light off-white background |
| Pure white (white sections, hero CTA) | `rgb(255, 255, 255)` | `#ffffff` | Cards, primary CTA bg |
| Teal/green accent (used on some cards) | `oklch(0.508 0.118 165.612)` | **~#0d9488** (teal-600) | Secondary accent |
| Coral/red accent (used on some cards) | `oklch(0.455 0.188 13.697)` | **~#dc2626** (red-600) | Secondary accent |
| Slightly darker teal | `oklch(0.432 0.095 166.913)` | ~#0f766e (teal-700) | Hover/active teal |
| Soft mint tint bg | `oklch(0.979 0.021 166.113)` | ~#ecfdf5 | Used on a few cards |
| Soft peach tint bg | `oklch(0.969 0.015 12.422)` | ~#fef2f2 | Used on a few cards |
| Header overlay | `oklch(0.379 0.146 265.522) / 0.9` | primary blue at 90% + `backdrop-blur(8px)` | Sticky header |

### Color rhythm (section backgrounds, top → bottom)
1. Hero — **blue** (primary)
2. Problem patterns — page bg (off-white)
3. Features — **white** + border-y
4. Workflow — page bg (off-white)
5. Screenshots — **very light gray tint** (`bg-foreground/[.03]`) + border-y
6. Benefits — page bg (off-white)
7. Pricing — **white** + border-y
8. Documentation cards — page bg (off-white)
9. Philosophy CTA band — **blue** (primary) + border-y, white text
10. FAQ — page bg (off-white)
11. Final CTA — page bg (off-white)
12. Footer — page bg (off-white) + border-t

**Summary:** predominantly light/off-white with white card surfaces; blue is used twice as a full-bleed band (hero + philosophy); teal and coral are used as small category accents inside some cards. The primary CTA on the blue hero is a **white pill with blue text**; on light sections the primary CTA is a **light-bg pill with dark text and a dark border**.

---

## 6. Typography

- **Font stack (body, headings, buttons):** `system-ui, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif` (Tailwind v4 default stack). The site **loads Roboto** via Google Fonts (`Roboto:ital,wght@0,100..900;1,100..900`) as the primary intended typeface, but the CSS stack falls back through system fonts.
- **Weights available (Roboto):** 100, 300, 400, 500, 700, 900 (+ italics).
- **Heading sizes (desktop):**
  - H1 (hero): `60px`, `font-weight: 600` (semibold), white
  - H2 (section titles): `~30px` (text-3xl), `font-weight: 500` (medium), `text-foreground` (dark navy)
  - H3 (card titles): smaller, `font-semibold`
- **Body text:** `text-foreground/70` or `/80` (dark navy at 70–80% opacity), `text-sm` (14px) for descriptions, regular weight.
- **Buttons / nav:** `text-sm` (14px), `font-weight: 500` (medium).
- **Tracking:** `tracking-normal` (no exaggerated letter-spacing).
- No serif fonts anywhere — fully sans-serif, modern, utility-first aesthetic.

---

## 7. Imagery & Visual Elements

### Images (all hosted under `https://faizerp.id/images/faizerp-assets/`):
- `icon-full-color.png` (151×153) — colored icon logo used in header
- `logo-on-light.png` (174×134) — full logo for footer (on light bg)
- `dashboard-page-web.png` (1280×590) — large hero product screenshot (also used as OG/Twitter card image)
- `dashboard-page-thumb.png`, `pos-page-thumb.png`, `chat-page-thumb.png`, `login-page-thumb.png`, `register-page-thumb.png` — 5 thumbnail screenshots in the screenshots section

### Icons:
- **Lucide icon library** (loaded as `lucide.js`; `<svg class="lucide lucide-…">`), 1.5px stroke, 24×24 viewBox, rendered at `size-4` (16px). Examples: `settings`, `sun-moon`, `moon-star`, `log-in`, `map-pin`, `mail`, `layout-grid`, chat, calculator/monitor, user-plus.
- Each feature/benefit card and each pricing row uses a Lucide icon.

### Textures / decoration:
- **Noise texture PNG** (`/build/assets/noise-DXj6jQv6.png`) overlaid on the blue hero section (`bg-primary bg-noise`) for a subtle grain.
- Cards use soft shadows (`shadow-sm`, `shadow-xl` on the large screenshot) and `rounded-lg` (8px radius) borders (`border border-foreground/10`).
- Buttons use `rounded-lg` (8px), `h-10 px-4 py-2`, with focus rings (`focus-visible:ring-2 focus-visible:ring-ring`).

### Logo style:
- "FaizERP.id" wordmark with a small colored icon mark. On the blue hero, the icon is the full-color version; in the footer (on light) it's `logo-on-light.png`.

---

## 8. Interactive Elements

1. **Sticky header** — `position: sticky; top: 0; z-index: 30`, with `backdrop-filter: blur(8px)` and blue/90 background. Stays at top during scroll.
2. **Mobile nav** — horizontally scrollable row (`overflow-x-auto`) appearing under the header below `lg` breakpoint.
3. **Language switcher** — "English" / "Indonesia" link → `/locale/en` or `/locale/id`, which sets the locale and redirects back (full content is translated).
4. **Theme switcher (Appearance modal)** — a small **fixed tab on the right screen edge** (`fixed inset-y-0 right-0 z-50 my-auto w-14 hover:w-20 h-12 cursor-pointer`) opens a centered modal titled **"Appearance — Choose your appearance"** with three selectable cards: **System**, **Light** (`data-dark-mode="inactive"`), **Dark** (`data-dark-mode="active"`). Cards have `hover:scale-[110%]` zoom animation. The `data-theme` attribute on `<html>` controls the theme (current: `default`).
5. **Page loader** — a full-screen `bg-background fixed inset-0 z-[100]` overlay with fade-out transition, shown on initial load (`page-loader.js`).
6. **Hover states** — nav links `hover:text-white`; email link `hover:text-primary`; buttons change bg on hover (`hover:bg-white/90`, `hover:bg-(--color)/5`).
7. **Focus rings** — `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` on all buttons/links.
8. **Smooth anchor scrolling** — nav links (`#features`, `#pricing`, `#faq`, `#screenshots`) jump to in-page sections.
9. **FAQ** — 3 static Q&A blocks (no JS accordion; question and answer both always rendered in a `p-5` block).
10. **Documentation page** — collapsible sidebar disclosure groups (`DisclosureTriangle`), breadcrumb, and a right-side "On This Page" anchor nav.

> No carousels, sliders, tabs, modals (other than the appearance one), video, iframes, or forms on the marketing homepage. The only forms are on `/login` and `/register`.

### Auth forms
- **Login (`/login`):** Email + Password fields (required), "Login" button, links: "Lupa Password?" (Forgot Password), "Kirim ulang email verifikasi" (Resend verification email), "Register" link, footer links "Syarat dan Ketentuan" (Terms) + "Kebijakan Privasi" (Privacy Policy). Language toggle (Indonesia | English). H2 "Login".
- **Register (`/register`):** Nama Bisnis (Business Name) + Nama Anda (Your Name) + Email + Password + Konfirmasi Password (all required), "Register" button, "Login" link, Terms + Privacy links, language toggle. H2 "Register".

---

## 9. Call-to-Action Buttons (placement summary)

| # | Label (ID / EN) | Location | Style | Target |
|---|---|---|---|---|
| 1 | **Buat Akun** / Create an Account | Hero (primary) | White pill, blue text + icon | `/register` |
| 2 | **Lihat Tampilan** / Explore the Product | Hero (secondary) | Translucent white pill, white text + icon | `#screenshots` |
| 3 | **Login** | Header (always visible) | White pill, blue text + icon | `/login` |
| 4 | **Buat Akun** ×4 | Inside each of the 4 pricing cards | Light pill, dark text + border | `/register` |
| 5 | **Buka Dokumentasi** / Open Documentation | After documentation cards | Light pill, dark text + border | `/documentation` |
| 6 | **Buat Akun** | Final CTA section | Light pill, dark text + border | `/register` |
| 7 | Each documentation card (Getting Started, Inventory Guide, Sales Guide, FAQ) | Documentation section | Whole card is a link | `/documentation#…` |

> The dominant, repeated CTA across the site is **"Buat Akun" (Create an Account)** → `/register`. Secondary CTA is **"Login"** → `/login`. Documentation CTAs route to `/documentation`.

---

## 10. Special / Unique Design Elements

1. **Noise-textured blue hero** — full-bleed brand-blue hero with a subtle grain PNG overlay and a sticky blue header with backdrop-blur that visually merges into the hero. Gives a "designed product" feel rather than a flat color block.
2. **Alternating section rhythm** — light off-white → white + border → light tint → white + border → **blue band** (philosophy) → light → light. The single blue band in the middle visually re-anchors the brand color without overusing it.
3. **Numbered workflow chain** — 5-step Purchase→Inventory→Sales→Invoice→Payment visualized as connected cards with circular numbered badges in primary blue.
4. **"Recommended" pricing highlight** — the Team plan stands out with `border-primary ring-2 ring-primary/20` and a small "Rekomendasi" badge.
5. **Floating right-edge theme tab** — an unusual UX: a thin vertical tab pinned to the right screen edge that expands on hover and opens an Appearance modal (System/Light/Dark). This is a distinctive, somewhat unconventional theme switcher pattern.
6. **Page loader overlay** — a brief branded loading screen on first load (fade-out transition).
7. **Bilingual content** — fully translated Indonesian ⇄ English via `/locale/*` routes (every headline, subtitle, card, FAQ, footer string has an exact English counterpart).
8. **Tailwind v4 + OKLCH tokens** — modern utility-first build with perceptually-uniform OKLCH color tokens (`bg-primary`, `bg-background`, `text-foreground`, `border-foreground/10`, `bg-noise`) — a contemporary, maintainable design system.
9. **Underlying stack:** Laravel (CSRF token meta, `/build/assets/` Vite-built CSS/JS), Vite build, Lucide icons, Roboto from Google Fonts, Google Analytics (G-S8V04LF964). JS chunks: `dom`, `modal`, `lucide`, `page-loader`, `theme-switcher`, `app`.

---

## 11. Contact Information & Social

- **Email:** support@faizerp.id (mailto link in footer)
- **Address:** Sukamaju, Kec. Cilodong, Kota Depok, Jawa Barat 16417, Indonesia
- **Phone:** none listed
- **Social media:** none listed (no social icons/links in footer or header)
- **Legal links (on auth pages only):** Syarat dan Ketentuan (Terms), Kebijakan Privasi (Privacy Policy)

---

## 12. SEO / Meta Summary

- **Title (ID):** "ERP untuk UMKM Indonesia | FaizERP"
- **Title (EN):** "ERP for Indonesian SMEs | FaizERP"
- **Description:** "FaizERP membantu UMKM mengelola stock, pembelian, penjualan, POS, finance, approval, dan laporan dalam satu sistem sederhana…"
- **Author:** FaizERP.id
- **Robots:** index,follow
- **lang attribute:** `id` (Indonesian); switches to `en` in English mode
- **Open Graph + Twitter Card:** present (og:title, og:description, og:image = dashboard-page-web.png, og:url, og:type=website, og:site_name=FaizERP.id; twitter:card=summary_large_image)
- **Analytics:** Google Analytics `G-S8V04LF964`
- **CSRF:** Laravel csrf-token meta present (for auth form POSTs)

---

## 13. Recreation Notes (for rebuilding)

To faithfully recreate this site you will need:

1. **Layout shell:** sticky blue header (blur) on top of a blue hero, then alternating light/white/tint sections inside a `max-w-7xl` centered container, all sections padded `px-5 py-16 sm:px-8`.
2. **Color tokens (define as CSS variables / Tailwind v4 theme):** primary blue `oklch(0.379 0.146 265.522)` (~#2563eb), foreground `oklch(0.372 0.044 257.287)` (~#1e293b), background `oklch(0.984 0.003 247.858)` (~#f8fafc), plus teal `oklch(0.508 0.118 165.612)` and coral `oklch(0.455 0.188 13.697)` as card accents.
3. **Fonts:** Roboto (Google Fonts, weights 100–900) with the system-ui sans-serif fallback stack. Headings: medium/semibold (500–600). Body: regular, 14px, foreground at 70% opacity.
4. **Icons:** Lucide icon set, 1.5px stroke, 16px (`size-4`).
5. **Hero assets:** colored icon logo + large dashboard screenshot + a noise PNG texture overlay.
6. **Components:** rounded-lg cards (8px) with `border border-foreground/10`, `bg-background`, `shadow-sm`; pill buttons `rounded-lg h-10 px-4 py-2` with focus rings; a 5-step numbered workflow; a 4-plan pricing grid with one highlighted (ring-2) plan; a 5-card screenshot grid; a 3-card FAQ; a 3-column footer.
7. **Interactivity:** sticky header, mobile horizontal-scroll nav, language toggle (ID/EN), right-edge theme tab → Appearance modal (System/Light/Dark), page-load overlay.
8. **Bilingual content:** maintain full ID + EN string tables (all hero/benefit/feature/FAQ/footer strings are translated).
9. **Pages:** single homepage (with 6 anchor sections) + `/documentation` (3-col docs layout with collapsible sidebar + on-this-page nav) + `/login` + `/register`.

---

*End of report. All raw data (homepage snapshot, English snapshot, documentation snapshot, login/register snapshots, color survey, button survey, image list, tech stack, interactive element inventory) is saved alongside this report in `/home/z/faizerp_analysis/`. Full-page screenshots are in `/home/z/faizerp_analysis/screenshots/`.*
