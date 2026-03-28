import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateSession } from "@/lib/auth/jwt";
import { db } from "@/lib/db";
import { pauseConnection, resumeConnection, closeConnection, approveNextStage } from "@/lib/wali/wali";

const actionSchema = z.object({
  connectionId: z.string().min(1),
  action: z.enum(["pause", "resume", "close", "approve_next"]),
});

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (profile?.role !== "wali") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const { connectionId, action } = parsed.data;

    switch (action) {
      case "pause":
        await pauseConnection(connectionId, user.id);
        break;
      case "resume":
        await resumeConnection(connectionId);
        break;
      case "close":
        await closeConnection(connectionId, user.id);
        break;
      case "approve_next":
        await approveNextStage(connectionId);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[wali/actions POST]", err);
    return NextResponse.json({ error: err.message ?? "Failed" }, { status: 500 });
  }
}
