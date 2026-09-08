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
  title: "ERP untuk UMKM Indonesia | FaizERP",
  description:
    "FaizERP membantu UMKM mengelola stock, pembelian, penjualan, POS, finance, approval, dan laporan dalam satu sistem sederhana.",
  keywords: [
    "FaizERP",
    "ERP",
    "UMKM",
    "ERP Indonesia",
    "inventory",
    "POS",
    "purchasing",
    "sales",
    "finance",
  ],
  authors: [{ name: "FaizERP.id" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: "ERP untuk UMKM Indonesia | FaizERP",
    description:
      "FaizERP membantu UMKM mengelola stock, pembelian, penjualan, POS, finance, approval, dan laporan dalam satu sistem sederhana.",
    url: "https://faizerp.id",
    siteName: "FaizERP.id",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ERP untuk UMKM Indonesia | FaizERP",
    description:
      "FaizERP membantu UMKM mengelola stock, pembelian, penjualan, POS, finance, approval, dan laporan dalam satu sistem sederhana.",
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
