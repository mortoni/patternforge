/**
 * Formats a replayed main line as a move-only Woodpecker book comment
 * (no prose — just numbered moves ending with "mate ✓" when applicable).
 */
export function formatMoveOnlyComment(
  mainLine: string[],
  sideToMove: "w" | "b",
  startMoveNumber = 1
): string {
  if (mainLine.length === 0) return "";

  const parts: string[] = [];
  let moveNumber = startMoveNumber;
  let isWhiteTurn = sideToMove === "w";

  for (let i = 0; i < mainLine.length; i += 1) {
    const san = formatSanForComment(mainLine[i], i === mainLine.length - 1);

    if (isWhiteTurn) {
      parts.push(`${moveNumber}.${san}`);
    } else if (parts.length === 0) {
      parts.push(`${moveNumber}...${san}`);
    } else {
      parts.push(san);
    }

    if (isWhiteTurn) {
      isWhiteTurn = false;
    } else {
      moveNumber += 1;
      isWhiteTurn = true;
    }
  }

  return `${parts.join(" ")} ✓`;
}

function formatSanForComment(san: string, isLast: boolean): string {
  if (isLast && san.endsWith("#")) {
    return `${san.slice(0, -1)} mate`;
  }
  return san;
}
