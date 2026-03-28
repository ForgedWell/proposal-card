import { db } from "@/lib/db";

const CONTACT_LIMIT = 5;   // max requests per contact per owner per 24h
const IP_LIMIT = 15;       // max requests per IP per owner per 24h
const WINDOW_MS = 24 * 60 * 60 * 1000;

export async function recordContactAttempt(ownerId: string, ip: string | null, contact: string | null) {
  return db.contactAttempt.create({
    data: { ownerId, ip, contact: contact?.toLowerCase() ?? null },
  });
}

export async function checkRateLimit(
  ownerId: string,
  ip: string | null,
  contact: string | null
): Promise<{ allowed: boolean; remaining: number }> {
  const since = new Date(Date.now() - WINDOW_MS);

  // Check per-contact limit
  if (contact) {
    const contactCount = await db.contactAttempt.count({
      where: { ownerId, contact: contact.toLowerCase(), createdAt: { gte: since } },
    });
    if (contactCount >= CONTACT_LIMIT) {
      return { allowed: false, remaining: 0 };
    }
  }

  // Check per-IP limit
  if (ip) {
    const ipCount = await db.contactAttempt.count({
      where: { ownerId, ip, createdAt: { gte: since } },
    });
    if (ipCount >= IP_LIMIT) {
      return { allowed: false, remaining: 0 };
    }
  }

  const used = contact
    ? await db.contactAttempt.count({
        where: { ownerId, contact: contact.toLowerCase(), createdAt: { gte: since } },
      })
    : 0;

  return { allowed: true, remaining: CONTACT_LIMIT - used };
}
