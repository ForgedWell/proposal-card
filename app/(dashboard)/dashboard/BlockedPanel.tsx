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
    <div className="bg-sanctuary-surface-lowest rounded-xl p-8 space-y-6">
      <h3 className="font-serif text-xl text-sanctuary-on-surface">Blocked Contacts</h3>
      <p className="text-sm text-sanctuary-on-surface-variant">
        These contacts are prevented from sending you requests.
      </p>

      <div className="space-y-2">
        {blocks.map(b => (
          <div key={b.id} className="flex items-center justify-between py-3 px-4 bg-sanctuary-surface-low rounded-lg">
            <div>
              <p className="text-sm text-sanctuary-on-surface">{b.contact}</p>
              <p className="text-xs text-sanctuary-outline">
                {new Date(b.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => unblock(b.contact)}
              className="text-xs text-sanctuary-outline hover:text-sanctuary-on-surface transition-colors"
            >
              Unblock
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
