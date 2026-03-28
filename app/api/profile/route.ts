import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateSession } from "@/lib/auth/jwt";
import { getProfile, updateProfile } from "@/lib/profile/profile";

const updateSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  bio:         z.string().max(500).optional(),
  photoUrl:    z.string().url().optional().or(z.literal("")),
  location:    z.string().max(100).optional(),
  slug:        z.string().min(2).max(40).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes").optional(),
  links: z.array(z.object({
    label: z.string().min(1).max(40),
    url:   z.string().url(),
  })).max(10).optional(),
  cardTemplate: z.enum(["CLASSIC", "MINIMAL", "ELEGANT"]).optional(),
  cardColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color").optional(),
  fieldVisibility: z.object({
    displayName: z.boolean().optional(),
    bio:         z.boolean().optional(),
    location:    z.boolean().optional(),
    photoUrl:    z.boolean().optional(),
    links:       z.boolean().optional(),
  }).optional(),
});

async function getUser(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile(user.id);
  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await updateProfile(user.id, parsed.data);
    return NextResponse.json({ profile: updated });
  } catch (err: any) {
    if (err.message === "SLUG_TAKEN") {
      return NextResponse.json({ error: "That URL is already taken" }, { status: 409 });
    }
    console.error("[profile PATCH]", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
