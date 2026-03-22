import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-change-me"
);

export interface JWTPayload {
  userId: string;
  sessionId: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRY ?? "7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const token = await signToken({ userId, sessionId: crypto.randomUUID() });

  await db.session.create({
    data: { userId, token, expiresAt },
  });

  return token;
}

export async function revokeSession(token: string): Promise<void> {
  await db.session.deleteMany({ where: { token } });
}

export async function validateSession(token: string) {
  const payload = await verifyToken(token);
  if (!payload) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await db.session.delete({ where: { token } });
    return null;
  }

  return session.user;
}
