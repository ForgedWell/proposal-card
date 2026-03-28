import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";

// ─── Get wards for a Wali ────────────────────────────────────────────────────

export async function getWardsForWali(waliId: string) {
  const wali = await db.user.findUnique({
    where: { id: waliId },
    select: { waliFor: true },
  });
  if (!wali?.waliFor.length) return [];

  return db.user.findMany({
    where: { id: { in: wali.waliFor } },
    select: { id: true, displayName: true, email: true },
  });
}

// ─── Get connections for a ward ──────────────────────────────────────────────

export async function getWaliConnections(wardIds: string[]) {
  return db.connectionRequest.findMany({
    where: {
      ownerId: { in: wardIds },
      status: { in: ["APPROVED", "PAUSED", "WALI_APPROVED", "CLOSED"] },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { id: true, displayName: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      waliNotes: {
        orderBy: { createdAt: "desc" },
        include: { wali: { select: { displayName: true } } },
      },
    },
  });
}

// ─── Get full thread for a connection (read-only for Wali) ───────────────────

export async function getWaliThread(connectionId: string) {
  return db.message.findMany({
    where: { connectionRequestId: connectionId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, displayName: true } } },
  });
}

// ─── Wali actions ────────────────────────────────────────────────────────────

export async function pauseConnection(connectionId: string, waliId: string) {
  const conn = await db.connectionRequest.findUnique({ where: { id: connectionId } });
  if (!conn || conn.status === "CLOSED") throw new Error("CANNOT_PAUSE");

  const updated = await db.connectionRequest.update({
    where: { id: connectionId },
    data: { status: "PAUSED", pausedBy: "wali", pausedAt: new Date() },
  });

  // Notify ward via email
  const ward = await db.user.findUnique({ where: { id: conn.ownerId }, select: { email: true, displayName: true } });
  if (ward?.email) {
    sendEmail(ward.email, "Proposal Card — Connection paused by Guardian",
      `<p>Your Guardian has paused your connection with ${conn.prospectName ?? "a contact"}. Please speak with your Guardian directly.</p>`
    ).catch(err => console.error("[wali pause email]", err));
  }

  return updated;
}

export async function resumeConnection(connectionId: string) {
  return db.connectionRequest.update({
    where: { id: connectionId },
    data: { status: "APPROVED", pausedBy: null, pausedAt: null },
  });
}

export async function closeConnection(connectionId: string, waliId: string) {
  const conn = await db.connectionRequest.findUnique({ where: { id: connectionId } });
  if (!conn) throw new Error("NOT_FOUND");

  const updated = await db.connectionRequest.update({
    where: { id: connectionId },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  // Notify both parties
  const ward = await db.user.findUnique({ where: { id: conn.ownerId }, select: { email: true } });
  if (ward?.email) {
    sendEmail(ward.email, "Proposal Card — Connection closed",
      `<p>Your Guardian has closed your connection with ${conn.prospectName ?? "a contact"}.</p>`
    ).catch(() => {});
  }
  if (conn.prospectContact) {
    sendEmail(conn.prospectContact, "Proposal Card — Connection closed",
      `<p>This connection has been closed. We wish you the best on your journey.</p>`
    ).catch(() => {});
  }

  return updated;
}

export async function approveNextStage(connectionId: string) {
  return db.connectionRequest.update({
    where: { id: connectionId },
    data: { status: "WALI_APPROVED", waliApprovedAt: new Date() },
  });
}

// ─── Post a note ─────────────────────────────────────────────────────────────

export async function postWaliNote(connectionId: string, waliId: string, content: string) {
  return db.waliNote.create({
    data: { connectionRequestId: connectionId, waliId, content },
    include: { wali: { select: { displayName: true } } },
  });
}
