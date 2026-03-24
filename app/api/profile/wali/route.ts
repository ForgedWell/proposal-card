import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateSession } from "@/lib/auth/jwt";
import { db } from "@/lib/db";

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

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        waliEmail:  waliEmail  || null,
        waliPhone:  waliPhone  || null,
        waliActive,
      },
      select: { waliEmail: true, waliPhone: true, waliActive: true },
    });

    return NextResponse.json({ wali: updated });
  } catch (err) {
    console.error("[wali PATCH]", err);
    return NextResponse.json({ error: "Failed to update Wali settings" }, { status: 500 });
  }
}
