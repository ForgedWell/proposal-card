/**
 * SMS Masking via Twilio Programmable Messaging
 *
 * Replaces Twilio Proxy (closed to new customers) with direct message routing:
 *   - A dedicated Twilio number is assigned per connection (from TWILIO_MASK_NUMBER)
 *   - Inbound SMS to that number → /api/webhooks/sms → forwarded to the right party
 *   - ProxyConnection record tracks who owns each number+session
 *
 * For production at scale: provision a number pool and assign one per session.
 * For MVP: one shared mask number routes based on sender phone number.
 */

import twilio from "twilio";
import { db } from "@/lib/db";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const MASK_NUMBER  = process.env.TWILIO_MASK_NUMBER;   // The Twilio number used as the mask
const PROXY_TTL_HOURS = 72;

// ─── Create a proxy connection ────────────────────────────────────────────────

export async function createProxyConnection(input: {
  connectionRequestId: string;
  ownerId:             string;
  ownerPhone:          string;
  prospectPhone:       string;
}) {
  if (!MASK_NUMBER) throw new Error("TWILIO_MASK_NUMBER not configured");

  const expiresAt = new Date(Date.now() + PROXY_TTL_HOURS * 60 * 60 * 1000);

  // Check not already active
  const existing = await db.proxyConnection.findUnique({
    where: { connectionRequestId: input.connectionRequestId },
  });
  if (existing && !existing.closedAt) return existing;

  // Send intro SMS to both parties so they know the masked number
  await Promise.allSettled([
    client.messages.create({
      from: MASK_NUMBER,
      to:   input.ownerPhone,
      body: `Your private connection via Proposal Card is active. Reply to this number to message the other person. This number expires in ${PROXY_TTL_HOURS} hours.`,
    }),
    client.messages.create({
      from: MASK_NUMBER,
      to:   input.prospectPhone,
      body: `Your connection request was approved via Proposal Card. Reply to this number to send a message. This number expires in ${PROXY_TTL_HOURS} hours.`,
    }),
  ]);

  return db.proxyConnection.create({
    data: {
      connectionRequestId: input.connectionRequestId,
      ownerId:             input.ownerId,
      proxyNumber:         MASK_NUMBER,
      prospectNumber:      input.prospectPhone,
      expiresAt,
    },
  });
}

// ─── Route an inbound SMS ─────────────────────────────────────────────────────
// Called from /api/webhooks/sms when a message arrives at TWILIO_MASK_NUMBER.
// Looks up who's talking to whom and forwards the message.

export async function routeInboundSms(from: string, body: string): Promise<void> {
  if (!MASK_NUMBER) return;

  const now = new Date();

  // Find active connection where this person is either the owner or prospect
  const proxy = await db.proxyConnection.findFirst({
    where: {
      closedAt:  null,
      expiresAt: { gt: now },
      OR: [
        { prospectNumber: from },
        { owner: { phone: from } },
      ],
    },
    include: {
      owner:             { select: { phone: true } },
      connectionRequest: { select: { prospectContact: true } },
    },
  });

  if (!proxy) {
    // No active session found — send a polite rejection
    await client.messages.create({
      from: MASK_NUMBER,
      to:   from,
      body: "This number is not associated with an active connection or your session has expired.",
    });
    return;
  }

  // Determine recipient: if sender is prospect → forward to owner, and vice versa
  const isProspect = proxy.prospectNumber === from;
  const forwardTo  = isProspect
    ? proxy.owner.phone
    : proxy.prospectNumber;

  if (!forwardTo) return;

  await client.messages.create({
    from: MASK_NUMBER,
    to:   forwardTo,
    body: `[Proposal Card] ${body}`,
  });
}

// ─── Close a proxy connection ─────────────────────────────────────────────────

export async function closeProxyConnection(connectionRequestId: string) {
  const proxy = await db.proxyConnection.findUnique({
    where: { connectionRequestId },
    include: { owner: { select: { phone: true } } },
  });
  if (!proxy || proxy.closedAt) return;

  await db.proxyConnection.update({
    where: { connectionRequestId },
    data:  { closedAt: new Date() },
  });

  // Notify both parties
  if (MASK_NUMBER) {
    await Promise.allSettled([
      proxy.owner.phone && client.messages.create({
        from: MASK_NUMBER, to: proxy.owner.phone,
        body: "Your Proposal Card private connection has been closed.",
      }),
      client.messages.create({
        from: MASK_NUMBER, to: proxy.prospectNumber,
        body: "Your Proposal Card private connection has been closed.",
      }),
    ]);
  }
}

// ─── Get proxy status ─────────────────────────────────────────────────────────

export async function getProxyConnection(connectionRequestId: string) {
  return db.proxyConnection.findUnique({
    where: { connectionRequestId },
  });
}
