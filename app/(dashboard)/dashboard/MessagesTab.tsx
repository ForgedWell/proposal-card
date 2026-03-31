"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Connection {
  id: string;
  prospectName: string | null;
  prospectContact: string | null;
  ownerId: string;
  prospectId: string | null;
  status: string;
  messages: { body: string; createdAt: string; senderId?: string; senderRole?: string | null }[];
  waliNotes?: { content: string; createdAt: string; wali: { displayName: string | null } }[];
}

interface Message {
  id: string;
  body: string;
  senderId: string;
  senderRole?: string | null;
  createdAt: string;
  pending?: boolean;
  sender: { id: string; displayName: string | null; email: string | null };
}

interface WaliNote {
  content: string;
  createdAt: string;
  wali: { displayName: string | null };
}

interface Props {
  connections: Connection[];
  currentUserId: string;
  waliActive: boolean;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  APPROVED:      { label: "Active",            color: "bg-sanctuary-primary/10 text-sanctuary-primary" },
  PAUSED:        { label: "Paused",            color: "bg-amber-100 text-amber-700" },
  WALI_APPROVED: { label: "Guardian Approved", color: "bg-sanctuary-primary/20 text-sanctuary-primary" },
  CLOSED:        { label: "Closed",            color: "bg-red-100 text-red-700" },
  PENDING:       { label: "Pending",           color: "bg-sanctuary-surface-high text-sanctuary-outline" },
};

export default function MessagesTab({ connections, currentUserId, waliActive }: Props) {
  const [active, setActive] = useState<Connection | null>(connections[0] ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [waliNotes, setWaliNotes] = useState<WaliNote[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connStatus, setConnStatus] = useState(active?.status ?? "");
  const [otherTyping, setOtherTyping] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  // Fetch messages for active connection
  const fetchMessages = useCallback(async (connectionId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/connect/messages?connectionId=${connectionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
        scrollToBottom();
      }
    } finally {
      setLoading(false);
    }
  }, [scrollToBottom]);

  // On connection change: fetch messages, set notes/status
  useEffect(() => {
    if (!active) { setMessages([]); setWaliNotes([]); return; }
    setConnStatus(active.status);
    setWaliNotes((active.waliNotes ?? []) as WaliNote[]);
    fetchMessages(active.id);
  }, [active, fetchMessages]);

  // Supabase Realtime: new messages (with debug logging)
  useEffect(() => {
    if (!active) return;

    const channel = supabase
      .channel(`msgs:${active.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `connectionRequestId=eq.${active.id}` },
        (payload) => {
          console.log("[Realtime] message received:", payload.new);
          const newMsg = payload.new as any;
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, {
              id: newMsg.id,
              body: newMsg.body,
              senderId: newMsg.senderId,
              senderRole: newMsg.senderRole,
              createdAt: newMsg.createdAt,
              sender: { id: newMsg.senderId, displayName: null, email: null },
            }];
          });
          scrollToBottom();
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] subscription status:", status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [active, scrollToBottom]);

  // Fallback polling (catches missed messages, iOS Safari background)
  useEffect(() => {
    if (!active) return;
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchMessages(active.id);
      }
    }, 5000);
    return () => clearInterval(poll);
  }, [active, fetchMessages]);

  // Supabase Realtime: connection status changes
  useEffect(() => {
    if (!active) return;

    const channel = supabase
      .channel(`conn-status:${active.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "connection_requests", filter: `id=eq.${active.id}` },
        (payload) => {
          const updated = payload.new as any;
          setConnStatus(updated.status);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [active]);

  // Supabase Presence: typing indicator
  useEffect(() => {
    if (!active) return;

    const channel = supabase.channel(`presence:${active.id}`, { config: { presence: { key: currentUserId } } });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const typing = Object.values(state).flat().some(
        (p: any) => p.typing && p.userId !== currentUserId
      );
      setOtherTyping(typing);
    });

    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [active, currentUserId]);

  // Broadcast typing
  function handleTyping() {
    if (!active) return;
    const channel = supabase.channel(`presence:${active.id}`);
    channel.track({ typing: true, userId: currentUserId });
    setTimeout(() => channel.track({ typing: false, userId: currentUserId }), 2000);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!active || !body.trim()) return;

    const msgBody = body.trim();
    setBody("");
    setSending(true);
    inputRef.current?.focus();

    const isOwner = active.ownerId === currentUserId;
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      body: msgBody,
      senderId: currentUserId,
      senderRole: isOwner ? "owner" : "requester",
      createdAt: new Date().toISOString(),
      pending: true,
      sender: { id: currentUserId, displayName: null, email: null },
    };
    setMessages(m => [...m, optimistic]);
    scrollToBottom();

    try {
      const res = await fetch("/api/connect/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: active.id, body: msgBody }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages(m => m.map(msg => msg.id === optimistic.id ? { ...data.message, pending: false } : msg));
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

  const inputDisabled = connStatus === "PAUSED" || connStatus === "CLOSED";
  const statusInfo = STATUS_LABELS[connStatus] ?? STATUS_LABELS.PENDING;

  if (connections.length === 0) {
    return (
      <div className="bg-sanctuary-surface-lowest rounded-xl p-12 text-center">
        <span className="material-symbols-outlined text-sanctuary-outline-variant text-5xl mb-4 block">chat_bubble_outline</span>
        <p className="text-sm text-sanctuary-on-surface-variant">No active conversations yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-sanctuary-surface-lowest rounded-xl overflow-hidden">
      <div className="flex h-[560px]">
        {/* Left: Conversation list — hidden on mobile when in chat view */}
        <div className={`w-full md:w-[280px] border-r border-sanctuary-surface-low flex flex-col shrink-0 ${mobileView === "chat" ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-sanctuary-surface-low">
            <p className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {connections.map(conn => {
              const name = conn.prospectName ?? conn.prospectContact ?? "Unknown";
              const lastMsgObj = conn.messages[0];
              const lastTime = lastMsgObj?.createdAt;
              let lastMsg = lastMsgObj?.body ?? "";
              if (lastMsgObj) {
                const isOwner = conn.ownerId === currentUserId;
                const sentByMe = lastMsgObj.senderRole
                  ? (isOwner ? lastMsgObj.senderRole === "owner" : lastMsgObj.senderRole === "requester")
                  : lastMsgObj.senderId === currentUserId;
                const prefix = sentByMe ? "You" : (conn.prospectName?.split(" ")[0] ?? "Them");
                lastMsg = `${prefix}: ${lastMsgObj.body}`;
              }
              return (
                <button
                  key={conn.id}
                  onClick={() => { setActive(conn); setMobileView("chat"); }}
                  className={`w-full text-left px-4 py-3.5 border-b border-sanctuary-surface-low transition-colors ${
                    active?.id === conn.id ? "bg-sanctuary-primary-container/20" : "hover:bg-sanctuary-surface-low"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-semibold text-sanctuary-on-surface truncate">{name}</p>
                    {lastTime && (
                      <span className="text-[10px] text-sanctuary-outline shrink-0 ml-2">
                        {new Date(lastTime).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  {lastMsg && (
                    <p className="text-xs text-sanctuary-outline truncate">{lastMsg}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active thread — hidden on mobile when in list view */}
        <div className={`flex-1 flex flex-col min-w-0 ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
          {active ? (
            <>
              {/* Header with back button on mobile */}
              <div className="px-5 py-4 border-b border-sanctuary-surface-low">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMobileView("list")}
                      className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sanctuary-surface-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px] text-sanctuary-outline">arrow_back</span>
                    </button>
                    <p className="text-sm font-semibold text-sanctuary-on-surface">
                      {active.prospectName ?? active.prospectContact ?? "Unknown"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {waliActive && (
                      <span className="flex items-center gap-1 text-[10px] text-sanctuary-primary">
                        <span className="material-symbols-outlined text-xs">shield_person</span>
                        Guardian oversight
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status banners */}
              {connStatus === "PAUSED" && (
                <div className="mx-5 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-sm mt-0.5">warning</span>
                  <p className="text-xs text-amber-700">This conversation has been paused by your Guardian. Contact your Guardian directly for next steps.</p>
                </div>
              )}
              {connStatus === "CLOSED" && (
                <div className="mx-5 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <span className="material-symbols-outlined text-red-600 text-sm mt-0.5">block</span>
                  <p className="text-xs text-red-700">This connection has been closed.</p>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {loading && messages.length === 0 && (
                  <p className="text-xs text-sanctuary-outline text-center">Loading…</p>
                )}
                {!loading && messages.length === 0 && (
                  <p className="text-xs text-sanctuary-outline text-center">No messages yet. Start the conversation.</p>
                )}
                {messages.map(msg => {
                  const isOwner = active.ownerId === currentUserId;
                  const isMe = msg.senderRole
                    ? (isOwner ? msg.senderRole === "owner" : msg.senderRole === "requester")
                    : msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex message-appear ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[75%] space-y-0.5">
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? "bg-sanctuary-primary text-sanctuary-on-primary rounded-br-sm"
                            : "bg-sanctuary-surface-low text-sanctuary-on-surface rounded-bl-sm"
                        } ${msg.pending ? "opacity-70" : ""}`}>
                          {msg.body}
                        </div>
                        <div className={`flex items-center gap-1 ${isMe ? "justify-end" : "justify-start"}`}>
                          {msg.pending && <span className="text-[10px] text-sanctuary-outline-variant">sending…</span>}
                          {!msg.pending && (
                            <span className="text-[10px] text-sanctuary-outline-variant">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {otherTyping && (
                  <div className="text-xs text-sanctuary-outline italic px-1">
                    {active.prospectName?.split(" ")[0] ?? "They"} typing…
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Wali notes */}
              {waliNotes.length > 0 && (
                <div className="mx-5 mb-3 space-y-2">
                  {waliNotes.map((note, i) => (
                    <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                      <span className="material-symbols-outlined text-amber-600 text-sm mt-0.5">shield_person</span>
                      <div>
                        <p className="text-xs text-amber-800 font-medium">Guardian note{note.wali.displayName ? ` from ${note.wali.displayName}` : ""}</p>
                        <p className="text-xs text-amber-700 mt-0.5">{note.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Input */}
              {inputDisabled ? null : (
                <form onSubmit={handleSend} className="p-4 border-t border-sanctuary-surface-low flex gap-2">
                  <input
                    ref={inputRef}
                    value={body}
                    onChange={e => { setBody(e.target.value); handleTyping(); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message…"
                    className="input-field text-sm flex-1 py-2.5"
                  />
                  <button
                    type="submit"
                    disabled={sending || !body.trim()}
                    className="bg-sanctuary-primary text-sanctuary-on-primary py-2.5 px-5 text-sm rounded-xl font-medium hover:bg-sanctuary-primary-dim transition-colors disabled:opacity-50 shrink-0"
                  >
                    {sending ? "…" : "Send"}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-sanctuary-outline">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
