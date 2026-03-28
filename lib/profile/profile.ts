import { db } from "@/lib/db";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

export interface ProfileLink {
  label: string;
  url: string;
}

export interface FieldVisibility {
  displayName: boolean;
  bio: boolean;
  location: boolean;
  photoUrl: boolean;
  links: boolean;
}

export const DEFAULT_VISIBILITY: FieldVisibility = {
  displayName: true,
  bio: true,
  location: true,
  photoUrl: false,
  links: false,
};

export interface ProfileUpdateInput {
  displayName?: string;
  bio?: string;
  photoUrl?: string;
  location?: string;
  links?: ProfileLink[];
  slug?: string;
  fieldVisibility?: Partial<FieldVisibility>;
  cardTemplate?: "CLASSIC" | "MINIMAL" | "ELEGANT";
  cardColor?: string;
  // Structured profile fields
  country?: string;
  state?: string;
  city?: string;
  height?: string;
  education?: string;
  profession?: string;
  religiosity?: string;
  maritalHistory?: string;
  hasChildren?: string;
  wantsChildren?: string;
  languages?: string[];
  intention?: string;
}

// ─── Slug ─────────────────────────────────────────────────────────────────────

export async function generateUniqueSlug(base?: string): Promise<string> {
  const clean = base
    ? base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20)
    : "";

  const suffix = nanoid(4);
  const candidate = clean ? `${clean}-${suffix}` : nanoid(10);

  const exists = await db.user.findUnique({ where: { slug: candidate } });
  if (!exists) return candidate;

  return nanoid(12);
}

// ─── Card token ───────────────────────────────────────────────────────────────

export async function generateCardToken(): Promise<string> {
  const tokenAlphabet = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 24);
  let token: string;
  do {
    token = tokenAlphabet();
  } while (await db.user.findUnique({ where: { cardToken: token } }));
  return token;
}

// ─── Profile CRUD ─────────────────────────────────────────────────────────────

const PROFILE_SELECT = {
  id: true,
  email: true,
  phone: true,
  slug: true,
  displayName: true,
  bio: true,
  photoUrl: true,
  location: true,
  links: true,
  cardToken: true,
  cardActive: true,
  cardTemplate: true,
  cardColor: true,
  waliEmail: true,
  waliPhone: true,
  waliActive: true,
  fieldVisibility: true,
  country: true,
  state: true,
  city: true,
  height: true,
  education: true,
  profession: true,
  religiosity: true,
  maritalHistory: true,
  hasChildren: true,
  wantsChildren: true,
  languages: true,
  intention: true,
  createdAt: true,
} as const;

export async function getProfile(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: PROFILE_SELECT,
  });
}

export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  // Auto-generate slug on first save if displayName is set and slug doesn't exist
  const user = await db.user.findUnique({ where: { id: userId }, select: { slug: true } });
  let slugToSet: string | undefined;
  if (!user?.slug && input.displayName) {
    slugToSet = await generateUniqueSlug(input.displayName);
  }

  // Build location string from structured fields for backward compat
  const locationParts = [input.city, input.state, input.country].filter(Boolean);
  const locationString = locationParts.length > 0 ? locationParts.join(", ") : undefined;

  // Build bio string from intention for backward compat
  const bioString = input.intention !== undefined ? input.intention : undefined;

  return db.user.update({
    where: { id: userId },
    data: {
      ...(input.displayName !== undefined && { displayName: input.displayName }),
      ...(bioString !== undefined && { bio: bioString }),
      ...(input.photoUrl !== undefined && { photoUrl: input.photoUrl }),
      ...(locationString !== undefined && { location: locationString }),
      ...(input.links !== undefined && { links: input.links as any }),
      ...(slugToSet && { slug: slugToSet }),
      ...(input.fieldVisibility !== undefined && {
        fieldVisibility: { ...DEFAULT_VISIBILITY, ...input.fieldVisibility } as any,
      }),
      ...(input.cardTemplate !== undefined && { cardTemplate: input.cardTemplate }),
      ...(input.cardColor !== undefined && { cardColor: input.cardColor }),
      // Structured fields
      ...(input.country !== undefined && { country: input.country }),
      ...(input.state !== undefined && { state: input.state }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.height !== undefined && { height: input.height }),
      ...(input.education !== undefined && { education: input.education }),
      ...(input.profession !== undefined && { profession: input.profession }),
      ...(input.religiosity !== undefined && { religiosity: input.religiosity }),
      ...(input.maritalHistory !== undefined && { maritalHistory: input.maritalHistory }),
      ...(input.hasChildren !== undefined && { hasChildren: input.hasChildren }),
      ...(input.wantsChildren !== undefined && { wantsChildren: input.wantsChildren }),
      ...(input.languages !== undefined && { languages: input.languages as any }),
      ...(input.intention !== undefined && { intention: input.intention }),
    },
    select: PROFILE_SELECT,
  });
}

export async function activateCard(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("USER_NOT_FOUND");

  const slug = user.slug ?? (await generateUniqueSlug(user.displayName ?? undefined));
  const cardToken = user.cardToken ?? (await generateCardToken());

  return db.user.update({
    where: { id: userId },
    data: { cardActive: true, slug, cardToken },
  });
}

export async function deactivateCard(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { cardActive: false },
  });
}

// ─── Public card lookup ───────────────────────────────────────────────────────

export async function getPublicCard(slug: string) {
  const user = await db.user.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      displayName: true,
      bio: true,
      photoUrl: true,
      location: true,
      links: true,
      cardActive: true,
      cardToken: true,
      cardTemplate: true,
      cardColor: true,
      fieldVisibility: true,
    },
  });

  if (!user || !user.cardActive) return null;

  const vis = { ...DEFAULT_VISIBILITY, ...(user.fieldVisibility as Partial<FieldVisibility> | null) };
  return {
    ...user,
    displayName: vis.displayName ? user.displayName : null,
    bio: vis.bio ? user.bio : null,
    photoUrl: vis.photoUrl ? user.photoUrl : null,
    location: vis.location ? user.location : null,
    links: vis.links ? user.links : null,
  };
}

export async function getCardByToken(token: string) {
  const user = await db.user.findUnique({
    where: { cardToken: token },
    select: {
      id: true, slug: true, displayName: true, bio: true,
      photoUrl: true, location: true, links: true, cardActive: true,
    },
  });
  if (!user || !user.cardActive) return null;
  return user;
}

// ─── Card scan logging ────────────────────────────────────────────────────────

export async function logCardScan(userId: string, meta: { ip?: string; userAgent?: string; country?: string }) {
  return db.cardScan.create({ data: { userId, ...meta } });
}
