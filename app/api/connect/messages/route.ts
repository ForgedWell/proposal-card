import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateSession } from "@/lib/auth/jwt";
import { sendMessage, getThread } from "@/lib/connect/messages";
import { db } from "@/lib/db";

async function getUser(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  return validateSession(token);
}

// GET /api/connect/messages?connectionId=xxx — fetch thread
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connectionId = req.nextUrl.searchParams.get("connectionId");
  if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

  try {
    const messages = await getThread(connectionId, user.id);
    return NextResponse.json({ messages });
  } catch (err: any) {
    if (err.message === "CONNECTION_NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (err.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("[messages GET]", err);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

const sendSchema = z.object({
  connectionId: z.string(),
  body:         z.string().min(1).max(2000),
});

// POST /api/connect/messages — send a message
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const connection = await db.connectionRequest.findUnique({
      where: { id: parsed.data.connectionId },
    });
    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    // Determine recipient — handle case where prospectId is null (pre-account requester)
    let recipientId: string;
    if (connection.ownerId === user.id) {
      // Sender is the card owner → recipient is the prospect
      if (connection.prospectId) {
        recipientId = connection.prospectId;
      } else {
        // Prospect doesn't have an account yet — use ownerId as placeholder
        // (message still stored and visible via token-based conversation)
        recipientId = connection.ownerId;
      }
    } else if (connection.prospectId === user.id) {
      // Sender is the prospect → recipient is the owner
      recipientId = connection.ownerId;
    } else {
      return NextResponse.json({ error: "Not a party to this connection" }, { status: 403 });
    }

    const senderRole = connection.ownerId === user.id ? "owner" : "requester";

    const message = await sendMessage({
      connectionRequestId: parsed.data.connectionId,
      senderId:    user.id,
      recipientId,
      senderRole,
      body:        parsed.data.body,
    });

    return NextResponse.json({ message });
  } catch (err: any) {
    if (err.message === "CONNECTION_NOT_FOUND")    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    if (err.message === "CONNECTION_NOT_APPROVED") return NextResponse.json({ error: "Connection not approved" }, { status: 403 });
    if (err.message === "NOT_A_PARTY")             return NextResponse.json({ error: "Not a party" }, { status: 403 });
    console.error("[messages POST]", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
