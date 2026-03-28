"use client";

import { useState, useEffect } from "react";

interface Block {
  id: string;
  contact: string;
  reason: string | null;
  createdAt: string;
}

export default function BlockedPanel() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/safety/block")
      .then(r => r.ok ? r.json() : { blocks: [] })
      .then(data => setBlocks(data.blocks))
      .finally(() => setLoading(false));
  }, []);

  async function unblock(contact: string) {
    const res = await fetch("/api/safety/block", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact }),
    });
    if (res.ok) {
      setBlocks(b => b.filter(bl => bl.contact !== contact));
    }
  }

  if (loading || blocks.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h2 className="font-semibold text-slate-900 mb-1">Blocked Contacts</h2>
      <p className="text-xs text-slate-400 mb-4">
        These contacts are prevented from sending you requests.
      </p>

      <div className="space-y-2">
        {blocks.map(b => (
          <div key={b.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm text-slate-700">{b.contact}</p>
              <p className="text-xs text-slate-400">
                {new Date(b.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => unblock(b.contact)}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Unblock
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
