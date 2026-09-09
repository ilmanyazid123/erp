import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from "@/components/providers";
import { ThemeProvider } from "next-themes";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Managemen Tokoku — ERP untuk UMKM Indonesia",
  description:
    "Managemen Tokoku membantu UMKM mengelola stok, pembelian, penjualan, POS, keuangan, persetujuan, dan laporan dalam satu sistem sederhana.",
  keywords: [
    "Managemen Tokoku",
    "ERP",
    "UMKM",
    "ERP Indonesia",
    "inventory",
    "POS",
    "purchasing",
    "sales",
    "finance",
  ],
  authors: [{ name: "Managemen Tokoku" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Managemen Tokoku — ERP untuk UMKM Indonesia",
    description:
      "Managemen Tokoku membantu UMKM mengelola stok, pembelian, penjualan, POS, keuangan, persetujuan, dan laporan dalam satu sistem sederhana.",
    url: "https://erp-puce-two.vercel.app",
    siteName: "Managemen Tokoku",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Managemen Tokoku — ERP untuk UMKM Indonesia",
    description:
      "Managemen Tokoku membantu UMKM mengelola stok, pembelian, penjualan, POS, keuangan, persetujuan, dan laporan dalam satu sistem sederhana.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${roboto.variable} antialiased bg-background text-foreground font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AppProviders>
            {children}
            <Toaster />
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
