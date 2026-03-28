import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getPublicCard, logCardScan } from "@/lib/profile/profile";
import { DEFAULT_CARD_COLOR } from "@/lib/card/templates";
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

  if (!card) {
    return (
      <div className="min-h-screen bg-sanctuary-surface flex items-center justify-center px-4">
        <div className="text-center">
          <span className="material-symbols-outlined text-sanctuary-outline-variant text-5xl mb-4 block">credit_card_off</span>
          <h1 className="font-serif text-2xl text-sanctuary-on-surface mb-2">This card is not available</h1>
          <p className="text-sm text-sanctuary-on-surface-variant">It may have been deactivated or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  // Log the scan (fire-and-forget)
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  const userAgent = headerStore.get("user-agent") ?? undefined;
  logCardScan(card.id, { ip, userAgent }).catch(() => {});

  const color = card.cardColor ?? DEFAULT_CARD_COLOR;
  const waliActive = (card as any).waliActive ?? false;
  const bioTruncated = card.bio && card.bio.length > 120 ? card.bio.slice(0, 117) + "..." : card.bio;

  return (
    <div className="min-h-screen bg-sanctuary-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Marriage card — same design as dashboard Card3DPreview */}
        <div
          className="relative w-full rounded-2xl overflow-hidden select-none"
          style={{
            aspectRatio: "1.586 / 1",
            background: `linear-gradient(145deg, ${color} 0%, ${color}dd 50%, ${color}bb 100%)`,
            boxShadow: "0 12px 32px rgba(47,52,46,0.12)",
          }}
        >
          <div className="h-full flex flex-col justify-between p-7 sm:p-10 text-white">
            {/* Top row */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="font-serif text-2xl font-bold tracking-tight">
                  {card.displayName ?? "Anonymous"}
                </h1>
                {card.location && (
                  <p className="text-xs opacity-80 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    {card.location}
                  </p>
                )}
              </div>
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <span className="material-symbols-outlined">qr_code_2</span>
              </div>
            </div>

            {/* Bottom content */}
            <div className="space-y-4">
              {bioTruncated && (
                <p className="text-sm italic font-serif leading-relaxed opacity-90 line-clamp-2">
                  &ldquo;{bioTruncated}&rdquo;
                </p>
              )}

              <div className="flex gap-4 pt-4 border-t border-white/10">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-tighter opacity-60">Verified By</span>
                  <span className="text-xs font-semibold">{waliActive ? "Guardian Wali" : "Self"}</span>
                </div>
                <div className="flex flex-col border-l border-white/10 pl-4">
                  <span className="text-[10px] uppercase tracking-tighter opacity-60">Status</span>
                  <span className="text-xs font-semibold">Serious Intent</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact button */}
        <div className="mt-6">
          <ContactButton ownerId={card.id} ownerSlug={card.slug!} accentColor={color} />
        </div>

        <p className="text-center text-[10px] uppercase tracking-widest text-sanctuary-outline mt-6">
          Powered by Proposal Card
        </p>
      </div>
    </div>
  );
}
