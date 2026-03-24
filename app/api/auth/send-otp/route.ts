import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createEmailOtp } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/email/resend";

// Email-only OTP — phone login removed (phone number still used for proxy SMS)
const schema = z.object({
  type:  z.literal("email"),
  email: z.string().email(),
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

    const code = await createEmailOtp(parsed.data.email);
    await sendOtpEmail(parsed.data.email, code);
    return NextResponse.json({ success: true, message: "Code sent to your email" });
  } catch (err) {
    console.error("[send-otp]", err);
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}
