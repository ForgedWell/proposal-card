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
}

// ─── Slug ─────────────────────────────────────────────────────────────────────

export async function generateUniqueSlug(base?: string): Promise<string> {
  const clean = base
    ? base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30)
    : "";

  const candidates = clean
    ? [clean, `${clean}-${nanoid(4)}`, nanoid(10)]
    : [nanoid(10)];

  for (const slug of candidates) {
    const exists = await db.user.findUnique({ where: { slug } });
    if (!exists) return slug;
  }

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

export async function getProfile(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
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
      createdAt: true,
    },
  });
}

export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  // Validate slug uniqueness if changing
  if (input.slug) {
    const existing = await db.user.findUnique({ where: { slug: input.slug } });
    if (existing && existing.id !== userId) {
      throw new Error("SLUG_TAKEN");
    }
  }

  return db.user.update({
    where: { id: userId },
    data: {
      ...(input.displayName !== undefined && { displayName: input.displayName }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.photoUrl !== undefined && { photoUrl: input.photoUrl }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.links !== undefined && { links: input.links as any }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.fieldVisibility !== undefined && {
        fieldVisibility: { ...DEFAULT_VISIBILITY, ...input.fieldVisibility } as any,
      }),
      ...(input.cardTemplate !== undefined && { cardTemplate: input.cardTemplate }),
      ...(input.cardColor !== undefined && { cardColor: input.cardColor }),
    },
  });
}

export async function activateCard(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("USER_NOT_FOUND");

  // Generate slug and card token on first activation if not set
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

  // Apply field visibility — strip hidden fields
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
      id: true,
      slug: true,
      displayName: true,
      bio: true,
      photoUrl: true,
      location: true,
      links: true,
      cardActive: true,
    },
  });

  if (!user || !user.cardActive) return null;
  return user;
}

// ─── Card scan logging ────────────────────────────────────────────────────────

export async function logCardScan(userId: string, meta: { ip?: string; userAgent?: string; country?: string }) {
  return db.cardScan.create({
    data: { userId, ...meta },
  });
}
