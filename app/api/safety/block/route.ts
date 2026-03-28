import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateSession } from "@/lib/auth/jwt";
import { blockContact, unblockContact, getBlockedContacts } from "@/lib/safety/block";

const blockSchema = z.object({
  contact: z.string().min(3).max(100),
  reason:  z.string().max(300).optional(),
});

const unblockSchema = z.object({
  contact: z.string().min(3).max(100),
});

async function getUser(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blocks = await getBlockedContacts(user.id);
  return NextResponse.json({ blocks });
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = blockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    await blockContact(user.id, parsed.data.contact, parsed.data.reason);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Already blocked" }, { status: 409 });
    }
    console.error("[safety/block POST]", err);
    return NextResponse.json({ error: "Failed to block contact" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = unblockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    await unblockContact(user.id, parsed.data.contact);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[safety/block DELETE]", err);
    return NextResponse.json({ error: "Failed to unblock" }, { status: 500 });
  }
}
