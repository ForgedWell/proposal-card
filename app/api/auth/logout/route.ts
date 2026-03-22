import { NextRequest, NextResponse } from "next/server";
import { revokeSession } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;

  if (token) {
    await revokeSession(token);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("session", "", { maxAge: 0, path: "/" });
  return response;
}
