import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createEmailOtp } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/email/resend";
import { sendPhoneOtp } from "@/lib/sms/twilio";

const schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("email"), email: z.string().email() }),
  z.object({ type: z.literal("phone"), phone: z.string().min(10) }),
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

    if (data.type === "email") {
      const code = await createEmailOtp(data.email);
      await sendOtpEmail(data.email, code);
      return NextResponse.json({ success: true, message: "Code sent to your email" });
    }

    if (data.type === "phone") {
      await sendPhoneOtp(data.phone);
      return NextResponse.json({ success: true, message: "Code sent via SMS" });
    }
  } catch (err) {
    console.error("[send-otp]", err);
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}
