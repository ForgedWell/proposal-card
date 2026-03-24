import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getPublicCard, logCardScan } from "@/lib/profile/profile";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
          {/* Header band */}
          <div className="h-20 bg-gradient-to-r from-brand-600 to-brand-400" />

          {/* Avatar */}
          <div className="flex justify-center -mt-10 mb-4">
            {card.photoUrl ? (
              <img
                src={card.photoUrl}
                alt={card.displayName ?? "Photo"}
                className="w-20 h-20 rounded-full border-4 border-white shadow-sm object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-sm bg-brand-600 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {(card.displayName ?? "?")[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="px-6 pb-6 text-center">
            <h1 className="text-xl font-bold text-slate-900">
              {card.displayName ?? "Anonymous"}
            </h1>

            {card.location && (
              <p className="text-sm text-slate-400 mt-1">{card.location}</p>
            )}

            {card.bio && (
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">{card.bio}</p>
            )}

            {/* Links */}
            {links.length > 0 && (
              <div className="mt-5 space-y-2">
                {links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors border border-slate-200"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}

            {/* Contact CTA */}
            <div className="mt-6">
              <ContactButton ownerId={card.id} ownerSlug={card.slug!} />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Powered by Proposal Card
        </p>
      </div>
    </div>
  );
}
