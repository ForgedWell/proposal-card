"use client";

import { useState, useEffect, useRef } from "react";

interface Connection {
  id: string;
  prospectName: string | null;
  prospectContact: string | null;
  ownerId: string;
  messages: { body: string; createdAt: string }[];
}

interface Message {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; displayName: string | null; email: string | null };
}

interface Props {
  connections: Connection[];
  currentUserId: string;
}

export default function MessagesPanel({ connections, currentUserId }: Props) {
  const [active, setActive]     = useState<Connection | null>(connections[0] ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody]         = useState("");
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    fetch(`/api/connect/messages?connectionId=${active.id}`)
      .then(r => r.json())
      .then(d => setMessages(d.messages ?? []))
      .finally(() => setLoading(false));
  }, [active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!active || !body.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/connect/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: active.id, body: body.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(m => [...m, data.message]);
        setBody("");
      }
    } finally {
      setSending(false);
    }
  }

  if (connections.length === 0) return null;

  return (
    <div className="bg-sanctuary-surface-lowest rounded-xl overflow-hidden">
      <div className="flex h-[420px]">
        {/* Sidebar */}
        <div className="w-48 border-r border-sanctuary-surface-low flex flex-col">
          <div className="p-3 border-b border-sanctuary-surface-low">
            <p className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Messages</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {connections.map(conn => (
              <button
                key={conn.id}
                onClick={() => setActive(conn)}
                className={`w-full text-left px-3 py-3 border-b border-sanctuary-surface-low transition-colors ${
                  active?.id === conn.id ? "bg-sanctuary-primary-container/30" : "hover:bg-sanctuary-surface-low"
                }`}
              >
                <p className="text-sm font-medium text-sanctuary-on-surface truncate">
                  {conn.prospectName ?? conn.prospectContact ?? "Unknown"}
                </p>
                {conn.messages[0] && (
                  <p className="text-xs text-sanctuary-outline truncate mt-0.5">
                    {conn.messages[0].body}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col">
          {active ? (
            <>
              <div className="px-4 py-3 border-b border-sanctuary-surface-low">
                <p className="text-sm font-semibold text-sanctuary-on-surface">
                  {active.prospectName ?? active.prospectContact ?? "Unknown"}
                </p>
                {active.prospectContact && (
                  <p className="text-xs text-sanctuary-outline">{active.prospectContact}</p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading && <p className="text-xs text-sanctuary-outline text-center">Loading…</p>}
                {messages.map(msg => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                        isMe
                          ? "bg-sanctuary-primary text-sanctuary-on-primary rounded-br-sm"
                          : "bg-sanctuary-surface-low text-sanctuary-on-surface rounded-bl-sm"
                      }`}>
                        {msg.body}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} className="p-3 border-t border-sanctuary-surface-low flex gap-2">
                <input
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Type a message…"
                  className="input-field text-sm flex-1 py-2"
                />
                <button
                  type="submit"
                  disabled={sending || !body.trim()}
                  className="bg-sanctuary-primary text-sanctuary-on-primary py-2 px-4 text-sm rounded-xl font-medium hover:bg-sanctuary-primary-dim transition-colors disabled:opacity-50 shrink-0"
                >
                  {sending ? "…" : "Send"}
                </button>
              </form>
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
