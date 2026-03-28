import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateSession } from "@/lib/auth/jwt";
import { db } from "@/lib/db";
import { postWaliNote } from "@/lib/wali/wali";

const noteSchema = z.object({
  connectionId: z.string().min(1),
  content: z.string().min(1).max(300),
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
    const parsed = noteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const note = await postWaliNote(parsed.data.connectionId, user.id, parsed.data.content);
    return NextResponse.json({ note });
  } catch (err) {
    console.error("[wali/notes POST]", err);
    return NextResponse.json({ error: "Failed to post note" }, { status: 500 });
  }
}
