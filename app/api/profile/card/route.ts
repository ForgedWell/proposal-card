import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/jwt";
import { activateCard, deactivateCard } from "@/lib/profile/profile";

async function getUser(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  return validateSession(token);
}

// POST /api/profile/card — activate card
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const updated = await activateCard(user.id);
    return NextResponse.json({
      success: true,
      slug: updated.slug,
      cardToken: updated.cardToken,
      cardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/c/${updated.slug}`,
    });
  } catch (err) {
    console.error("[activate card]", err);
    return NextResponse.json({ error: "Failed to activate card" }, { status: 500 });
  }
}

// DELETE /api/profile/card — deactivate card
export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await deactivateCard(user.id);
  return NextResponse.json({ success: true });
}
