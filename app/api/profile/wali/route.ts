import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateSession } from "@/lib/auth/jwt";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";

const schema = z.object({
  waliEmail:  z.string().email().optional().or(z.literal("")),
  waliPhone:  z.string().min(10).optional().or(z.literal("")),
  waliActive: z.boolean(),
});

async function getUser(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: { waliEmail: true, waliPhone: true, waliActive: true },
  });

  return NextResponse.json({ wali: profile });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { waliEmail, waliPhone, waliActive } = parsed.data;

    // Can't activate without at least one contact
    if (waliActive && !waliEmail && !waliPhone) {
      return NextResponse.json({ error: "Provide an email or phone for your Wali before activating" }, { status: 400 });
    }

    const ward = await db.user.findUnique({ where: { id: user.id }, select: { displayName: true } });

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        waliEmail:  waliEmail  || null,
        waliPhone:  waliPhone  || null,
        waliActive,
      },
      select: { waliEmail: true, waliPhone: true, waliActive: true },
    });

    // Send Wali invitation if email provided
    if (waliEmail && waliActive) {
      const existingWali = await db.user.findFirst({ where: { email: waliEmail, role: "wali" } });
      if (!existingWali) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://myproposalcard.com";
        const inviteUrl = `${appUrl}/login?email=${encodeURIComponent(waliEmail)}&role=wali&ward=${user.id}`;
        const wardName = ward?.displayName ?? "Someone";
        sendEmail(waliEmail, "Proposal Card — Guardian invitation",
          `<div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <h1 style="font-size: 20px; font-weight: 700; color: #2D5A52;">Guardian Invitation</h1>
            <p style="color: #475569; line-height: 1.7;">
              ${wardName} has added you as their Guardian on Proposal Card.
              Create your Guardian account to oversee their connections.
            </p>
            <a href="${inviteUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background-color: #2D5A52; color: white; text-decoration: none; border-radius: 12px; font-weight: 600;">
              Accept Guardian Role →
            </a>
          </div>`
        ).catch(err => console.error("[wali invite]", err));
      } else {
        // Link existing wali to this ward
        if (!existingWali.waliFor?.includes(user.id)) {
          await db.user.update({
            where: { id: existingWali.id },
            data: { waliFor: { push: user.id } },
          });
        }
      }
    }

    return NextResponse.json({ wali: updated });
  } catch (err) {
    console.error("[wali PATCH]", err);
    return NextResponse.json({ error: "Failed to update Wali settings" }, { status: 500 });
  }
}
