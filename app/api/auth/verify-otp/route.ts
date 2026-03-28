import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailOtp } from "@/lib/auth/otp";
import { createSession } from "@/lib/auth/jwt";
import { db } from "@/lib/db";

// Email-only OTP — phone login removed
const schema = z.object({
  type:  z.literal("email"),
  email: z.string().email(),
  code:  z.string().length(6),
  role:  z.string().optional(),
  ward:  z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await verifyEmailOtp(parsed.data.email, parsed.data.code);
    if (!result.valid || !result.userId) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    }

    // Handle wali role setup
    if (parsed.data.role === "wali" && parsed.data.ward) {
      const existing = await db.user.findUnique({ where: { id: result.userId }, select: { waliFor: true } });
      const currentWards = existing?.waliFor ?? [];
      if (!currentWards.includes(parsed.data.ward)) {
        await db.user.update({
          where: { id: result.userId },
          data: { role: "wali", waliFor: { push: parsed.data.ward } },
        });
      }
    }

    const token = await createSession(result.userId);
    const userProfile = await db.user.findUnique({ where: { id: result.userId }, select: { role: true } });
    const redirectTo = userProfile?.role === "wali" ? "/wali" : "/dashboard";

    const response = NextResponse.json({ success: true, redirect: redirectTo });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[verify-otp]", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
