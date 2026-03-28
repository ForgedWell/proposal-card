import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pauseAllConnectionsForWali, resumeLatestPausedForWali } from "@/lib/sms/wali-alerts";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://myproposalcard.com";

/**
 * POST /api/webhooks/sms
 *
 * Twilio inbound SMS webhook. Handles STOP/PAUSE/RESUME keywords from Wali.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get("From") as string | null;
    const body = (formData.get("Body") as string ?? "").trim().toUpperCase();

    if (!from) return twimlResponse("");

    // Find Wali by phone number
    const wali = await db.user.findFirst({
      where: { phone: from, role: "wali" },
      select: { id: true, waliFor: true },
    });

    if (!wali) {
      return twimlResponse(
        `Proposal Card: Reply STOP to pause connections or log in to manage: ${APP_URL}/wali`
      );
    }

    if (body === "STOP" || body === "PAUSE") {
      const count = await pauseAllConnectionsForWali(wali.id);
      return twimlResponse(
        `Proposal Card: ${count} connection(s) paused. Log in to review and resume: ${APP_URL}/wali`
      );
    }

    if (body === "RESUME") {
      const resumed = await resumeLatestPausedForWali(wali.id);
      return twimlResponse(
        resumed ? "Proposal Card: Connection resumed." : "Proposal Card: No paused connections to resume."
      );
    }

    return twimlResponse(
      `Proposal Card: Reply STOP to pause connections or log in to manage: ${APP_URL}/wali`
    );
  } catch (err) {
    console.error("[webhook/sms]", err);
    return twimlResponse("");
  }
}

function twimlResponse(message: string) {
  const xml = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  return new NextResponse(xml, { headers: { "Content-Type": "text/xml" }, status: 200 });
}
