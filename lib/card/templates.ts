export const CARD_TEMPLATES = ["CLASSIC", "MINIMAL", "ELEGANT"] as const;
export type CardTemplateName = (typeof CARD_TEMPLATES)[number];

export const COLOR_PRESETS = [
  { name: "Teal",    hex: "#2D5A52" },
  { name: "Umber",   hex: "#5d4037" },
  { name: "Charcoal", hex: "#263238" },
  { name: "Slate",   hex: "#455a64" },
  { name: "Forest",  hex: "#466564" },
  { name: "Bronze",  hex: "#6d4c41" },
] as const;

export const DEFAULT_CARD_COLOR = "#2D5A52";
