import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateIntention } from "@/lib/safety/profanity";

const MESSAGE_LIMIT = 2;

// GET /api/conversation?token=xxx — fetch thread by conversation token (no auth)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const connection = await db.connectionRequest.findUnique({
    where: { conversationToken: token },
    include: {
      owner: { select: { id: true, displayName: true, location: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          senderId: true,
          createdAt: true,
        },
      },
    },
  });

  if (!connection) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
    return NextResponse.json({ error: "EXPIRED" }, { status: 410 });
  }

  if (connection.status !== "APPROVED") {
    return NextResponse.json({ error: "NOT_APPROVED" }, { status: 403 });
  }

  return NextResponse.json({
    connectionId: connection.id,
    ownerName: connection.owner.displayName,
    ownerLocation: connection.owner.location,
    ownerId: connection.ownerId,
    prospectName: connection.prospectName,
    prospectContact: connection.prospectContact,
    sentCountOwner: connection.sentCountOwner,
    sentCountRequester: connection.sentCountRequester,
    messages: connection.messages,
    gateReached: connection.sentCountOwner >= MESSAGE_LIMIT && connection.sentCountRequester >= MESSAGE_LIMIT,
  });
}

const sendSchema = z.object({
  token: z.string().min(1),
  body:  z.string().min(1).max(300),
  senderRole: z.enum(["owner", "requester"]),
});

// POST /api/conversation — send message via token (no auth)
export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = sendSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { token, body, senderRole } = parsed.data;

    // Profanity + dignity check
    const check = validateIntention(body);
    if (!check.valid) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const connection = await db.connectionRequest.findUnique({
      where: { conversationToken: token },
    });

    if (!connection) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (connection.status !== "APPROVED") return NextResponse.json({ error: "NOT_APPROVED" }, { status: 403 });
    if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
      return NextResponse.json({ error: "EXPIRED" }, { status: 410 });
    }

    // Check message gate
    const countField = senderRole === "owner" ? "sentCountOwner" : "sentCountRequester";
    if (connection[countField] >= MESSAGE_LIMIT) {
      return NextResponse.json({ error: "MESSAGE_GATE", message: "Message limit reached. Create an account to continue." }, { status: 403 });
    }

    // Determine sender/recipient IDs
    // For token-based: owner has a user ID, requester may not
    const senderId = senderRole === "owner" ? connection.ownerId : (connection.prospectId ?? "anonymous");
    const recipientId = senderRole === "owner" ? (connection.prospectId ?? "anonymous") : connection.ownerId;

    // Create message (using raw create since sendMessage requires both users to exist)
    const message = await db.message.create({
      data: {
        connectionRequestId: connection.id,
        senderId: senderId === "anonymous" ? connection.ownerId : senderId, // placeholder for schema FK
        recipientId: recipientId === "anonymous" ? connection.ownerId : recipientId,
        body,
      },
    });

    // Increment sent count + reset token expiry on activity
    await db.connectionRequest.update({
      where: { id: connection.id },
      data: {
        [countField]: { increment: 1 },
        tokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      message: { id: message.id, body: message.body, senderId: message.senderId, createdAt: message.createdAt },
      gateReached: (connection[countField] + 1) >= MESSAGE_LIMIT,
    });
  } catch (err) {
    console.error("[conversation POST]", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
