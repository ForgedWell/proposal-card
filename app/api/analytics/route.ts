import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/jwt";
import { getAnalytics } from "@/lib/profile/analytics";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const analytics = await getAnalytics(user.id);
  return NextResponse.json(analytics);
}
