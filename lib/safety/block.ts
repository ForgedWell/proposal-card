import { db } from "@/lib/db";

export async function blockContact(ownerId: string, contact: string, reason?: string) {
  // Auto-decline any PENDING requests from this contact
  await db.connectionRequest.updateMany({
    where: { ownerId, prospectContact: contact, status: "PENDING" },
    data: { status: "DECLINED", decidedAt: new Date() },
  });

  return db.block.create({
    data: { ownerId, contact: contact.toLowerCase(), reason },
  });
}

export async function unblockContact(ownerId: string, contact: string) {
  return db.block.delete({
    where: { ownerId_contact: { ownerId, contact: contact.toLowerCase() } },
  });
}

export async function getBlockedContacts(ownerId: string) {
  return db.block.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function isBlocked(ownerId: string, contact: string): Promise<boolean> {
  const block = await db.block.findFirst({
    where: { ownerId, contact: contact.toLowerCase() },
  });
  return !!block;
}
