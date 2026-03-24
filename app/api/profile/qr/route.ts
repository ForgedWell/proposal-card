import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/jwt";
import { db } from "@/lib/db";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: { slug: true, cardToken: true, cardActive: true },
  });

  if (!profile?.cardActive || !profile.slug) {
    return NextResponse.json({ error: "Activate your card first" }, { status: 400 });
  }

  const cardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/c/${profile.slug}`;

  // Return as SVG (clean, scalable)
  const svg = await QRCode.toString(cardUrl, {
    type: "svg",
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
