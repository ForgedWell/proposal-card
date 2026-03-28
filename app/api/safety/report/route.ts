import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateSession } from "@/lib/auth/jwt";
import { createReport } from "@/lib/safety/report";

const reportSchema = z.object({
  connectionRequestId: z.string().optional(),
  contact:             z.string().max(100).optional(),
  category:            z.enum(["SPAM", "HARASSMENT", "INAPPROPRIATE", "OTHER"]),
  details:             z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    await createReport({ reporterId: user.id, ...parsed.data });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[safety/report POST]", err);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
