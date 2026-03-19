/**
 * Maps corrupted piece glyphs (custom book fonts / PDF extraction) and related
 * symbols to standard SAN-friendly ASCII. Extend by adding entries.
 *
 * Note: In Woodpecker-style imports, U+2020 (daggar) after a move denotes
 * check (Informator-style), same role as "+" in SAN — mapped to "+".
 * King moves often use U+00A2 (¢) in the same sources, mapped to "K".
 */
export const CHESS_NOTATION_CORRUPTED_CHAR_MAP: Readonly<Record<string, string>> =
  {
    "\u00A3": "Q", // £
    "\u00A6": "R", // ¦
    "\u00A5": "B", // ¥
    "\u00A4": "N", // ¤
    "\u00A2": "K", // ¢
    "\u2020": "+", // † → check (SAN +); not piece K
    // Unicode figurines (if they appear in comments)
    "\u2654": "K",
    "\u2655": "Q",
    "\u2656": "R",
    "\u2657": "B",
    "\u2658": "N",
    "\u265a": "K",
    "\u265b": "Q",
    "\u265c": "R",
    "\u265d": "B",
    "\u265e": "N",
  };

/**
 * Replaces known corrupted chess notation characters with standard SAN letters
 * (and "+" for dagger-check). Does not alter move numbers, !?, #, ×, en-dash, etc.
 */
export function normalizeChessNotation(text: string): string {
  let out = "";
  for (const ch of text) {
    out += CHESS_NOTATION_CORRUPTED_CHAR_MAP[ch] ?? ch;
  }
  return out;
}
