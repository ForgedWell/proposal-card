"use client";

import { useState, useEffect, useRef } from "react";

interface Ward { id: string; displayName: string | null; email: string | null; }
interface WaliNoteData { content: string; createdAt: string; wali: { displayName: string | null }; }
interface Connection {
  id: string;
  ownerId: string;
  prospectName: string | null;
  prospectContact: string | null;
  status: string;
  updatedAt: string;
  owner: { id: string; displayName: string | null };
  messages: { body: string; createdAt: string }[];
  waliNotes: WaliNoteData[];
}
interface ThreadMessage {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; displayName: string | null };
}

interface Props {
  waliName: string;
  wards: Ward[];
  connections: Connection[];
}

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "bg-sanctuary-primary/10 text-sanctuary-primary",
  PAUSED: "bg-amber-100 text-amber-700",
  WALI_APPROVED: "bg-sanctuary-primary/20 text-sanctuary-primary",
  CLOSED: "bg-red-100 text-red-700",
};

export default function WaliDashboard({ waliName, wards, connections: initialConns }: Props) {
  const [tab, setTab] = useState<"overview" | "connections">("overview");
  const [connections] = useState(initialConns);
  const [activeConn, setActiveConn] = useState<Connection | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [notes, setNotes] = useState<WaliNoteData[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch thread when connection selected
  useEffect(() => {
    if (!activeConn) { setThread([]); setNotes([]); return; }
    setNotes(activeConn.waliNotes ?? []);
    setThreadLoading(true);

    fetch(`/api/wali/connections?threadId=${activeConn.id}`)
      .then(r => r.json())
      .then(d => setThread(d.messages ?? []))
      .finally(() => setThreadLoading(false));

    // Poll every 30 seconds
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/wali/connections?threadId=${activeConn.id}`);
      if (res.ok) { const d = await res.json(); setThread(d.messages ?? []); }
    }, 30000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConn]);

  async function handleAction(action: "pause" | "resume" | "close" | "approve_next") {
    if (!activeConn) return;
    setActionLoading(true);
    await fetch("/api/wali/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionId: activeConn.id, action }),
    });
    setActionLoading(false);
    window.location.reload();
  }

  async function handlePostNote() {
    if (!activeConn || !noteText.trim()) return;
    setNoteSaving(true);
    const res = await fetch("/api/wali/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionId: activeConn.id, content: noteText.trim() }),
    });
    if (res.ok) {
      const { note } = await res.json();
      setNotes(n => [note, ...n]);
      setNoteText("");
    }
    setNoteSaving(false);
  }

  return (
    <div className="min-h-screen bg-sanctuary-surface">
      {/* Header */}
      <header className="bg-sanctuary-surface border-b border-sanctuary-surface-low">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif font-bold text-sanctuary-primary">Proposal Card</h1>
            <p className="text-[10px] uppercase tracking-widest text-sanctuary-outline">Guardian Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-sanctuary-outline">{waliName}</span>
            <form action="/api/auth/logout" method="POST">
              <button className="text-xs text-sanctuary-outline hover:text-sanctuary-tertiary transition-colors">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab nav */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => { setTab("overview"); setActiveConn(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "overview" ? "bg-sanctuary-primary text-sanctuary-on-primary" : "bg-sanctuary-surface-low text-sanctuary-outline hover:bg-sanctuary-surface-container"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab("connections")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "connections" ? "bg-sanctuary-primary text-sanctuary-on-primary" : "bg-sanctuary-surface-low text-sanctuary-outline hover:bg-sanctuary-surface-container"
            }`}
          >
            Connections
          </button>
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wards.map(ward => {
              const wardConns = connections.filter(c => c.ownerId === ward.id);
              return (
                <div key={ward.id} className="bg-sanctuary-surface-lowest rounded-xl p-6 space-y-4">
                  <h3 className="font-serif text-lg text-sanctuary-on-surface">{ward.displayName ?? ward.email}</h3>
                  <div className="text-sm text-sanctuary-on-surface-variant">
                    {wardConns.length} active connection{wardConns.length !== 1 ? "s" : ""}
                  </div>
                  <button
                    onClick={() => { setTab("connections"); if (wardConns[0]) setActiveConn(wardConns[0]); }}
                    className="text-sm text-sanctuary-primary hover:text-sanctuary-primary-dim font-medium"
                  >
                    View Connections →
                  </button>
                </div>
              );
            })}
            {wards.length === 0 && (
              <p className="text-sm text-sanctuary-on-surface-variant col-span-full">No wards linked to your account yet.</p>
            )}
          </div>
        )}

        {/* Connections */}
        {tab === "connections" && (
          <div className="flex gap-8">
            {/* List */}
            <div className="w-[280px] shrink-0 space-y-2">
              {connections.map(conn => (
                <button
                  key={conn.id}
                  onClick={() => setActiveConn(conn)}
                  className={`w-full text-left p-4 rounded-xl transition-colors ${
                    activeConn?.id === conn.id ? "bg-sanctuary-primary-container/20" : "bg-sanctuary-surface-lowest hover:bg-sanctuary-surface-low"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-sanctuary-on-surface truncate">
                      {conn.prospectName ?? "Unknown"}
                    </p>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${STATUS_COLORS[conn.status] ?? ""}`}>
                      {conn.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-sanctuary-outline">
                    Ward: {conn.owner.displayName ?? "—"}
                  </p>
                </button>
              ))}
              {connections.length === 0 && (
                <p className="text-sm text-sanctuary-on-surface-variant p-4">No connections found.</p>
              )}
            </div>

            {/* Detail */}
            {activeConn ? (
              <div className="flex-1 bg-sanctuary-surface-lowest rounded-xl p-6 space-y-6 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg text-sanctuary-on-surface">{activeConn.prospectName ?? "Unknown"}</h3>
                    <p className="text-xs text-sanctuary-outline">Ward: {activeConn.owner.displayName}</p>
                  </div>
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase ${STATUS_COLORS[activeConn.status] ?? ""}`}>
                    {activeConn.status.replace("_", " ")}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {activeConn.status === "APPROVED" && (
                    <>
                      <button onClick={() => handleAction("pause")} disabled={actionLoading}
                        className="px-4 py-2 text-xs rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors disabled:opacity-50">
                        Pause Connection
                      </button>
                      <button onClick={() => handleAction("approve_next")} disabled={actionLoading}
                        className="px-4 py-2 text-xs rounded-lg bg-sanctuary-primary text-sanctuary-on-primary hover:bg-sanctuary-primary-dim transition-colors disabled:opacity-50">
                        Approve for Next Stage
                      </button>
                    </>
                  )}
                  {activeConn.status === "PAUSED" && (
                    <button onClick={() => handleAction("resume")} disabled={actionLoading}
                      className="px-4 py-2 text-xs rounded-lg bg-sanctuary-primary text-sanctuary-on-primary hover:bg-sanctuary-primary-dim transition-colors disabled:opacity-50">
                      Resume Connection
                    </button>
                  )}
                  {activeConn.status !== "CLOSED" && (
                    <button onClick={() => handleAction("close")} disabled={actionLoading}
                      className="px-4 py-2 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50">
                      Close Connection
                    </button>
                  )}
                </div>

                {/* Read-only thread */}
                <div>
                  <p className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline mb-3">Conversation Thread</p>
                  <div className="max-h-[300px] overflow-y-auto space-y-3 bg-sanctuary-surface-low rounded-xl p-4">
                    {threadLoading && <p className="text-xs text-sanctuary-outline text-center">Loading…</p>}
                    {!threadLoading && thread.length === 0 && (
                      <p className="text-xs text-sanctuary-outline text-center">No messages yet.</p>
                    )}
                    {thread.map(msg => {
                      const isWard = msg.senderId === activeConn.ownerId;
                      return (
                        <div key={msg.id} className={`flex ${isWard ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[75%] space-y-0.5">
                            <p className={`text-[10px] ${isWard ? "text-right" : "text-left"} text-sanctuary-outline`}>
                              {msg.sender.displayName ?? (isWard ? "Ward" : "Contact")}
                            </p>
                            <div className={`px-3 py-2 rounded-2xl text-sm ${
                              isWard ? "bg-sanctuary-primary/10 text-sanctuary-on-surface rounded-br-sm" : "bg-white text-sanctuary-on-surface rounded-bl-sm"
                            }`}>
                              {msg.body}
                            </div>
                            <p className={`text-[10px] text-sanctuary-outline-variant ${isWard ? "text-right" : "text-left"}`}>
                              {new Date(msg.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Wali notes */}
                <div>
                  <p className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline mb-3">Guardian Notes</p>
                  <div className="space-y-2 mb-3">
                    {notes.map((note, i) => (
                      <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800 font-medium">
                          {note.wali.displayName ?? "Guardian"}
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5">{note.content}</p>
                        <p className="text-[10px] text-amber-500 mt-1">{new Date(note.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Post a note (max 300 chars)…"
                      maxLength={300}
                      className="input-field text-sm flex-1 py-2"
                    />
                    <button
                      onClick={handlePostNote}
                      disabled={noteSaving || !noteText.trim()}
                      className="bg-sanctuary-primary text-sanctuary-on-primary py-2 px-4 text-sm rounded-xl font-medium hover:bg-sanctuary-primary-dim transition-colors disabled:opacity-50 shrink-0"
                    >
                      {noteSaving ? "…" : "Post Note"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-sanctuary-surface-lowest rounded-xl">
                <p className="text-sm text-sanctuary-outline">Select a connection to view details</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
