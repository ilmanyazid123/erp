"use client";

import { useEffect, useState } from "react";
import { X, LogIn, UserPlus, Loader2, AlertCircle } from "lucide-react";
import { useLang, useAuthModal, signIn } from "@/components/providers";

export function AuthDialog() {
  const { modal, close, open } = useAuthModal();
  const { t, lang, toggleLang } = useLang();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset error when switching between login/register mode
  useEffect(() => {
    setError(null);
  }, [modal]);

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (isRegister) {
        // Call /api/auth/register
        const body = {
          businessName: String(formData.get("businessName") ?? ""),
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
          confirmPassword: String(formData.get("confirmPassword") ?? ""),
        };
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Registrasi gagal.");
        }
        // Auto-login after successful registration
        const signInRes = await signIn("credentials", {
          email: body.email,
          password: body.password,
          redirect: false,
        });
        if (signInRes?.error) {
          // Account created but login failed — show a friendly message.
          setError(
            lang === "id"
              ? "Akun berhasil dibuat, tapi login otomatis gagal. Silakan login manual."
              : "Account created, but auto-login failed. Please sign in manually.",
          );
          open("login");
          return;
        }
        // Success — refresh page so server components pick up the new session
        window.location.reload();
      } else {
        // Login via next-auth credentials provider
        const email = String(formData.get("email") ?? "");
        const password = String(formData.get("password") ?? "");
        const signInRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (signInRes?.error) {
          setError(
            lang === "id"
              ? "Email atau password salah."
              : "Invalid email or password.",
          );
          return;
        }
        window.location.reload();
      }
    } catch (err: any) {
      setError(err?.message ?? "Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

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
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-bold">
            F
          </span>
          <h2 className="mt-3 text-2xl font-semibold">
            {isRegister ? t.auth.registerTitle : t.auth.loginTitle}
          </h2>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-md border border-[color:var(--coral)]/30 bg-[color:var(--coral)]/5 px-3 py-2 text-sm text-[color:var(--coral)]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit}>
          {isRegister ? (
            <>
              <Field
                name="businessName"
                label={t.auth.registerBusinessName}
                type="text"
                required
              />
              <Field
                name="name"
                label={t.auth.registerYourName}
                type="text"
                required
              />
            </>
          ) : null}
          <Field name="email" label={t.auth.loginEmail} type="email" required />
          <Field
            name="password"
            label={isRegister ? t.auth.registerPassword : t.auth.loginPassword}
            type="password"
            required
            minLength={6}
          />
          {isRegister ? (
            <Field
              name="confirmPassword"
              label={t.auth.registerConfirm}
              type="password"
              required
              minLength={6}
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
  name,
  label,
  type,
  required,
  minLength,
}: {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground/80">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={type === "password" ? "current-password" : undefined}
        className="h-10 w-full rounded-lg border border-foreground/15 bg-background px-3 text-sm shadow-sm transition-colors placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );
}
