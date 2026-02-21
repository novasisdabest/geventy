// Deterministic funny nickname generator using Czech adjectives

const ADJECTIVES = [
  "Zabavny",
  "Skvely",
  "Tajemny",
  "Divoki",
  "Blaznivy",
  "Genialni",
  "Epicky",
  "Legendarni",
  "Kosmicky",
  "Magicky",
  "Neohrozeny",
  "Bystry",
  "Smelý",
  "Hrozivý",
  "Ohnivý",
  "Ledový",
  "Zlaty",
  "Stříbrny",
  "Turbo",
  "Super",
  "Mega",
  "Ultra",
  "Mocny",
  "Rychly",
  "Tichy",
  "Zdivocely",
  "Zazracny",
  "Odvazny",
  "Laskavý",
  "Chytry",
  "Mazany",
  "Vtipny",
  "Cool",
  "Hustý",
  "Fesak",
  "Drsny",
  "Nekonecny",
  "Hvezdny",
  "Elektrizujici",
  "Vesmirny",
] as const;

/**
 * Simple string hash → stable index into the adjectives array.
 * Same full name always produces the same adjective.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * "Lukas Novak" → "Zabavny Lukas"
 * Picks a deterministic adjective based on the full name hash,
 * then prefixes it to the first name.
 */
export function generateNickname(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "Tajemny Host";

  const firstName = trimmed.split(/\s+/)[0];
  const index = hashString(trimmed) % ADJECTIVES.length;
  return `${ADJECTIVES[index]} ${firstName}`;
}
