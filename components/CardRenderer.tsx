"use client";

import { ReactNode } from "react";

interface CardRendererProps {
  template: "CLASSIC" | "MINIMAL" | "ELEGANT";
  color: string;
  displayName: string | null;
  bio: string | null;
  photoUrl: string | null;
  location: string | null;
  links: { label: string; url: string }[];
  children?: ReactNode;
}

function Avatar({ photoUrl, displayName, color, size }: { photoUrl: string | null; displayName: string | null; color: string; size: string }) {
  const initial = (displayName ?? "?")[0].toUpperCase();
  const sizeClasses = size === "lg" ? "w-20 h-20 text-2xl" : "w-14 h-14 text-lg";

  if (photoUrl) {
    return <img src={photoUrl} alt={displayName ?? "Photo"} className={`${sizeClasses} rounded-full border-4 border-white shadow-sm object-cover`} />;
  }
  return (
    <div className={`${sizeClasses} rounded-full border-4 border-white shadow-sm flex items-center justify-center`} style={{ backgroundColor: color }}>
      <span className="text-white font-bold">{initial}</span>
    </div>
  );
}

function ClassicCard({ color, displayName, bio, photoUrl, location, links, children }: Omit<CardRendererProps, "template">) {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
      <div className="h-20" style={{ background: `linear-gradient(to right, ${color}, ${color}dd)` }} />
      <div className="flex justify-center -mt-10 mb-4">
        <Avatar photoUrl={photoUrl} displayName={displayName} color={color} size="lg" />
      </div>
      <div className="px-6 pb-6 text-center">
        <h1 className="text-xl font-bold text-slate-900">{displayName ?? "Anonymous"}</h1>
        {location && <p className="text-sm text-slate-400 mt-1">{location}</p>}
        {bio && <p className="text-sm text-slate-600 mt-3 leading-relaxed">{bio}</p>}
        {links.length > 0 && (
          <div className="mt-5 space-y-2">
            {links.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="block w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors border border-slate-200">
                {link.label}
              </a>
            ))}
          </div>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}

function MinimalCard({ color, displayName, bio, photoUrl, location, links, children }: Omit<CardRendererProps, "template">) {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden p-8">
      <div className="flex items-center gap-4 mb-6">
        <Avatar photoUrl={photoUrl} displayName={displayName} color={color} size="sm" />
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{displayName ?? "Anonymous"}</h1>
          {location && <p className="text-xs text-slate-400">{location}</p>}
        </div>
      </div>
      {bio && <p className="text-sm text-slate-600 leading-relaxed mb-6">{bio}</p>}
      {children && <div>{children}</div>}
    </div>
  );
}

function ElegantCard({ color, displayName, bio, photoUrl, location, links, children }: Omit<CardRendererProps, "template">) {
  return (
    <div className="bg-slate-900 rounded-3xl shadow-lg overflow-hidden">
      <div className="h-1" style={{ backgroundColor: color }} />
      <div className="px-8 pt-8 pb-6">
        <div className="flex justify-center mb-5">
          {photoUrl ? (
            <img src={photoUrl} alt={displayName ?? "Photo"} className="w-20 h-20 rounded-full object-cover" style={{ border: `3px solid ${color}` }} />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ border: `3px solid ${color}`, backgroundColor: `${color}22` }}>
              <span className="text-2xl font-bold" style={{ color }}>{(displayName ?? "?")[0].toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-amber-50 font-serif">{displayName ?? "Anonymous"}</h1>
          {location && <p className="text-sm text-slate-400 mt-1">{location}</p>}
          {bio && <p className="text-sm text-slate-300 mt-3 leading-relaxed font-serif">{bio}</p>}
          {links.length > 0 && (
            <div className="mt-5 space-y-2">
              {links.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="block w-full py-2.5 px-4 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors border border-slate-700 hover:border-slate-500">
                  {link.label}
                </a>
              ))}
            </div>
          )}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    </div>
  );
}

export default function CardRenderer(props: CardRendererProps) {
  const { template, ...rest } = props;
  switch (template) {
    case "MINIMAL": return <MinimalCard {...rest} />;
    case "ELEGANT": return <ElegantCard {...rest} />;
    default:        return <ClassicCard {...rest} />;
  }
}
