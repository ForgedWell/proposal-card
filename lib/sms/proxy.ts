import twilio from "twilio";
import { db } from "@/lib/db";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const PROXY_SERVICE_SID = process.env.TWILIO_PROXY_SERVICE_SID;
const PROXY_TTL_HOURS   = 72;

// ─── Create a proxy connection ────────────────────────────────────────────────

export async function createProxyConnection(input: {
  connectionRequestId: string;
  ownerId:             string;
  ownerPhone:          string;
  prospectPhone:       string;
}) {
  if (!PROXY_SERVICE_SID) throw new Error("TWILIO_PROXY_SERVICE_SID not configured");

  const expiresAt = new Date(Date.now() + PROXY_TTL_HOURS * 60 * 60 * 1000);

  // Create a Twilio Proxy session
  const session = await client.proxy.v1
    .services(PROXY_SERVICE_SID)
    .sessions.create({
      uniqueName:  input.connectionRequestId,
      ttl:         PROXY_TTL_HOURS * 60 * 60,
      mode:        "voice-and-message",
    });

  // Add both participants
  await client.proxy.v1
    .services(PROXY_SERVICE_SID)
    .sessions(session.sid)
    .participants.create({ identifier: input.ownerPhone });

  const prospectParticipant = await client.proxy.v1
    .services(PROXY_SERVICE_SID)
    .sessions(session.sid)
    .participants.create({ identifier: input.prospectPhone });

  // The proxy number assigned to the prospect is in proxyIdentifier
  const proxyNumber = prospectParticipant.proxyIdentifier ?? "";

  // Persist to DB
  return db.proxyConnection.create({
    data: {
      connectionRequestId: input.connectionRequestId,
      ownerId:             input.ownerId,
      proxyNumber,
      prospectNumber:      input.prospectPhone,
      expiresAt,
    },
  });
}

// ─── Close a proxy connection ─────────────────────────────────────────────────

export async function closeProxyConnection(connectionRequestId: string) {
  if (!PROXY_SERVICE_SID) return;

  const proxy = await db.proxyConnection.findUnique({
    where: { connectionRequestId },
  });
  if (!proxy || proxy.closedAt) return;

  try {
    await client.proxy.v1
      .services(PROXY_SERVICE_SID)
      .sessions(connectionRequestId)
      .remove();
  } catch (err) {
    console.error("[proxy close]", err);
  }

  await db.proxyConnection.update({
    where:  { connectionRequestId },
    data:   { closedAt: new Date() },
  });
}

// ─── Get proxy status ─────────────────────────────────────────────────────────

export async function getProxyConnection(connectionRequestId: string) {
  return db.proxyConnection.findUnique({
    where: { connectionRequestId },
  });
}
