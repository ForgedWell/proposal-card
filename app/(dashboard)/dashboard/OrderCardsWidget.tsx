"use client";

import { useState } from "react";

const PRICE_PER_CARD = 0.45;
const MIN_QTY = 10;
const MAX_QTY = 500;
const STEP = 5;

export default function OrderCardsWidget() {
  const [qty, setQty] = useState(25);
  const [address, setAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const total = (qty * PRICE_PER_CARD).toFixed(2);

  function adjust(delta: number) {
    setQty(q => Math.max(MIN_QTY, Math.min(MAX_QTY, q + delta)));
  }

  function handleOrder() {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <div className="bg-sanctuary-surface-lowest rounded-xl p-8 space-y-6">
      <div>
        <h3 className="font-serif text-xl text-sanctuary-on-surface">Order Physical Cards</h3>
        <p className="text-sm text-sanctuary-on-surface-variant mt-1">Share your card in person — NFC and QR enabled.</p>
      </div>

      {/* Quantity selector */}
      <div className="flex items-center justify-between">
        <span className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Quantity</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => adjust(-STEP)}
            disabled={qty <= MIN_QTY}
            className="w-8 h-8 rounded-lg bg-sanctuary-surface-low text-sanctuary-on-surface flex items-center justify-center hover:bg-sanctuary-surface-container transition-colors disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[18px]">remove</span>
          </button>
          <span className="text-xl font-bold text-sanctuary-on-surface w-12 text-center">{qty}</span>
          <button
            onClick={() => adjust(STEP)}
            disabled={qty >= MAX_QTY}
            className="w-8 h-8 rounded-lg bg-sanctuary-surface-low text-sanctuary-on-surface flex items-center justify-center hover:bg-sanctuary-surface-container transition-colors disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="text-sm text-sanctuary-on-surface-variant">
        {qty} cards · <span className="font-semibold text-sanctuary-on-surface">${total}</span>
      </div>

      {/* Shipping address */}
      <div className="space-y-1">
        <label className="text-[0.75rem] tracking-wider uppercase text-sanctuary-outline">Shipping Address</label>
        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="123 Main St, City, State, ZIP"
          className="input-field text-sm"
        />
      </div>

      {/* Order button */}
      <button
        onClick={handleOrder}
        className="btn-primary py-3 text-sm"
      >
        Request Order
      </button>

      {/* Toast */}
      {submitted && (
        <div className="bg-sanctuary-primary-container text-sanctuary-primary text-xs font-medium rounded-lg px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          Order request sent — we'll be in touch shortly
        </div>
      )}

      <p className="text-[11px] text-sanctuary-outline">
        Minimum order 10 cards · Ships within 5–7 business days
      </p>
    </div>
  );
}
