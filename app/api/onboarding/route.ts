import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/jwt";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.user.update({
    where: { id: user.id },
    data: { onboardingComplete: true },
  });

  return NextResponse.json({ success: true });
}
