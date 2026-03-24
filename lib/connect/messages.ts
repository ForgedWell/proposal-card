import { db } from "@/lib/db";
import { ConnectionStatus } from "@prisma/client";

// ─── Send a message ───────────────────────────────────────────────────────────

export async function sendMessage(input: {
  connectionRequestId: string;
  senderId: string;
  recipientId: string;
  body: string;
}) {
  // Verify the connection is approved and the sender is a party to it
  const connection = await db.connectionRequest.findUnique({
    where: { id: input.connectionRequestId },
  });

  if (!connection) throw new Error("CONNECTION_NOT_FOUND");
  if (connection.status !== ConnectionStatus.APPROVED) throw new Error("CONNECTION_NOT_APPROVED");

  const isParty =
    connection.ownerId === input.senderId ||
    connection.prospectId === input.senderId;
  if (!isParty) throw new Error("NOT_A_PARTY");

  return db.message.create({
    data: {
      connectionRequestId: input.connectionRequestId,
      senderId:            input.senderId,
      recipientId:         input.recipientId,
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
    include: { sender: { select: { id: true, displayName: true, email: true } } },
  });
}

// ─── List approved connections ────────────────────────────────────────────────

export async function getApprovedConnections(userId: string) {
  return db.connectionRequest.findMany({
    where: {
      status: ConnectionStatus.APPROVED,
      OR: [{ ownerId: userId }, { prospectId: userId }],
    },
    orderBy: { decidedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}
