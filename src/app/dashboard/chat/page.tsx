"use client";

// Team chat: simple polling-based channel chat backed by ChatMessage.

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Send } from "lucide-react";
import { Loading, inputCls, primaryBtnCls } from "@/components/dashboard/ui";

type Message = {
  id: string;
  content: string;
  createdAt: string;
  userId: string | null;
  user: { id: string; name: string | null } | null;
};

export default function ChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/chat?channel=general");
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
    } catch {
      // keep old messages on transient errors
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, channel: "general" }),
      });
      if (res.ok) {
        setInput("");
        await load();
      }
    } finally {
      setSending(false);
    }
  }

  const myId = (session?.user as { id?: string } | undefined)?.id;

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-semibold sm:text-2xl">Chat Tim</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Koordinasi harian di kanal #general — semua anggota bisnis bisa melihat.
        </p>
      </div>

      <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-xl border border-foreground/10 bg-card shadow-sm">
        <div className="border-b border-foreground/10 px-4 py-3">
          <p className="text-sm font-medium">#general</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!messages ? (
            <Loading label="Memuat pesan..." />
          ) : messages.length === 0 ? (
            <p className="py-16 text-center text-sm text-foreground/50">
              Belum ada pesan. Mulai percakapan pertama 👋
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {messages.map((m) => {
                const mine = m.userId && m.userId === myId;
                return (
                  <li
                    key={m.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "bg-foreground/[0.05] text-foreground"
                      }`}
                    >
                      {!mine ? (
                        <p className="text-[11px] font-semibold opacity-70">
                          {m.user?.name ?? "Sistem"}
                        </p>
                      ) : null}
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {m.content}
                      </p>
                      <p
                        className={`mt-0.5 text-right text-[10px] ${
                          mine ? "opacity-70" : "text-foreground/40"
                        }`}
                      >
                        {new Date(m.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={send}
          className="flex items-center gap-2 border-t border-foreground/10 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tulis pesan..."
            aria-label="Tulis pesan"
            className={inputCls}
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className={`${primaryBtnCls} h-10 w-10 px-0`}
            aria-label="Kirim pesan"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
