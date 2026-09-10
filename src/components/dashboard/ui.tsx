"use client";

// Small shared building blocks for dashboard pages.

import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function fmtRp(n: number | null | undefined): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n ?? 0));
}

export function fmtDate(s: string | Date | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateTime(s: string | Date | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<string, string> = {
  // orders / generic
  DRAFT: "bg-foreground/10 text-foreground/70",
  SUBMITTED: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-sky-100 text-sky-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  RECEIVED: "bg-emerald-100 text-emerald-700",
  INVOICED: "bg-violet-100 text-violet-700",
  CANCELLED: "bg-red-100 text-red-600",
  REJECTED: "bg-red-100 text-red-600",
  // invoices
  UNPAID: "bg-red-100 text-red-600",
  PARTIAL: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  // subscription
  TRIAL: "bg-sky-100 text-sky-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAST_DUE: "bg-amber-100 text-amber-700",
  // approvals
  PENDING: "bg-amber-100 text-amber-700",
  // roles
  OWNER: "bg-primary/10 text-primary",
  ADMIN: "bg-violet-100 text-violet-700",
  MANAGER: "bg-sky-100 text-sky-700",
  MEMBER: "bg-foreground/10 text-foreground/70",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  if (!status) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        STATUS_STYLES[status] ?? "bg-foreground/10 text-foreground/70",
        className,
      )}
    >
      {status}
    </span>
  );
}

export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-foreground/60">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function Loading({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-20 text-sm text-foreground/60">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-foreground/15 py-16 text-center">
      <p className="text-sm font-medium text-foreground/70">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-xs text-foreground/50">{description}</p>
      ) : null}
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-[color:var(--coral)]/30 bg-[color:var(--coral)]/5 px-3 py-2 text-sm text-[color:var(--coral)]"
    >
      {message}
    </div>
  );
}

// Thin wrapper around shadcn Dialog for form dialogs.
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("max-h-[90vh] overflow-y-auto", wide ? "sm:max-w-2xl" : "sm:max-w-md")}
        // The camera scanner renders in its own body-level portal (so it can
        // escape Radix's inert background). Without this guard Radix treats
        // every tap inside the scanner as "interact outside" and closes the
        // hosting form dialog behind the user's back.
        onInteractOutside={(e) => {
          const t = e.target as HTMLElement | null;
          if (t?.closest?.("[data-scanner-overlay]")) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}

export const inputCls =
  "h-10 w-full rounded-lg border border-foreground/15 bg-background px-3 text-sm shadow-sm transition-colors placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40";

export const labelCls = "text-sm font-medium text-foreground/80";

export const primaryBtnCls =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60";

export const ghostBtnCls =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-foreground/15 bg-background px-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-foreground/5";
