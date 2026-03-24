import { NextRequest, NextResponse } from "next/server";
import { routeInboundSms } from "@/lib/sms/proxy";

/**
 * POST /api/webhooks/sms
 *
 * Twilio sends inbound SMS here when a message arrives at TWILIO_MASK_NUMBER.
 * Configure this URL in your Twilio number's "A message comes in" webhook.
 *
 * Twilio sends form-encoded body with fields: From, To, Body, etc.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get("From") as string | null;
    const body = formData.get("Body") as string | null;

    if (!from || !body) {
      return new NextResponse("<Response/>", {
        headers: { "Content-Type": "text/xml" },
      });
    }

    await routeInboundSms(from, body);

    // Return empty TwiML — we handle sending ourselves
    return new NextResponse("<Response/>", {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("[webhook/sms]", err);
    return new NextResponse("<Response/>", {
      headers: { "Content-Type": "text/xml" },
      status: 200, // Always 200 to Twilio or it retries
    });
  }
}
