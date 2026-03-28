import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/jwt";
import { db } from "@/lib/db";
import { generateCardPdf } from "@/lib/card/pdf";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: { slug: true, displayName: true, cardActive: true, cardTemplate: true, cardColor: true },
  });

  if (!profile?.cardActive || !profile.slug) {
    return NextResponse.json({ error: "Activate your card first" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://proposalcard.com";

  const pdf = await generateCardPdf({
    displayName: profile.displayName ?? "Proposal Card",
    slug: profile.slug,
    appUrl,
    cardTemplate: profile.cardTemplate,
    cardColor: profile.cardColor ?? undefined,
  });

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="proposal-card.pdf"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
