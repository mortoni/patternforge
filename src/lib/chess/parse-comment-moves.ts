import { Chess } from "chess.js";
import { normalizeChessNotation } from "./normalize-chess-notation";
import { replayMainLine, tryApplySanMove } from "./woodpecker-solution-utils";

export type ParsedCommentMove = {
  moveNumber: number;
  side: "w" | "b";
  san: string;
};

const SAN_PATTERN =
  /\b(O-O-O|O-O|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?(?:[+#])?|[a-h]x[a-h][1-8](?:=[QRBN])?(?:[+#])?|[a-h][1-8](?:=[QRBN])?(?:[+#])?)\b/g;

export function cleanSanToken(raw: string): string {
  let san = raw.trim().replace(/\s+/g, "");
  san = san.replace(/^(?:[+#–—−±]+)+/g, "");
  san = san.replace(/(?:[–—−]|[+#])?[-+]+$/g, (match) => (match.includes("+") ? "+" : ""));
  san = san.replace(/\+?[-–—−]+$/g, "");
  san = san.replace(/mate$/i, "#");
  san = san.replace(/[?!]+$/g, "");
  if (san.endsWith("+")) san = `${san.slice(0, -1)}+`;
  return san;
}

export function extractSanTokens(text: string): string[] {
  const normalized = normalizeChessNotation(text)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\d+[–—-]\d+/g, " ")
    .replace(/[✓µ]/g, " ");

  const tokens: string[] = [];
  for (const match of normalized.matchAll(SAN_PATTERN)) {
    const cleaned = cleanSanToken(match[1]);
    if (cleaned.length > 0) tokens.push(cleaned);
  }
  return tokens;
}

export function parseNumberedCommentMoves(comment: string): ParsedCommentMove[] {
  const normalized = normalizeChessNotation(comment)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\d+[–—-]\d+/g, " ");

  const moves: ParsedCommentMove[] = [];
  const pattern = /(\d+)\.(?:(\.\.)?)\s*([^]+?)(?=\s+\d+\.(?:\.\.)?|\s*$)/g;

  for (const match of normalized.matchAll(pattern)) {
    const moveNumber = Number.parseInt(match[1], 10);
    const isBlack = match[2] === "..";
    const segment = match[3].split(/[.!?]\s+(?=[A-Za-z])/)[0];
    const tokens = extractSanTokens(segment);
    for (let tokenIdx = 0; tokenIdx < tokens.length; tokenIdx += 1) {
      const side: "w" | "b" =
        tokenIdx % 2 === 0
          ? isBlack
            ? "b"
            : "w"
          : isBlack
            ? "w"
            : "b";
      moves.push({
        moveNumber,
        side,
        san: tokens[tokenIdx],
      });
    }
  }

  return moves;
}

function segmentsBeforeCheckmarks(comment: string): string[] {
  const normalized = normalizeChessNotation(comment);
  const parts = normalized.split("✓");
  return parts
    .slice(0, -1)
    .map((part) => part.trim().slice(Math.max(0, part.length - 120)))
    .filter((part) => part.length > 0);
}

/** Parse numbered moves from the last move-number anchor in a segment (avoids earlier variations). */
function parseFromLastNumberedAnchors(
  fen: string,
  sideToMove: "w" | "b",
  segment: string,
  comment?: string
): string[] | null {
  const normalized = normalizeChessNotation(segment);
  const anchorPattern = /\d+\.(?:\.\.)?\s*/g;
  const anchors: number[] = [];
  for (const match of normalized.matchAll(anchorPattern)) {
    if (match.index != null) anchors.push(match.index);
  }
  if (anchors.length === 0) return null;

  let best: string[] | null = null;
  for (let i = anchors.length - 1; i >= 0; i -= 1) {
    const parsed = parseNumberedCommentMoves(normalized.slice(anchors[i]));
    const line = buildLineFromParsedMoves(fen, sideToMove, parsed, comment);
    if (!line || !replayMainLine(fen, line)) continue;
    if (!best || line.length > best.length) best = line;
    if (line.length >= 2) break;
  }
  return best;
}

function buildLineFromParsedMoves(
  fen: string,
  sideToMove: "w" | "b",
  parsed: ParsedCommentMove[],
  comment?: string
): string[] | null {
  if (parsed.length === 0) return null;

  if (parsed[0].side === sideToMove) {
    return replayParsedMoves(fen, parsed);
  }

  const chess = new Chess(fen);
  if (chess.turn() !== sideToMove) return null;

  const commentTokens = new Set(comment ? extractSanTokens(comment) : []);
  const candidates: Array<{ line: string[]; score: number }> = [];

  function prefixAllowed(san: string): boolean {
    if (commentTokens.size === 0) return true;
    const cleaned = cleanSanToken(san);
    if (commentTokens.has(cleaned)) return true;
    if (cleaned.endsWith("+") && commentTokens.has(cleaned.slice(0, -1))) return true;
    if (cleaned.endsWith("#") && commentTokens.has(cleaned.slice(0, -1))) return true;
    return false;
  }

  for (const candidate of chess.moves()) {
    if (!prefixAllowed(candidate)) continue;
    const trial = new Chess(fen);
    if (!tryApplySanMove(trial, candidate)) continue;
    const tail = replayParsedMoves(trial.fen(), parsed);
    if (!tail) continue;

    const line = [candidate, ...tail];
    let score = line.length * 10;
    if (commentTokens.has(candidate)) score += 100;
    if (candidate.includes("x")) score += 5;
    if (candidate.includes("+")) score += 3;
    candidates.push({ line, score });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score || b.line.length - a.line.length);
  return candidates[0].line;
}

function replayParsedMoves(fen: string, parsed: ParsedCommentMove[]): string[] | null {
  const line: string[] = [];
  const chess = new Chess(fen);

  for (const entry of parsed) {
    if (chess.turn() !== entry.side) return null;
    if (!tryApplySanMove(chess, entry.san)) return null;
    line.push(entry.san);
  }

  return line.length > 0 ? line : null;
}

function longestLegalSubsequence(
  fen: string,
  sideToMove: "w" | "b",
  tokens: string[]
): string[] | null {
  let best: string[] = [];

  function search(tokenIdx: number, chess: Chess, path: string[]) {
    if (path.length > best.length) best = [...path];
    for (let i = tokenIdx; i < tokens.length; i += 1) {
      const trial = new Chess(chess.fen());
      const move = tryApplySanMove(trial, tokens[i]);
      if (!move) continue;
      path.push(tokens[i]);
      search(i + 1, trial, path);
      path.pop();
    }
  }

  search(0, new Chess(fen), []);
  return best.length > 0 ? best : null;
}

export function inferMainLineFromComment(
  fen: string,
  sideToMove: "w" | "b",
  comment: string | undefined
): { mainLine: string[]; source: string } | null {
  if (!comment || comment.trim() === "" || comment === "undefined") return null;

  const candidates: Array<{ mainLine: string[]; source: string; score: number }> = [];

  const numbered = parseNumberedCommentMoves(comment);
  const numberedLine = buildLineFromParsedMoves(fen, sideToMove, numbered, comment);
  if (numberedLine && replayMainLine(fen, numberedLine)) {
    candidates.push({
      mainLine: numberedLine,
      source: "numbered-moves",
      score: numberedLine.length * 10,
    });
  }

  for (const segment of segmentsBeforeCheckmarks(comment)) {
    const parsed = parseNumberedCommentMoves(segment);
    const lineFromSegment = buildLineFromParsedMoves(fen, sideToMove, parsed, comment);
    if (lineFromSegment && replayMainLine(fen, lineFromSegment)) {
      candidates.push({
        mainLine: lineFromSegment,
        source: "checkmark-segment",
        score: lineFromSegment.length * 10 + 5,
      });
    }

    const fromLastAnchor = parseFromLastNumberedAnchors(fen, sideToMove, segment, comment);
    if (fromLastAnchor && replayMainLine(fen, fromLastAnchor)) {
      candidates.push({
        mainLine: fromLastAnchor,
        source: "checkmark-segment",
        score: fromLastAnchor.length * 10 + 8,
      });
    }

    const tailTokens = extractSanTokens(segment.slice(Math.max(0, segment.length - 80)));
    const tokenLine = longestLegalSubsequence(fen, sideToMove, tailTokens);
    const tokenLineInComment =
      tokenLine?.every((san) => {
        const cleaned = cleanSanToken(san);
        return tailTokens.some(
          (token) =>
            token === cleaned ||
            cleaned === `${token}+` ||
            cleaned === `${token}#` ||
            token === cleaned.replace(/[+#]$/, "")
        );
      }) ?? false;
    if (
      tokenLine &&
      tokenLineInComment &&
      tokenLine.length >= 1 &&
      replayMainLine(fen, tokenLine) &&
      (tokenLine.length >= 2 || tokenLine[0].includes("#") || tokenLine[0].includes("+"))
    ) {
      candidates.push({
        mainLine: tokenLine,
        source: "checkmark-segment",
        score: tokenLine.length * 10 + 6,
      });
    }
  }

  const allTokens = extractSanTokens(comment);
  const tokenSubsequence = longestLegalSubsequence(fen, sideToMove, allTokens);
  if (
    tokenSubsequence &&
    tokenSubsequence.length >= 2 &&
    replayMainLine(fen, tokenSubsequence)
  ) {
    candidates.push({
      mainLine: tokenSubsequence,
      source: "full-comment-subsequence",
      score: tokenSubsequence.length * 10 - 5,
    });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score || b.mainLine.length - a.mainLine.length);
  const best = candidates[0];
  return { mainLine: best.mainLine, source: best.source };
}
