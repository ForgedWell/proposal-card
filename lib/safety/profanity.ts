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

// Layer 3: Low-effort phrases that are the entire message or dominant
const LOW_EFFORT_PHRASES = [
  "chat", "chat with me", "hey", "hi", "hello", "yo",
  "hmu", "message me", "text me", "call me",
  "what's up", "whats up", "wassup", "sup",
  "add me", "follow me", "dm me",
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

function isLowEffort(text: string): boolean {
  const cleaned = text.trim().toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ");
  // Check if the entire message is a low-effort phrase
  if (LOW_EFFORT_PHRASES.includes(cleaned)) return true;
  // Check if a low-effort phrase makes up >60% of the message
  for (const phrase of LOW_EFFORT_PHRASES) {
    if (cleaned.length > 0 && phrase.length / cleaned.length > 0.6 && cleaned.includes(phrase)) {
      return true;
    }
  }
  return false;
}

export function validateIntention(text: string): { valid: boolean; error?: string } {
  const trimmed = text.trim();

  // Minimum length: 20 characters
  if (trimmed.length < 20) {
    return { valid: false, error: "Please write a more complete introduction (minimum 20 characters)." };
  }

  // Minimum word count: 4 words
  const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 4) {
    return { valid: false, error: "Please write at least a few sentences about yourself and your intentions." };
  }

  // Low-effort phrase check
  if (isLowEffort(trimmed)) {
    return { valid: false, error: "Please write a more thoughtful and specific introduction." };
  }

  // Profanity check
  if (containsProfanity(trimmed)) {
    return { valid: false, error: "Please keep your intention statement dignified and sincere." };
  }

  // Undignified language check
  if (containsUndignifiedLanguage(trimmed)) {
    return { valid: false, error: "Please keep your intention statement dignified and sincere." };
  }

  return { valid: true };
}

// Lighter validation for individual chat messages (not intention statements)
export function validateMessage(text: string): { valid: boolean; error?: string } {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Message cannot be empty." };
  }
  if (containsProfanity(trimmed)) {
    return { valid: false, error: "Please keep your message dignified and sincere." };
  }
  if (containsUndignifiedLanguage(trimmed)) {
    return { valid: false, error: "Please keep your message dignified and sincere." };
  }
  return { valid: true };
}
