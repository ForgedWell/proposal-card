const BLOCKED_WORDS = [
  "fuck", "shit", "ass", "bitch", "damn", "dick", "pussy", "cock",
  "cunt", "whore", "slut", "bastard", "nigger", "faggot", "retard",
];

const PATTERN = new RegExp(
  BLOCKED_WORDS.map(w => `\\b${w}\\b`).join("|"),
  "i"
);

export function containsProfanity(text: string): boolean {
  return PATTERN.test(text);
}
