export const CARD_TEMPLATES = ["CLASSIC", "MINIMAL", "ELEGANT"] as const;
export type CardTemplateName = (typeof CARD_TEMPLATES)[number];

export const COLOR_PRESETS = [
  { name: "Sky",     hex: "#0284c7" },
  { name: "Emerald", hex: "#059669" },
  { name: "Violet",  hex: "#7c3aed" },
  { name: "Rose",    hex: "#e11d48" },
  { name: "Amber",   hex: "#d97706" },
  { name: "Slate",   hex: "#475569" },
] as const;

export const DEFAULT_CARD_COLOR = "#0284c7";
