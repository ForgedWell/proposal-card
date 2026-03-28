import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/jwt";
import { executePanic } from "@/lib/safety/panic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await executePanic(user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[safety/panic]", err);
    return NextResponse.json({ error: "Failed to activate safety lockdown" }, { status: 500 });
  }
}
