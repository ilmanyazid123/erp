"use client";

import { useEffect, useState } from "react";
import { X, LogIn, UserPlus, Loader2 } from "lucide-react";
import { useLang, useAuthModal } from "@/components/providers";
import { FaizLogo } from "@/components/faiz-logo";

export function AuthDialog() {
  const { modal, close, open } = useAuthModal();
  const { t, lang, toggleLang } = useLang();
  const [submitting, setSubmitting] = useState(false);

  // Lock scroll while modal is open.
  useEffect(() => {
    if (modal) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [modal]);

  // Close on Escape
  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, close]);

  if (!modal) return null;
  const isRegister = modal === "register";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isRegister ? t.auth.registerTitle : t.auth.loginTitle}
        className="relative w-full max-w-md rounded-xl border border-foreground/10 bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <FaizLogo className="h-10 w-10" />
          <h2 className="mt-3 text-2xl font-semibold">
            {isRegister ? t.auth.registerTitle : t.auth.loginTitle}
          </h2>
        </div>

        <form
          className="mt-6 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            // Demo only — no real backend.
            setTimeout(() => {
              setSubmitting(false);
              close();
            }, 900);
          }}
        >
          {isRegister ? (
            <>
              <Field label={t.auth.registerBusinessName} type="text" required />
              <Field label={t.auth.registerYourName} type="text" required />
            </>
          ) : null}
          <Field label={t.auth.loginEmail} type="email" required />
          <Field
            label={isRegister ? t.auth.registerPassword : t.auth.loginPassword}
            type="password"
            required
          />
          {isRegister ? (
            <Field
              label={t.auth.registerConfirm}
              type="password"
              required
            />
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isRegister ? (
              <UserPlus className="h-4 w-4" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {isRegister ? t.auth.registerSubmit : t.auth.loginSubmit}
          </button>
        </form>

        {/* Switch auth mode */}
        <div className="mt-4 flex items-center justify-center gap-1 text-sm text-foreground/70">
          {isRegister ? (
            <>
              <span>
                {lang === "id" ? "Sudah punya akun?" : "Already have an account?"}
              </span>
              <button
                type="button"
                onClick={() => open("login")}
                className="font-medium text-primary hover:underline"
              >
                {t.auth.loginLink}
              </button>
            </>
          ) : (
            <>
              <span>
                {lang === "id" ? "Belum punya akun?" : "Don't have an account?"}
              </span>
              <button
                type="button"
                onClick={() => open("register")}
                className="font-medium text-primary hover:underline"
              >
                {t.auth.registerLink}
              </button>
            </>
          )}
        </div>

        {/* Helper links for login */}
        {!isRegister ? (
          <div className="mt-3 flex flex-col items-center gap-1 text-sm text-foreground/60">
            <button type="button" className="hover:text-primary hover:underline">
              {t.auth.forgotPassword}
            </button>
            <button type="button" className="hover:text-primary hover:underline">
              {t.auth.resendVerification}
            </button>
          </div>
        ) : null}

        {/* Legal links */}
        <div className="mt-5 flex items-center justify-center gap-4 border-t border-foreground/10 pt-4 text-xs text-foreground/60">
          <a href="#" className="hover:text-primary hover:underline">
            {t.auth.terms}
          </a>
          <a href="#" className="hover:text-primary hover:underline">
            {t.auth.privacy}
          </a>
          <button
            type="button"
            onClick={toggleLang}
            className="hover:text-primary hover:underline"
          >
            {lang === "id" ? "English" : "Indonesia"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  required,
}: {
  label: string;
  type: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground/80">{label}</span>
      <input
        type={type}
        required={required}
        className="h-10 w-full rounded-lg border border-foreground/15 bg-background px-3 text-sm shadow-sm transition-colors placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );
}
