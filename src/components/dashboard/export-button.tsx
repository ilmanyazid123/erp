"use client";

// ExportButton: dropdown to share the current page's data as an Excel
// workbook, a CSV file, or a TSV copy-paste straight into Google Sheets.

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Table2, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ghostBtnCls } from "@/components/dashboard/ui";

export function ExportButton({
  entity,
  label = "Ekspor Data",
}: {
  entity: string; // invoices | payments | sales | purchases | products | inventory | customers | suppliers
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function download(format: "xlsx" | "csv") {
    setBusy(true);
    try {
      const res = await fetch(`/api/export/${entity}?format=${format}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${entity}-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  async function copyForSheets() {
    setBusy(true);
    try {
      const res = await fetch(`/api/export/${entity}?format=tsv`);
      if (!res.ok) throw new Error();
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked — fall back to a CSV download.
      await download("csv");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={ghostBtnCls} disabled={busy}>
          <Download className="h-4 w-4" />
          {busy ? "Menyiapkan..." : label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Bagikan data ke</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => download("xlsx")}>
          <FileSpreadsheet className="h-4 w-4" />
          <span className="flex-1">Excel (.xlsx)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => download("csv")}>
          <FileText className="h-4 w-4" />
          <span className="flex-1">File CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyForSheets}>
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Table2 className="h-4 w-4" />}
          <span className="flex-1">
            {copied ? "Tersalin! Tempel di Google Sheets" : "Salin untuk Google Sheets"}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <p className="px-2 pb-1.5 text-[11px] leading-snug text-foreground/50">
          CSV: unggah via File → Import di Google Sheets. Salin: tempel langsung
          ke sel A1 lalu data otomatis terpisah per kolom.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
