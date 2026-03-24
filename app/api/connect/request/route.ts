import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createConnectionRequest } from "@/lib/connect/requests";

const schema = z.object({
  ownerId:  z.string().min(1),
  name:     z.string().min(1).max(80),
  contact:  z.string().min(3).max(100),
  intent:   z.string().min(5).max(300),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { ownerId, name, contact, intent } = parsed.data;

    await createConnectionRequest({
      ownerId,
      prospectName:    name,
      prospectContact: contact,
      intent,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "OWNER_NOT_FOUND") {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    console.error("[connect/request]", err);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
