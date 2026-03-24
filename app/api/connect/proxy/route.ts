import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateSession } from "@/lib/auth/jwt";
import { createProxyConnection, closeProxyConnection, getProxyConnection } from "@/lib/sms/proxy";
import { db } from "@/lib/db";
import { ConnectionStatus } from "@prisma/client";

async function getUser(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  return validateSession(token);
}

// GET /api/connect/proxy?connectionId=xxx — check proxy status
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connectionId = req.nextUrl.searchParams.get("connectionId");
  if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

  const proxy = await getProxyConnection(connectionId);
  return NextResponse.json({ proxy });
}

const createSchema = z.object({
  connectionId:   z.string(),
  prospectPhone:  z.string().min(10),
});

// POST /api/connect/proxy — provision a proxy number
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!user.phone) {
    return NextResponse.json({ error: "You need a phone number on your account to use proxy SMS" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const connection = await db.connectionRequest.findUnique({
      where: { id: parsed.data.connectionId },
    });

    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    if (connection.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (connection.status !== ConnectionStatus.APPROVED) {
      return NextResponse.json({ error: "Connection must be approved first" }, { status: 400 });
    }

    // Check not already proxied
    const existing = await getProxyConnection(parsed.data.connectionId);
    if (existing && !existing.closedAt) {
      return NextResponse.json({ proxy: existing });
    }

    const proxy = await createProxyConnection({
      connectionRequestId: parsed.data.connectionId,
      ownerId:             user.id,
      ownerPhone:          user.phone,
      prospectPhone:       parsed.data.prospectPhone,
    });

    return NextResponse.json({ proxy });
  } catch (err: any) {
    if (err.message === "TWILIO_PROXY_SERVICE_SID not configured") {
      return NextResponse.json({ error: "Proxy SMS not configured" }, { status: 503 });
    }
    console.error("[proxy POST]", err);
    return NextResponse.json({ error: "Failed to create proxy connection" }, { status: 500 });
  }
}

// DELETE /api/connect/proxy?connectionId=xxx — close proxy
export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connectionId = req.nextUrl.searchParams.get("connectionId");
  if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

  await closeProxyConnection(connectionId);
  return NextResponse.json({ success: true });
}
