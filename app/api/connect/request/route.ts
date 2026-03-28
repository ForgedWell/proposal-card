import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createConnectionRequest } from "@/lib/connect/requests";
import { isBlocked } from "@/lib/safety/block";
import { checkRateLimit, recordContactAttempt } from "@/lib/safety/rate-limit";
import { verifyTurnstile } from "@/lib/safety/turnstile";

const schema = z.object({
  ownerId:        z.string().min(1),
  name:           z.string().min(1).max(80),
  contact:        z.string().min(3).max(100),
  intent:         z.string().min(5).max(300),
  turnstileToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { ownerId, name, contact, intent, turnstileToken } = parsed.data;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    // Turnstile verification
    if (turnstileToken) {
      const valid = await verifyTurnstile(turnstileToken, ip ?? undefined);
      if (!valid) {
        return NextResponse.json({ error: "CAPTCHA verification failed" }, { status: 403 });
      }
    }

    // Block check
    if (await isBlocked(ownerId, contact)) {
      return NextResponse.json({ error: "Unable to send request" }, { status: 403 });
    }

    // Rate limit check
    const limit = await checkRateLimit(ownerId, ip, contact);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "86400" } }
      );
    }

    await createConnectionRequest({
      ownerId,
      prospectName:    name,
      prospectContact: contact,
      intent,
    });

    // Record attempt (fire-and-forget)
    recordContactAttempt(ownerId, ip, contact).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "OWNER_NOT_FOUND") {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    console.error("[connect/request]", err);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
