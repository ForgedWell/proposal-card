import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/jwt";
import { db } from "@/lib/db";
import { getWardsForWali, getWaliConnections, getWaliThread } from "@/lib/wali/wali";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.user.findUnique({ where: { id: user.id }, select: { role: true, waliFor: true } });
  if (profile?.role !== "wali") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const connectionId = req.nextUrl.searchParams.get("threadId");

  // If threadId provided, return full message thread
  if (connectionId) {
    const messages = await getWaliThread(connectionId);
    return NextResponse.json({ messages });
  }

  // Otherwise return wards + connections
  const wards = await getWardsForWali(user.id);
  const wardIds = wards.map(w => w.id);
  const connections = await getWaliConnections(wardIds);

  return NextResponse.json({ wards, connections });
}
