// Layer 1: Explicit profanity
const PROFANITY = [
  "fuck", "shit", "ass", "bitch", "damn", "dick", "pussy", "cock",
  "cunt", "whore", "slut", "bastard", "nigger", "faggot", "retard",
  "stfu", "wtf", "lmfao",
];

// Layer 2: Casual/dating-app language that undermines platform dignity
const UNDIGNIFIED = [
  "broke", "baby fever", "negotiate", "hook up", "hookup",
  "situationship", "talking stage", "sliding into", "slide into",
  "lowkey", "ngl", "tbh", "lol", "hmu", "dm me", "hit me up",
  "fwb", "no strings", "netflix and chill", "dtf", "smash",
  "rizz", "simp", "ghosting", "vibes only", "just vibes",
  "wanna", "tryna", "gonna", "lemme",
];

const PROFANITY_PATTERN = new RegExp(
  PROFANITY.map(w => `\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).join("|"),
  "i"
);

const UNDIGNIFIED_PATTERN = new RegExp(
  UNDIGNIFIED.map(w => `\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).join("|"),
  "i"
);

export function containsProfanity(text: string): boolean {
  return PROFANITY_PATTERN.test(text);
}

export function containsUndignifiedLanguage(text: string): boolean {
  return UNDIGNIFIED_PATTERN.test(text);
}

export function validateIntention(text: string): { valid: boolean; error?: string } {
  if (containsProfanity(text)) {
    return { valid: false, error: "Please keep your intention statement dignified and sincere." };
  }
  if (containsUndignifiedLanguage(text)) {
    return { valid: false, error: "Please keep your intention statement dignified and sincere." };
  }
  return { valid: true };
}
