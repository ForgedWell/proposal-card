import { db } from "@/lib/db";
import { OtpType } from "@prisma/client";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createEmailOtp(email: string): Promise<string> {
  // Invalidate any existing OTPs for this email
  await db.otpCode.updateMany({
    where: { target: email, type: OtpType.EMAIL, usedAt: null },
    data: { usedAt: new Date() },
  });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Find existing user
  const user = await db.user.findUnique({ where: { email } });

  await db.otpCode.create({
    data: {
      target: email,
      code,
      type: OtpType.EMAIL,
      expiresAt,
      userId: user?.id ?? null,
    },
  });

  return code;
}

export async function verifyEmailOtp(
  email: string,
  code: string
): Promise<{ valid: boolean; userId?: string }> {
  const otp = await db.otpCode.findFirst({
    where: {
      target: email,
      type: OtpType.EMAIL,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.code !== code) {
    return { valid: false };
  }

  // Mark used
  await db.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

  // Upsert user
  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  return { valid: true, userId: user.id };
}
