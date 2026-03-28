import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateSession } from "@/lib/auth/jwt";
import { getProfile, updateProfile } from "@/lib/profile/profile";
import { validateIntention } from "@/lib/safety/profanity";

const updateSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  bio:         z.string().max(500).optional(),
  photoUrl:    z.string().url().optional().or(z.literal("")),
  location:    z.string().max(100).optional(),
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
  // Structured profile fields
  country:        z.string().max(100).optional(),
  state:          z.string().max(100).optional(),
  city:           z.string().max(100).optional(),
  height:         z.string().max(10).optional(),
  education:      z.string().max(50).optional(),
  profession:     z.string().max(50).optional(),
  religiosity:    z.string().max(50).optional(),
  maritalHistory: z.string().max(50).optional(),
  hasChildren:    z.string().max(30).optional(),
  wantsChildren:  z.string().max(30).optional(),
  languages:      z.array(z.string().max(30)).max(15).optional(),
  intention:      z.string().max(140).optional(),
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

    // Server-side intention validation
    if (parsed.data.intention) {
      const check = validateIntention(parsed.data.intention);
      if (!check.valid) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
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
