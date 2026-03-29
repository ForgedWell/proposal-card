"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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

const POLL_INTERVAL = 5000;

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  APPROVED:      { label: "Active",              color: "bg-sanctuary-primary/10 text-sanctuary-primary" },
  PAUSED:        { label: "Paused",              color: "bg-amber-100 text-amber-700" },
  WALI_APPROVED: { label: "Guardian Approved",   color: "bg-sanctuary-primary/20 text-sanctuary-primary" },
  CLOSED:        { label: "Closed",              color: "bg-red-100 text-red-700" },
  PENDING:       { label: "Pending",             color: "bg-sanctuary-surface-high text-sanctuary-outline" },
};

export default function MessagesTab({ connections, currentUserId, waliActive }: Props) {
  const [active, setActive] = useState<Connection | null>(connections[0] ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [waliNotes, setWaliNotes] = useState<WaliNote[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async (connectionId: string, showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/connect/messages?connectionId=${connectionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) { setMessages([]); return; }
    fetchMessages(active.id, true);

    // Load wali notes from connection data
    setWaliNotes((active.waliNotes ?? []) as WaliNote[]);

    pollRef.current = setInterval(() => fetchMessages(active.id), POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [active, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!active || !body.trim()) return;

    const msgBody = body.trim();
    setBody("");
    setSending(true);

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      body: msgBody,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, displayName: null, email: null },
    };
    setMessages(m => [...m, optimistic]);

    try {
      const res = await fetch("/api/connect/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: active.id, body: msgBody }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages(m => m.map(msg => msg.id === optimistic.id ? data.message : msg));
      } else {
        setMessages(m => m.filter(msg => msg.id !== optimistic.id));
      }
    } catch {
      setMessages(m => m.filter(msg => msg.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  }

  const inputDisabled = active && (active.status === "PAUSED" || active.status === "CLOSED");
  const statusInfo = active ? STATUS_LABELS[active.status] ?? STATUS_LABELS.PENDING : null;

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
        {/* Left: Conversation list */}
        <div className="w-[280px] border-r border-sanctuary-surface-low flex flex-col shrink-0">
          <div className="p-4 border-b border-sanctuary-surface-low">
            <p className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {connections.map(conn => {
              const name = conn.prospectName ?? conn.prospectContact ?? "Unknown";
              const lastMsgObj = conn.messages[0];
              const lastTime = lastMsgObj?.createdAt;

              // Determine preview prefix
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
                  onClick={() => setActive(conn)}
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

        {/* Right: Active thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {active ? (
            <>
              {/* Header */}
              <div className="px-5 py-4 border-b border-sanctuary-surface-low">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-sanctuary-on-surface">
                      {active.prospectName ?? active.prospectContact ?? "Unknown"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {waliActive && (
                      <span className="flex items-center gap-1 text-[10px] text-sanctuary-primary">
                        <span className="material-symbols-outlined text-xs">shield_person</span>
                        Guardian oversight active
                      </span>
                    )}
                    {statusInfo && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status banners */}
              {active.status === "PAUSED" && (
                <div className="mx-5 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-sm mt-0.5">warning</span>
                  <p className="text-xs text-amber-700">This conversation has been paused by your Guardian. Contact your Guardian directly for next steps.</p>
                </div>
              )}
              {active.status === "CLOSED" && (
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
                  // Use senderRole when available (handles pre-account requester where senderId = ownerId for both)
                  const isOwner = active.ownerId === currentUserId;
                  const isMe = msg.senderRole
                    ? (isOwner ? msg.senderRole === "owner" : msg.senderRole === "requester")
                    : msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[75%] space-y-0.5">
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? "bg-sanctuary-primary text-sanctuary-on-primary rounded-br-sm"
                            : "bg-sanctuary-surface-low text-sanctuary-on-surface rounded-bl-sm"
                        }`}>
                          {msg.body}
                        </div>
                        <p className={`text-[10px] text-sanctuary-outline-variant ${isMe ? "text-right" : "text-left"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Wali notes */}
              {waliNotes.length > 0 && (
                <div className="mx-5 mb-3 space-y-2">
                  {waliNotes.map((note, i) => (
                    <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                      <span className="material-symbols-outlined text-amber-600 text-sm mt-0.5">shield_person</span>
                      <div>
                        <p className="text-xs text-amber-800 font-medium">
                          Guardian note{note.wali.displayName ? ` from ${note.wali.displayName}` : ""}
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5">{note.content}</p>
                        <p className="text-[10px] text-amber-500 mt-1">{new Date(note.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Input */}
              {inputDisabled ? null : (
                <form onSubmit={handleSend} className="p-4 border-t border-sanctuary-surface-low flex gap-2">
                  <input
                    value={body}
                    onChange={e => setBody(e.target.value)}
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
