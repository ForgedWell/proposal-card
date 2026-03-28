import twilio from "twilio";
import { db } from "@/lib/db";

const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const FROM = process.env.TWILIO_MASK_NUMBER ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://myproposalcard.com";

// ─── Send SMS (or log in dev) ────────────────────────────────────────────────

async function sendSms(to: string, body: string) {
  if (!client || !FROM) {
    console.log(`[DEV SMS → ${to}] ${body}`);
    return;
  }
  await client.messages.create({ from: FROM, to, body });
}

// ─── Rate limiting: 1 SMS per connection per hour per type ───────────────────

async function canSendAlert(waliId: string, connectionId: string | null, alertType: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const count = await db.smsAlert.count({
    where: {
      waliId,
      connectionRequestId: connectionId,
      alertType,
      sentAt: { gte: oneHourAgo },
    },
  });
  return count === 0;
}

async function recordAlert(waliId: string, connectionId: string | null, alertType: string) {
  await db.smsAlert.create({
    data: { waliId, connectionRequestId: connectionId, alertType },
  });
}

// ─── Alert: New connection request ───────────────────────────────────────────

export async function alertNewRequest(waliPhone: string, waliId: string, wardName: string, requesterName: string) {
  if (!await canSendAlert(waliId, null, "new_request")) return;

  await sendSms(waliPhone,
    `Proposal Card: ${wardName} received a new introduction request from ${requesterName}. ` +
    `Log in to review: ${APP_URL}/wali ` +
    `Reply STOP to pause all of ${wardName}'s connections.`
  );
  await recordAlert(waliId, null, "new_request");
}

// ─── Alert: New message in conversation ──────────────────────────────────────

export async function alertNewMessage(waliPhone: string, waliId: string, wardName: string, otherName: string, connectionId: string) {
  if (!await canSendAlert(waliId, connectionId, "new_message")) return;

  await sendSms(waliPhone,
    `Proposal Card: New message in ${wardName}'s conversation with ${otherName}. ` +
    `View thread: ${APP_URL}/wali ` +
    `Reply STOP to pause this conversation.`
  );
  await recordAlert(waliId, connectionId, "new_message");
}

// ─── Alert: Connection approved ──────────────────────────────────────────────

export async function alertConnectionApproved(waliPhone: string, waliId: string, wardName: string, otherName: string) {
  await sendSms(waliPhone,
    `Proposal Card: ${wardName} approved a connection with ${otherName}. Guardian oversight is now active.`
  );
}

// ─── Alert: Wali approved next stage ─────────────────────────────────────────

export async function alertWaliApproved(waliPhone: string, wardName: string, otherName: string) {
  await sendSms(waliPhone,
    `Proposal Card: You approved ${wardName}'s connection with ${otherName} to move forward. May Allah bless this process.`
  );
}

// ─── Pause all connections for a Wali (from STOP SMS) ────────────────────────

export async function pauseAllConnectionsForWali(waliId: string) {
  // Find all wards
  const wali = await db.user.findUnique({ where: { id: waliId }, select: { waliFor: true } });
  if (!wali?.waliFor.length) return 0;

  const result = await db.connectionRequest.updateMany({
    where: {
      ownerId: { in: wali.waliFor },
      status: "APPROVED",
    },
    data: { status: "PAUSED", pausedBy: "wali", pausedAt: new Date() },
  });
  return result.count;
}

// ─── Resume most recent paused connection ────────────────────────────────────

export async function resumeLatestPausedForWali(waliId: string) {
  const wali = await db.user.findUnique({ where: { id: waliId }, select: { waliFor: true } });
  if (!wali?.waliFor.length) return null;

  const paused = await db.connectionRequest.findFirst({
    where: { ownerId: { in: wali.waliFor }, status: "PAUSED", pausedBy: "wali" },
    orderBy: { pausedAt: "desc" },
  });

  if (!paused) return null;

  return db.connectionRequest.update({
    where: { id: paused.id },
    data: { status: "APPROVED", pausedBy: null, pausedAt: null },
  });
}
