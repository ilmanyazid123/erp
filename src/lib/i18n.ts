// Bilingual string table for FaizERP.id (Indonesian default + English)
// Mirrors the original site content.

export type Lang = "id" | "en";

export type Dict = typeof strings.id;

export const strings = {
  id: {
    htmlLang: "id",
    title: "ERP untuk UMKM Indonesia | FaizERP",
    description:
      "FaizERP membantu UMKM mengelola stock, pembelian, penjualan, POS, finance, approval, dan laporan dalam satu sistem sederhana.",
    nav: {
      features: "Fitur",
      documentation: "Dokumentasi",
      pricing: "Harga",
      faq: "FAQ",
      login: "Login",
      languageLabel: "English",
    },
    hero: {
      badge: "Sistem untuk operasional bisnis sehari-hari",
      title: "Operasional Bisnis dalam Satu Sistem",
      subtitle:
        "Kelola persediaan, pembelian, penjualan, POS, keuangan, persetujuan, dan laporan dalam satu tempat.",
      ctaPrimary: "Buat Akun",
      ctaSecondary: "Lihat Tampilan",
      microLabel1: "Persediaan",
      microDesc1: "Saldo stok, kartu stok, transfer, dan opname",
      microLabel2: "Operasional",
      microDesc2: "Pembelian, penjualan, invoice, dan pembayaran",
      microLabel3: "Kontrol",
      microDesc3: "Persetujuan, hak akses, laporan, dan audit trail",
      dashboardAlt: "Tampilan dashboard FaizERP.id",
    },
    problems: {
      title: "Beberapa pola yang sering terlihat",
      subtitle:
        "Spreadsheet, kertas, dan chat itu berguna. Momen yang menarik muncul ketika bisnis mulai cukup kompleks sehingga terlalu banyak konteks harus diingat oleh tim.",
      items: [
        {
          title: "Banyak file terpisah",
          desc: "Data produk, stok, harga, dan laporan sering dimulai dari file sederhana, lalu perlahan tersebar ke banyak orang.",
        },
        {
          title: "Persetujuan di percakapan",
          desc: "Keputusan pembelian dan diskon sering terjadi di chat, tetapi alasannya mudah hilang ketika ingin diperiksa kembali.",
        },
        {
          title: "Perubahan stok sulit ditelusuri",
          desc: "Saat stok berubah, tim perlu mengetahui bukan hanya jumlahnya, tetapi juga alasan perubahannya.",
        },
        {
          title: "Laporan membutuhkan waktu",
          desc: "Pemilik usaha sering harus menunggu data operasional dirapikan sebelum dapat mengambil keputusan berikutnya.",
        },
      ],
    },
    features: {
      title: "Sistem yang sedang kami bangun",
      subtitle:
        "FaizERP.id menghubungkan penjualan, pembelian, persediaan, keuangan, POS, dan persetujuan menggunakan data bisnis, cabang, gudang, pelanggan, pemasok, dan produk yang sama.",
      items: [
        {
          title: "Bisnis & Master Data",
          points: [
            "Bisnis/branch/warehouse",
            "Product/kategori/brand/unit",
            "Customer & supplier",
            "Harga & konversi product",
          ],
        },
        {
          title: "Inventory",
          points: [
            "Opening stock & adjustment",
            "Stock balance & kartu stock",
            "Stock transfer",
            "Stock opname",
          ],
        },
        {
          title: "Purchasing",
          points: [
            "Purchase order",
            "Goods receipt",
            "Supplier invoice",
            "Supplier payment",
          ],
        },
        {
          title: "Sales",
          points: [
            "Sales order & delivery order",
            "Customer invoice & payment",
            "Sales return",
            "Monitoring receivable",
          ],
        },
        {
          title: "Point of Sale",
          points: [
            "Cashier shift",
            "Penjualan counter & payment",
            "Posting & receipt",
            "Kontrol void & cancellation",
          ],
        },
        {
          title: "Cash & Finance",
          points: [
            "Cash & bank account",
            "Cash in & cash out",
            "Transfer antar-account",
            "Expense request & payment",
          ],
        },
        {
          title: "Approval Workflow",
          points: [
            "Workflow approval yang dapat diatur",
            "Approval inbox",
            "Approve, reject, & cancel",
            "Catatan keputusan & notes",
          ],
        },
        {
          title: "Dashboard & Report",
          points: [
            "Dashboard bisnis",
            "Stock movement report",
            "Aging receivable & payable",
            "Profit & POS report",
          ],
        },
        {
          title: "Kolaborasi Tim",
          points: [
            "Chat internal bisnis",
            "Attachment percakapan",
            "Notifikasi dalam aplikasi",
            "Tracking percakapan belum dibaca",
          ],
        },
        {
          title: "Akses & Akuntabilitas",
          points: [
            "User & role management",
            "Akses branch & warehouse",
            "Menu & aksi berbasis permission",
            "Audit log & export",
          ],
        },
        {
          title: "Langganan & Billing",
          points: [
            "Trial gratis 30 hari",
            "Riwayat billing bulanan",
            "Alur checkout QR atau transfer bank",
            "Siklus pembayaran fleksibel di muka",
          ],
        },
      ],
    },
    workflow: {
      title: "Alur kerja yang saling terhubung",
      subtitle:
        "Di banyak bisnis, satu dokumen diam-diam membuat tanggung jawab berikutnya: purchase memengaruhi stock, sales memengaruhi delivery, invoice memengaruhi piutang, dan payment memengaruhi cash.",
      steps: ["Purchase", "Inventory", "Sales", "Invoice", "Payment"],
    },
    screenshots: {
      title: "Lihat tampilan FaizERP",
      subtitle:
        "Beberapa tampilan yang digunakan untuk mengelola operasional sehari-hari.",
      cards: [
        {
          title: "Dashboard",
          desc: "Tempat untuk melihat sales, cash, approval, low stock, dan expense secara berdekatan.",
        },
        {
          title: "POS Sale",
          desc: "Alur kasir untuk product, payment, posting, dan kontrol struk.",
        },
        {
          title: "Team Chat",
          desc: "Percakapan internal bisa tetap dekat dengan workspace bisnis.",
        },
        {
          title: "Login",
          desc: "Akses sederhana untuk user dan demo account sebelum masuk aplikasi.",
        },
        {
          title: "Register",
          desc: "Bisnis baru bisa membuat workspace dan admin pertama dari sini.",
        },
      ],
    },
    benefits: {
      title: "Operasional yang lebih mudah dikelola",
      subtitle:
        "Data yang terhubung membantu tim mengurangi pekerjaan berulang dan menelusuri aktivitas dengan lebih mudah.",
      items: [
        {
          title: "Lebih sedikit pengulangan",
          desc: "Sebagian data cukup dicatat sekali, lalu digunakan kembali pada alur kerja berikutnya.",
        },
        {
          title: "Lebih mudah ditelusuri",
          desc: "Produk, stok, pelanggan, dan pemasok lebih mudah ditelusuri ketika menggunakan sumber data yang sama.",
        },
        {
          title: "Lebih mudah dipantau",
          desc: "Stok, penjualan, kas, piutang, dan utang dapat dipantau tanpa selalu menunggu rekap.",
        },
        {
          title: "Dapat mengikuti pertumbuhan bisnis",
          desc: "Cabang, gudang, hak akses, dan persetujuan dapat ditambahkan saat bisnis mulai lebih terstruktur.",
        },
      ],
    },
    pricing: {
      title: "Harga Sederhana",
      subtitle:
        "Semua paket mendapat seluruh fitur. Pilih hanya berdasarkan jumlah user aktif yang dibutuhkan bisnis.",
      trialNote: "Gratis 30 hari untuk satu user",
      billingNote:
        "Bayar bulanan atau setiap 3, 6, atau 12 bulan. Hemat 5% untuk 6 bulan dan 10% untuk 12 bulan.",
      perMonth: "/ bulan",
      includesAll: "Termasuk seluruh fitur FaizERP",
      recommended: "Rekomendasi",
      cta: "Buat Akun",
      plans: [
        { name: "Starter", price: "Rp50.000", users: "1 user aktif" },
        { name: "Team", price: "Rp100.000", users: "Hingga 3 user aktif", recommended: true },
        { name: "Growth", price: "Rp175.000", users: "Hingga 5 user aktif" },
        { name: "Unlimited", price: "Rp399.000", users: "Pengguna aktif tanpa batas" },
      ],
    },
    docs: {
      title: "Dokumentasi sebagai bagian dari produk",
      subtitle:
        "Panduan membantu pengguna memahami alur kerja, bukan hanya mengetahui tombol yang harus diklik.",
      cards: [
        { title: "Getting Started", desc: "Setup bisnis, branch, dan warehouse." },
        { title: "Inventory Guide", desc: "Pahami kartu stock, transfer, adjustment, dan opname." },
        { title: "Sales Guide", desc: "Buat sales order, invoice, retur, dan payment." },
        { title: "FAQ", desc: "Cari jawaban untuk pertanyaan setup dan workflow umum." },
      ],
      cta: "Buka Dokumentasi",
    },
    philosophy: {
      title: "Gunakan sistem saat bisnis membutuhkannya",
      body:
        "Spreadsheet tidak salah. Chat tidak salah. Kertas tidak salah. Setiap alat punya tahap ketika ia bekerja dengan baik. FaizERP.id dibangun untuk momen ketika operasional harian mulai meminta struktur yang lebih jelas.",
    },
    faq: {
      title: "Pertanyaan Umum",
      items: [
        {
          q: "Apakah FaizERP.id bisa dipakai untuk lebih dari satu warehouse?",
          a: "Bisa. Sistem mendukung akses branch dan warehouse agar stock bisa dikelola per lokasi.",
        },
        {
          q: "Apakah harga sudah termasuk semua modul?",
          a: "Ya. Setiap paket mencakup persediaan, pembelian, penjualan, POS, keuangan, alur persetujuan, dan transaksi tanpa batas.",
        },
        {
          q: "Apakah tim bisa pindah bertahap dari spreadsheet?",
          a: "Bisa. Mulai dari master data dan inventory, lalu tambah purchasing, sales, POS, finance, dan approval ketika workflow sudah siap.",
        },
      ],
    },
    finalCta: {
      title: "Jelajahi sistemnya dengan santai",
      body:
        "Mulai dari workflow yang sudah dikenal tim, lalu lihat apakah struktur yang lebih terhubung cocok dengan cara kerja Anda.",
      cta: "Buat Akun",
    },
    footer: {
      brandLabel: "FaizERP Indonesia",
      address: "Sukamaju, Kec. Cilodong, Kota Depok, Jawa Barat 16417",
      email: "support@faizerp.id",
      philosophy:
        "Dibangun sambil mengamati workflow praktis di bisnis Indonesia yang sedang bertumbuh.",
    },
    auth: {
      loginTitle: "Login",
      loginEmail: "Email",
      loginPassword: "Password",
      loginSubmit: "Login",
      forgotPassword: "Lupa Password?",
      resendVerification: "Kirim ulang email verifikasi",
      registerLink: "Register",
      registerTitle: "Register",
      registerBusinessName: "Nama Bisnis",
      registerYourName: "Nama Anda",
      registerEmail: "Email",
      registerPassword: "Password",
      registerConfirm: "Konfirmasi Password",
      registerSubmit: "Register",
      loginLink: "Login",
      terms: "Syarat dan Ketentuan",
      privacy: "Kebijakan Privasi",
      or: "atau",
    },
    appearance: {
      title: "Appearance",
      subtitle: "Choose your appearance",
      system: "System",
      light: "Light",
      dark: "Dark",
    },
  },

  en: {
    htmlLang: "en",
    title: "ERP for Indonesian SMEs | FaizERP",
    description:
      "FaizERP helps Indonesian SMEs manage stock, purchasing, sales, POS, finance, approvals, and reporting in one simple system.",
    nav: {
      features: "Features",
      documentation: "Documentation",
      pricing: "Pricing",
      faq: "FAQ",
      login: "Login",
      languageLabel: "Indonesia",
    },
    hero: {
      badge: "A system for everyday business operations",
      title: "Business Operations in One System",
      subtitle:
        "Manage inventory, purchasing, sales, POS, finance, approvals, and reporting in one place.",
      ctaPrimary: "Create an Account",
      ctaSecondary: "Explore the Product",
      microLabel1: "Inventory",
      microDesc1: "Stock balance, stock card, transfer, and stock opname",
      microLabel2: "Operations",
      microDesc2: "Purchasing, sales, invoice, and payment",
      microLabel3: "Control",
      microDesc3: "Approvals, access rights, reporting, and audit trail",
      dashboardAlt: "FaizERP.id dashboard view",
    },
    problems: {
      title: "A few patterns we keep noticing",
      subtitle:
        "Spreadsheets, paper, and chat are useful. The interesting moment comes when a business becomes complex enough that too much context must be remembered by the team.",
      items: [
        {
          title: "Many separate files",
          desc: "Product, stock, price, and report data often starts from a simple file, then slowly spreads across many people.",
        },
        {
          title: "Approvals inside conversations",
          desc: "Purchase and discount decisions often happen in chat, but the reasoning is easy to lose when you want to review them later.",
        },
        {
          title: "Stock changes are hard to trace",
          desc: "When stock changes, the team needs to know not only the quantity, but also the reason for the change.",
        },
        {
          title: "Reports take time",
          desc: "Business owners often have to wait for operational data to be tidied up before making the next decision.",
        },
      ],
    },
    features: {
      title: "The system we are building",
      subtitle:
        "FaizERP.id connects sales, purchasing, inventory, finance, POS, and approvals using the same business, branch, warehouse, customer, supplier, and product data.",
      items: [
        {
          title: "Business & Master Data",
          points: [
            "Business/branch/warehouse",
            "Product/category/brand/unit",
            "Customer & supplier",
            "Price & product conversion",
          ],
        },
        {
          title: "Inventory",
          points: [
            "Opening stock & adjustment",
            "Stock balance & stock card",
            "Stock transfer",
            "Stock opname",
          ],
        },
        {
          title: "Purchasing",
          points: [
            "Purchase order",
            "Goods receipt",
            "Supplier invoice",
            "Supplier payment",
          ],
        },
        {
          title: "Sales",
          points: [
            "Sales order & delivery order",
            "Customer invoice & payment",
            "Sales return",
            "Receivable monitoring",
          ],
        },
        {
          title: "Point of Sale",
          points: [
            "Cashier shift",
            "Counter sales & payment",
            "Posting & receipt",
            "Void & cancellation control",
          ],
        },
        {
          title: "Cash & Finance",
          points: [
            "Cash & bank account",
            "Cash in & cash out",
            "Transfer between accounts",
            "Expense request & payment",
          ],
        },
        {
          title: "Approval Workflow",
          points: [
            "Configurable approval workflow",
            "Approval inbox",
            "Approve, reject, & cancel",
            "Decision notes & comments",
          ],
        },
        {
          title: "Dashboard & Report",
          points: [
            "Business dashboard",
            "Stock movement report",
            "Aging receivable & payable",
            "Profit & POS report",
          ],
        },
        {
          title: "Team Collaboration",
          points: [
            "Internal business chat",
            "Conversation attachments",
            "In-app notifications",
            "Unread conversation tracking",
          ],
        },
        {
          title: "Access & Accountability",
          points: [
            "User & role management",
            "Branch & warehouse access",
            "Permission-based menu & actions",
            "Audit log & export",
          ],
        },
        {
          title: "Subscription & Billing",
          points: [
            "30-day free trial",
            "Monthly billing history",
            "QR or bank transfer checkout flow",
            "Flexible upfront payment cycle",
          ],
        },
      ],
    },
    workflow: {
      title: "Connected operational workflows",
      subtitle:
        "In many businesses, one document quietly creates the next responsibility: purchase affects stock, sales affects delivery, invoice affects receivable, and payment affects cash.",
      steps: ["Purchase", "Inventory", "Sales", "Invoice", "Payment"],
    },
    screenshots: {
      title: "See FaizERP in action",
      subtitle: "Several views used to manage day-to-day operations.",
      cards: [
        {
          title: "Dashboard",
          desc: "A place to see sales, cash, approvals, low stock, and expenses side by side.",
        },
        {
          title: "POS Sale",
          desc: "Cashier flow for product, payment, posting, and receipt control.",
        },
        {
          title: "Team Chat",
          desc: "Internal conversations stay close to the business workspace.",
        },
        {
          title: "Login",
          desc: "Simple access for users and demo accounts before entering the app.",
        },
        {
          title: "Register",
          desc: "New businesses can create a workspace and the first admin from here.",
        },
      ],
    },
    benefits: {
      title: "Operations that are easier to manage",
      subtitle:
        "Connected data helps teams reduce repetitive work and trace activities more easily.",
      items: [
        {
          title: "Less repetition",
          desc: "Some data only needs to be recorded once, then reused in the next workflow.",
        },
        {
          title: "Easier to trace",
          desc: "Products, stock, customers, and suppliers are easier to trace when using the same data source.",
        },
        {
          title: "Easier to monitor",
          desc: "Stock, sales, cash, receivables, and payables can be monitored without always waiting for a recap.",
        },
        {
          title: "Built to support growth",
          desc: "Branches, warehouses, access rights, and approvals can be added as the business becomes more structured.",
        },
      ],
    },
    pricing: {
      title: "Simple Pricing",
      subtitle:
        "Every plan includes every feature. Choose only by the number of active users the business needs.",
      trialNote: "30-day free trial for one user",
      billingNote:
        "Pay monthly or every 3, 6, or 12 months. Save 5% for 6 months and 10% for 12 months.",
      perMonth: "/ month",
      includesAll: "Includes all FaizERP features",
      recommended: "Recommended",
      cta: "Create an Account",
      plans: [
        { name: "Starter", price: "Rp50,000", users: "1 active user" },
        { name: "Team", price: "Rp100,000", users: "Up to 3 active users", recommended: true },
        { name: "Growth", price: "Rp175,000", users: "Up to 5 active users" },
        { name: "Unlimited", price: "Rp399,000", users: "Unlimited active users" },
      ],
    },
    docs: {
      title: "Documentation as part of the product",
      subtitle:
        "Guides help users understand the workflow, not just which button to click.",
      cards: [
        { title: "Getting Started", desc: "Setup business, branch, and warehouse." },
        { title: "Inventory Guide", desc: "Understand stock card, transfer, adjustment, and opname." },
        { title: "Sales Guide", desc: "Create sales order, invoice, return, and payment." },
        { title: "FAQ", desc: "Find answers for common setup and workflow questions." },
      ],
      cta: "Open Documentation",
    },
    philosophy: {
      title: "Use a system when the business needs one",
      body:
        "Spreadsheets are not wrong. Chat is not wrong. Paper is not wrong. Every tool has a stage where it works well. FaizERP.id is being built for the moment when daily operations start asking for a clearer structure.",
    },
    faq: {
      title: "Common Questions",
      items: [
        {
          q: "Can FaizERP.id be used for more than one warehouse?",
          a: "Yes. The system supports branch and warehouse access so stock can be managed per location.",
        },
        {
          q: "Does the price include all modules?",
          a: "Yes. Every plan includes inventory, purchasing, sales, POS, finance, approval workflows, and unlimited transactions.",
        },
        {
          q: "Can a team migrate gradually from a spreadsheet?",
          a: "Yes. Start with master data and inventory, then add purchasing, sales, POS, finance, and approvals when the workflow is ready.",
        },
      ],
    },
    finalCta: {
      title: "Explore the system at your own pace",
      body:
        "Start from the workflows your team already recognizes, then see whether a more connected structure fits the way you work.",
      cta: "Create an Account",
    },
    footer: {
      brandLabel: "FaizERP Indonesia",
      address: "Sukamaju, Kec. Cilodong, Kota Depok, West Java 16417",
      email: "support@faizerp.id",
      philosophy:
        "Built while observing practical workflows in growing Indonesian businesses.",
    },
    auth: {
      loginTitle: "Login",
      loginEmail: "Email",
      loginPassword: "Password",
      loginSubmit: "Login",
      forgotPassword: "Forgot Password?",
      resendVerification: "Resend verification email",
      registerLink: "Register",
      registerTitle: "Register",
      registerBusinessName: "Business Name",
      registerYourName: "Your Name",
      registerEmail: "Email",
      registerPassword: "Password",
      registerConfirm: "Confirm Password",
      registerSubmit: "Register",
      loginLink: "Login",
      terms: "Terms & Conditions",
      privacy: "Privacy Policy",
      or: "or",
    },
    appearance: {
      title: "Appearance",
      subtitle: "Choose your appearance",
      system: "System",
      light: "Light",
      dark: "Dark",
    },
  },
} as const;

export type StringKey = keyof Dict;
