import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getPublicCard, logCardScan } from "@/lib/profile/profile";
import { DEFAULT_CARD_COLOR } from "@/lib/card/templates";
import CardRenderer from "@/components/CardRenderer";
import ContactButton from "./ContactButton";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const card = await getPublicCard(params.slug);
  if (!card) return { title: "Card not found" };
  return {
    title: `${card.displayName ?? "Proposal Card"} — Proposal Card`,
    description: card.bio ?? "View this Proposal Card",
  };
}

export default async function PublicCardPage({ params }: Props) {
  const card = await getPublicCard(params.slug);
  if (!card) notFound();

  // Log the scan (fire-and-forget)
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  const userAgent = headerStore.get("user-agent") ?? undefined;
  logCardScan(card.id, { ip, userAgent }).catch(() => {});

  const links = (card.links ?? []) as { label: string; url: string }[];
  const template = (card as any).cardTemplate ?? "CLASSIC";
  const color = (card as any).cardColor ?? DEFAULT_CARD_COLOR;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <CardRenderer
          template={template}
          color={color}
          displayName={card.displayName}
          bio={card.bio}
          photoUrl={card.photoUrl}
          location={card.location}
          links={links}
        >
          <ContactButton ownerId={card.id} ownerSlug={card.slug!} />
        </CardRenderer>

        <p className="text-center text-xs text-slate-400 mt-4">
          Powered by Proposal Card
        </p>
      </div>
    </div>
  );
}
