import { db } from "@/lib/db";

const MESSAGEABLE_STATUSES = ["APPROVED", "WALI_APPROVED"];

// ─── Send a message ───────────────────────────────────────────────────────────

export async function sendMessage(input: {
  connectionRequestId: string;
  senderId: string;
  recipientId: string;
  senderRole?: string;
  body: string;
}) {
  const connection = await db.connectionRequest.findUnique({
    where: { id: input.connectionRequestId },
  });

  if (!connection) throw new Error("CONNECTION_NOT_FOUND");
  if (!MESSAGEABLE_STATUSES.includes(connection.status)) throw new Error("CONNECTION_NOT_APPROVED");

  // Verify sender is a party (owner or prospect)
  const isParty =
    connection.ownerId === input.senderId ||
    connection.prospectId === input.senderId;
  if (!isParty) throw new Error("NOT_A_PARTY");

  return db.message.create({
    data: {
      connectionRequestId: input.connectionRequestId,
      senderId:            input.senderId,
      recipientId:         input.recipientId,
      senderRole:          input.senderRole ?? null,
      body:                input.body,
    },
    include: { sender: { select: { id: true, displayName: true, email: true } } },
  });
}

// ─── Fetch thread ─────────────────────────────────────────────────────────────

export async function getThread(connectionRequestId: string, userId: string) {
  const connection = await db.connectionRequest.findUnique({
    where: { id: connectionRequestId },
  });

  if (!connection) throw new Error("CONNECTION_NOT_FOUND");

  const isParty =
    connection.ownerId === userId ||
    connection.prospectId === userId;
  if (!isParty) throw new Error("FORBIDDEN");

  // Mark unread messages as read
  await db.message.updateMany({
    where: { connectionRequestId, recipientId: userId, readAt: null },
    data:  { readAt: new Date() },
  });

  return db.message.findMany({
    where: { connectionRequestId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, body: true, senderId: true, senderRole: true,
      recipientId: true, readAt: true, createdAt: true,
      sender: { select: { id: true, displayName: true, email: true } },
    },
  });
}

// ─── List approved connections ────────────────────────────────────────────────

export async function getApprovedConnections(userId: string) {
  return db.connectionRequest.findMany({
    where: {
      status: { in: ["APPROVED", "WALI_APPROVED"] },
      OR: [{ ownerId: userId }, { prospectId: userId }],
    },
    orderBy: { decidedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderId: true, senderRole: true },
      },
    },
  });
}
