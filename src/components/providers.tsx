"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { strings, type Dict, type Lang } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/* Language preference (uses useSyncExternalStore so the localStorage  */
/* read on the client doesn't trigger a setState-in-effect lint warning */
/* and hydration stays consistent — server renders "id", client reads  */
/* localStorage after mount).                                           */
/* ------------------------------------------------------------------ */
let langListeners: Array<() => void> = [];
const subscribeLang = (cb: () => void) => {
  langListeners = [...langListeners, cb];
  return () => {
    langListeners = langListeners.filter((l) => l !== cb);
  };
};
const getLangSnapshot = (): Lang => {
  if (typeof window === "undefined") return "id";
  const v = window.localStorage.getItem("faiz-lang");
  return v === "en" || v === "id" ? v : "id";
};
const getLangServerSnapshot = (): Lang => "id";

const setLangExternal = (l: Lang) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("faiz-lang", l);
    document.documentElement.lang = l;
  }
  langListeners.forEach((l2) => l2());
};

type LangContextType = {
  lang: Lang;
  t: Dict;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
};

const LangContext = createContext<LangContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(
    subscribeLang,
    getLangSnapshot,
    getLangServerSnapshot,
  );
  const setLang = useCallback((l: Lang) => setLangExternal(l), []);
  const toggleLang = useCallback(
    () => setLangExternal(getLangSnapshot() === "id" ? "en" : "id"),
    [],
  );

  const value = useMemo<LangContextType>(
    () => ({ lang, t: strings[lang], setLang, toggleLang }),
    [lang, setLang, toggleLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Auth modal state (pure client-side UI state via useState)           */
/* ------------------------------------------------------------------ */
type AuthModal = "login" | "register" | null;
type AuthContextType = {
  modal: AuthModal;
  open: (m: AuthModal) => void;
  close: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<AuthModal>(null);
  const open = useCallback((m: AuthModal) => setModal(m), []);
  const close = useCallback(() => setModal(null), []);
  const value = useMemo<AuthContextType>(
    () => ({ modal, open, close }),
    [modal, open, close],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthModal() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthModal must be used inside AuthModalProvider");
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Combined provider (used in layout)                                  */
/* ------------------------------------------------------------------ */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthModalProvider>{children}</AuthModalProvider>
    </LanguageProvider>
  );
}
