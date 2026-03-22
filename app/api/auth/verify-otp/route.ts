import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailOtp } from "@/lib/auth/otp";
import { verifyPhoneOtp } from "@/lib/sms/twilio";
import { createSession } from "@/lib/auth/jwt";
import { db } from "@/lib/db";

const schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("email"), email: z.string().email(), code: z.string().length(6) }),
  z.object({ type: z.literal("phone"), phone: z.string().min(10), code: z.string().length(6) }),
]);

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

    const data = parsed.data;

    let userId: string | undefined;

    if (data.type === "email") {
      const result = await verifyEmailOtp(data.email, data.code);
      if (!result.valid) {
        return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
      }
      userId = result.userId;
    }

    if (data.type === "phone") {
      const valid = await verifyPhoneOtp(data.phone, data.code);
      if (!valid) {
        return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
      }

      // Upsert user by phone
      const user = await db.user.upsert({
        where: { phone: data.phone },
        update: {},
        create: { phone: data.phone },
      });
      userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Auth failed" }, { status: 401 });
    }

    const token = await createSession(userId);

    const response = NextResponse.json({ success: true, redirect: "/dashboard" });
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
