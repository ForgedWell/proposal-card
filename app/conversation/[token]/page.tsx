"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  body: string;
  senderId: string;
  senderRole?: string | null;
  createdAt: string;
  pending?: boolean;
}

interface ConversationData {
  connectionId: string;
  ownerName: string | null;
  ownerLocation: string | null;
  ownerId: string;
  prospectName: string | null;
  prospectContact: string | null;
  sentCountOwner: number;
  sentCountRequester: number;
  messages: Message[];
  gateReached: boolean;
}

type PageState = "loading" | "active" | "expired" | "not_found";

export default function ConversationPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>("loading");
  const [data, setData] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [gateReached, setGateReached] = useState(false);
  const [senderRole, setSenderRole] = useState<"owner" | "requester" | null>(null);
  const [connStatus, setConnStatus] = useState("APPROVED");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  const fetchConversation = useCallback(async (showLoading = false) => {
    if (showLoading) setState("loading");
    try {
      const res = await fetch(`/api/conversation?token=${token}`);
      if (res.status === 404) { setState("not_found"); return; }
      if (res.status === 410) { setState("expired"); return; }
      if (!res.ok) { setState("not_found"); return; }

      const d: ConversationData = await res.json();
      setData(d);
      setMessages(d.messages);
      setGateReached(d.gateReached);
      setState("active");
      scrollToBottom();
    } catch {
      setState("not_found");
    }
  }, [token, scrollToBottom]);

  // Initial fetch
  useEffect(() => { fetchConversation(true); }, [fetchConversation]);

  // Supabase Realtime: new messages
  useEffect(() => {
    if (!data) return;

    const channel = supabase
      .channel(`conv-msgs:${data.connectionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `connectionRequestId=eq.${data.connectionId}` },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, {
              id: newMsg.id,
              body: newMsg.body,
              senderId: newMsg.senderId,
              senderRole: newMsg.senderRole,
              createdAt: newMsg.createdAt,
            }];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [data, scrollToBottom]);

  // Supabase Realtime: connection status
  useEffect(() => {
    if (!data) return;

    const channel = supabase
      .channel(`conv-status:${data.connectionId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "connection_requests", filter: `id=eq.${data.connectionId}` },
        (payload) => {
          setConnStatus((payload.new as any).status);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [data]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !senderRole || !data) return;

    const msgBody = body.trim();
    setBody("");
    setSending(true);
    inputRef.current?.focus();

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      body: msgBody,
      senderId: senderRole === "owner" ? data.ownerId : "requester",
      senderRole,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages(m => [...m, optimistic]);
    scrollToBottom();

    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, body: msgBody, senderRole }),
      });
      const result = await res.json();

      if (res.ok && result.message) {
        setMessages(m => m.map(msg => msg.id === optimistic.id ? { ...result.message, pending: false } : msg));
        if (result.gateReached) setGateReached(true);
      } else {
        setMessages(m => m.filter(msg => msg.id !== optimistic.id));
      }
    } catch {
      setMessages(m => m.filter(msg => msg.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  }

  if (state === "loading") {
    return <Shell><p className="text-sanctuary-outline text-center">Loading conversation…</p></Shell>;
  }
  if (state === "not_found") {
    return (
      <Shell>
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-sanctuary-outline-variant text-5xl mb-4 block">link_off</span>
          <h1 className="font-serif text-2xl text-sanctuary-on-surface mb-2">Conversation not found</h1>
          <p className="text-sm text-sanctuary-on-surface-variant">This link may be invalid or the conversation no longer exists.</p>
        </div>
      </Shell>
    );
  }
  if (state === "expired") {
    return (
      <Shell>
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-sanctuary-outline-variant text-5xl mb-4 block">schedule</span>
          <h1 className="font-serif text-2xl text-sanctuary-on-surface mb-2">This conversation link has expired</h1>
          <p className="text-sm text-sanctuary-on-surface-variant">Please contact Proposal Card support if you need assistance.</p>
        </div>
      </Shell>
    );
  }

  if (!data) return null;

  // Role selection
  if (!senderRole) {
    return (
      <Shell>
        <div className="text-center py-8">
          <h2 className="font-serif text-xl text-sanctuary-on-surface mb-6">Who are you in this conversation?</h2>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button onClick={() => setSenderRole("owner")}
              className="py-3 px-6 rounded-xl bg-sanctuary-primary text-sanctuary-on-primary font-medium text-sm hover:bg-sanctuary-primary-dim transition-colors">
              I'm {data.ownerName ?? "the card owner"}
            </button>
            <button onClick={() => setSenderRole("requester")}
              className="py-3 px-6 rounded-xl bg-sanctuary-surface-low text-sanctuary-on-surface font-medium text-sm hover:bg-sanctuary-surface-container transition-colors">
              I'm {data.prospectName ?? "the requester"}
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const isMeOwner = senderRole === "owner";
  const isOwnerMsg = (msg: Message) => msg.senderRole === "owner" || msg.senderId === data.ownerId;
  const inputDisabled = connStatus === "PAUSED" || connStatus === "CLOSED";

  return (
    <Shell>
      {/* Guardian notice */}
      <div className="bg-sanctuary-primary-container/30 border border-sanctuary-primary-container/50 rounded-xl p-4 mb-6">
        <p className="text-xs text-sanctuary-primary leading-relaxed text-center">
          This conversation is facilitated by Proposal Card. Your Guardian has been notified.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-center flex-1">
          <p className="text-sm font-semibold text-sanctuary-on-surface">
            {isMeOwner ? data.prospectName : data.ownerName}
          </p>
          {!isMeOwner && data.ownerLocation && (
            <p className="text-xs text-sanctuary-outline">{data.ownerLocation}</p>
          )}
        </div>
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
          connStatus === "PAUSED" ? "bg-amber-100 text-amber-700" :
          connStatus === "CLOSED" ? "bg-red-100 text-red-700" :
          "bg-sanctuary-primary/10 text-sanctuary-primary"
        }`}>
          {connStatus === "WALI_APPROVED" ? "Active" : connStatus}
        </span>
      </div>

      {/* Status banners */}
      {connStatus === "PAUSED" && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 flex items-start gap-2">
          <span className="material-symbols-outlined text-amber-600 text-sm mt-0.5">warning</span>
          <p className="text-xs text-amber-700">This conversation has been paused by your Guardian.</p>
        </div>
      )}

      {/* Messages */}
      <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto">
        {messages.map(msg => {
          const fromOwner = msg.senderRole === "owner" || isOwnerMsg(msg);
          const isMe = isMeOwner ? fromOwner : !fromOwner;
          return (
            <div key={msg.id} className={`flex message-appear ${isMe ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[75%] space-y-0.5">
                <p className={`text-[10px] ${isMe ? "text-right" : "text-left"} text-sanctuary-outline`}>
                  {fromOwner ? (data.ownerName ?? "Card owner") : (data.prospectName ?? "Requester")}
                </p>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? "bg-sanctuary-primary text-sanctuary-on-primary rounded-br-sm"
                    : "bg-sanctuary-surface-low text-sanctuary-on-surface rounded-bl-sm"
                } ${msg.pending ? "opacity-70" : ""}`}>
                  {msg.body}
                </div>
                <div className={`${isMe ? "text-right" : "text-left"}`}>
                  {msg.pending
                    ? <span className="text-[10px] text-sanctuary-outline-variant">sending…</span>
                    : <span className="text-[10px] text-sanctuary-outline-variant">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  }
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Gate or input */}
      {gateReached ? (
        <div className="text-center py-6 border-t border-sanctuary-surface-low">
          <span className="material-symbols-outlined text-sanctuary-primary text-3xl mb-3 block">lock</span>
          <p className="font-serif text-lg text-sanctuary-on-surface mb-2">You've exchanged initial introductions.</p>
          <p className="text-sm text-sanctuary-on-surface-variant mb-6 max-w-sm mx-auto">
            Create a free Proposal Card account to continue this conversation, set up your Guardian, and build your profile.
          </p>
          <a href={`/login?email=${encodeURIComponent(data.prospectContact ?? "")}&connection=${token}`}
            className="inline-block py-3 px-8 bg-sanctuary-primary text-sanctuary-on-primary rounded-xl font-medium text-sm hover:bg-sanctuary-primary-dim transition-colors">
            Create Account →
          </a>
        </div>
      ) : inputDisabled ? null : (
        <form onSubmit={handleSend} className="flex gap-2 border-t border-sanctuary-surface-low pt-4">
          <input
            ref={inputRef}
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            maxLength={300}
            className="input-field text-sm flex-1 py-2.5"
          />
          <button type="submit" disabled={sending || !body.trim()}
            className="bg-sanctuary-primary text-sanctuary-on-primary py-2.5 px-5 text-sm rounded-xl font-medium hover:bg-sanctuary-primary-dim transition-colors disabled:opacity-50 shrink-0">
            {sending ? "…" : "Send"}
          </button>
        </form>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sanctuary-surface flex flex-col">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#466564 0.5px, transparent 0.5px), radial-gradient(#466564 0.5px, #fafaf5 0.5px)",
          backgroundSize: "40px 40px", backgroundPosition: "0 0, 20px 20px",
        }}
      />
      <header className="w-full px-6 py-6 z-10">
        <div className="max-w-[600px] mx-auto">
          <p className="text-xl font-serif italic font-bold text-sanctuary-primary tracking-tight">Proposal Card</p>
          <p className="text-[10px] uppercase tracking-widest text-sanctuary-outline">Private Introduction Thread</p>
        </div>
      </header>
      <main className="flex-grow flex justify-center px-4 z-10">
        <div className="w-full max-w-[600px] bg-sanctuary-surface-lowest rounded-xl p-8 shadow-[0px_12px_32px_rgba(47,52,46,0.04)] mb-8">
          {children}
        </div>
      </main>
      <footer className="text-center pb-6 z-10">
        <p className="text-[10px] uppercase tracking-widest text-sanctuary-outline">Powered by Proposal Card</p>
      </footer>
    </div>
  );
}
