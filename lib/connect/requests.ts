import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";
import { ConnectionStatus } from "@prisma/client";

// ─── Create a connection request ──────────────────────────────────────────────

export async function createConnectionRequest(input: {
  ownerId: string;
  prospectName: string;
  prospectContact: string;
  intent: string;
}) {
  const owner = await db.user.findUnique({ where: { id: input.ownerId } });
  if (!owner) throw new Error("OWNER_NOT_FOUND");

  const request = await db.connectionRequest.create({
    data: {
      ownerId:          input.ownerId,
      prospectName:     input.prospectName,
      prospectContact:  input.prospectContact,
      intent:           input.intent,
      status:           ConnectionStatus.PENDING,
    },
  });

  // Notify owner by email (if they have one)
  if (owner.email) {
    await notifyOwner(owner.email, owner.displayName, input).catch(err =>
      console.error("[notify owner]", err)
    );
  }

  // Notify Wali if active
  if (owner.waliActive && owner.waliEmail) {
    await notifyWali(owner.waliEmail, owner.displayName, input).catch(err =>
      console.error("[notify wali]", err)
    );
  }

  return request;
}

// ─── Owner decisions ──────────────────────────────────────────────────────────

export async function approveRequest(requestId: string, ownerId: string) {
  const request = await db.connectionRequest.findUnique({ where: { id: requestId } });
  if (!request || request.ownerId !== ownerId) throw new Error("NOT_FOUND");
  if (request.status !== ConnectionStatus.PENDING) throw new Error("ALREADY_DECIDED");

  return db.connectionRequest.update({
    where: { id: requestId },
    data: { status: ConnectionStatus.APPROVED, decidedAt: new Date() },
  });
}

export async function declineRequest(requestId: string, ownerId: string) {
  const request = await db.connectionRequest.findUnique({ where: { id: requestId } });
  if (!request || request.ownerId !== ownerId) throw new Error("NOT_FOUND");
  if (request.status !== ConnectionStatus.PENDING) throw new Error("ALREADY_DECIDED");

  return db.connectionRequest.update({
    where: { id: requestId },
    data: { status: ConnectionStatus.DECLINED, decidedAt: new Date() },
  });
}

// ─── Fetch requests ───────────────────────────────────────────────────────────

export async function getPendingRequests(ownerId: string) {
  return db.connectionRequest.findMany({
    where: { ownerId, status: ConnectionStatus.PENDING },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllRequests(ownerId: string) {
  return db.connectionRequest.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

async function notifyOwner(
  email: string,
  ownerName: string | null,
  request: { prospectName: string; prospectContact: string; intent: string }
) {
  const html = `
    <p>Hi${ownerName ? ` ${ownerName}` : ""},</p>
    <p>Someone has requested to connect with you via your Proposal Card.</p>
    <ul>
      <li><strong>Name:</strong> ${request.prospectName}</li>
      <li><strong>Contact:</strong> ${request.prospectContact}</li>
      <li><strong>Message:</strong> ${request.intent}</li>
    </ul>
    <p>Log in to your dashboard to approve or decline.</p>
  `;
  await sendEmail(email, "New connection request on your Proposal Card", html);
}

async function notifyWali(
  waliEmail: string,
  ownerName: string | null,
  request: { prospectName: string; prospectContact: string; intent: string }
) {
  const html = `
    <p>This is a notification for your role as a guardian (Wali) on Proposal Card.</p>
    <p>${ownerName ?? "A user"} has received a new connection request:</p>
    <ul>
      <li><strong>From:</strong> ${request.prospectName}</li>
      <li><strong>Contact:</strong> ${request.prospectContact}</li>
      <li><strong>Message:</strong> ${request.intent}</li>
    </ul>
    <p>The card owner will be notified to review and decide.</p>
  `;
  await sendEmail(waliEmail, "Proposal Card — guardian notification", html);
}
