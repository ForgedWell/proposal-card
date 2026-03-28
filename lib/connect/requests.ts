import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";
import { ConnectionStatus } from "@prisma/client";
import { randomUUID } from "crypto";

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

  // Notify owner by email
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

  // Generate conversation token + 30 day expiry
  const conversationToken = randomUUID();
  const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const updated = await db.connectionRequest.update({
    where: { id: requestId },
    data: {
      status: ConnectionStatus.APPROVED,
      decidedAt: new Date(),
      conversationToken,
      tokenExpiresAt,
    },
  });

  // Get owner info for emails
  const owner = await db.user.findUnique({
    where: { id: ownerId },
    select: { email: true, displayName: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://myproposalcard.com";
  const conversationUrl = `${appUrl}/conversation/${conversationToken}`;

  // Email to card owner
  if (owner?.email) {
    const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #2D5A52; margin-bottom: 16px;">
          Introduction Approved
        </h1>
        <p style="color: #475569; line-height: 1.7;">
          You approved <strong>${request.prospectName ?? "someone"}'s</strong> introduction request.
          You can view the conversation in your dashboard.
        </p>
      </div>
    `;
    sendEmail(owner.email, "Proposal Card — You approved an introduction", html).catch(err =>
      console.error("[approve owner email]", err)
    );
  }

  // Email to requester with conversation link
  if (request.prospectContact) {
    const ownerName = owner?.displayName ?? "The card owner";
    const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #2D5A52; margin-bottom: 16px;">
          Your introduction was accepted
        </h1>
        <p style="color: #475569; line-height: 1.7;">
          ${ownerName} would like to exchange a brief introduction.
        </p>
        <p style="color: #475569; line-height: 1.7;">
          Click below to send your first message — no account needed yet.
        </p>
        <a href="${conversationUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background-color: #2D5A52; color: white; text-decoration: none; border-radius: 12px; font-weight: 600;">
          Open Conversation →
        </a>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
          This link is private. Do not share it.<br/>
          Note: After 2 messages each, you'll be invited to create a free Proposal Card account to continue.
        </p>
      </div>
    `;
    sendEmail(request.prospectContact, "Proposal Card — Your introduction was accepted", html).catch(err =>
      console.error("[approve requester email]", err)
    );
  }

  return updated;
}

export async function declineRequest(requestId: string, ownerId: string) {
  const request = await db.connectionRequest.findUnique({ where: { id: requestId } });
  if (!request || request.ownerId !== ownerId) throw new Error("NOT_FOUND");
  if (request.status !== ConnectionStatus.PENDING) throw new Error("ALREADY_DECIDED");

  const updated = await db.connectionRequest.update({
    where: { id: requestId },
    data: { status: ConnectionStatus.DECLINED, decidedAt: new Date() },
  });

  // Send decline email to requester
  if (request.prospectContact) {
    const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #2D5A52; margin-bottom: 16px;">
          Introduction Update
        </h1>
        <p style="color: #475569; line-height: 1.7;">
          Your introduction request was not accepted at this time.
        </p>
        <p style="color: #94a3b8; font-size: 13px;">
          We wish you the best on your journey.
        </p>
      </div>
    `;
    sendEmail(request.prospectContact, "Proposal Card — Introduction update", html).catch(err =>
      console.error("[decline email]", err)
    );
  }

  return updated;
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

// ─── Token lookup ─────────────────────────────────────────────────────────────

export async function getConnectionByToken(token: string) {
  return db.connectionRequest.findUnique({
    where: { conversationToken: token },
    include: {
      owner: { select: { id: true, displayName: true, location: true } },
    },
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

async function notifyOwner(
  email: string,
  ownerName: string | null,
  request: { prospectName: string; prospectContact: string; intent: string }
) {
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h1 style="font-size: 20px; font-weight: 700; color: #2D5A52; margin-bottom: 16px;">
        New Introduction Request
      </h1>
      <p style="color: #475569;">Hi${ownerName ? ` ${ownerName}` : ""},</p>
      <p style="color: #475569; line-height: 1.7;">
        Someone has requested to connect with you via your Proposal Card.
      </p>
      <ul style="color: #475569; line-height: 2;">
        <li><strong>Name:</strong> ${request.prospectName}</li>
        <li><strong>Contact:</strong> ${request.prospectContact}</li>
        <li><strong>Message:</strong> ${request.intent}</li>
      </ul>
      <p style="color: #475569;">Log in to your dashboard to approve or decline.</p>
    </div>
  `;
  await sendEmail(email, "New connection request on your Proposal Card", html);
}

async function notifyWali(
  waliEmail: string,
  ownerName: string | null,
  request: { prospectName: string; prospectContact: string; intent: string }
) {
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <p style="color: #475569;">This is a notification for your role as a guardian (Wali) on Proposal Card.</p>
      <p style="color: #475569;">${ownerName ?? "A user"} has received a new connection request:</p>
      <ul style="color: #475569; line-height: 2;">
        <li><strong>From:</strong> ${request.prospectName}</li>
        <li><strong>Contact:</strong> ${request.prospectContact}</li>
        <li><strong>Message:</strong> ${request.intent}</li>
      </ul>
      <p style="color: #475569;">The card owner will be notified to review and decide.</p>
    </div>
  `;
  await sendEmail(waliEmail, "Proposal Card — guardian notification", html);
}
