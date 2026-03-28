import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateSession } from "@/lib/auth/jwt";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/profile/profile";

const setupSchema = z.object({
  fullName:    z.string().min(1).max(80),
  dateOfBirth: z.string().min(1), // ISO date string
  gender:      z.enum(["brother", "sister"]),
  country:     z.string().min(1).max(100),
  city:        z.string().max(100).optional(),
});

function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = setupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { fullName, dateOfBirth, gender, country, city } = parsed.data;

    // Server-side age gate
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return NextResponse.json({ error: "Invalid date of birth" }, { status: 400 });
    }

    const age = calculateAge(dob);
    if (age < 18) {
      return NextResponse.json({ error: "Must be 18 or older to use Proposal Card" }, { status: 400 });
    }

    // Auto-generate slug from name
    const existing = await db.user.findUnique({ where: { id: user.id }, select: { slug: true } });
    const slug = existing?.slug ?? await generateUniqueSlug(fullName);

    const locationParts = [city, country].filter(Boolean);

    await db.user.update({
      where: { id: user.id },
      data: {
        fullName,
        dateOfBirth: dob,
        gender,
        displayName: fullName,
        country,
        city: city ?? null,
        location: locationParts.join(", "),
        slug,
        profileSetupComplete: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[profile/setup]", err);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
