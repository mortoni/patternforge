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

/** Full comment text before each ✓ (cumulative — needed for second-branch lines). */
function checkmarkCumulativeContexts(comment: string): string[] {
  const normalized = normalizeChessNotation(comment);
  const contexts: string[] = [];
  for (const match of normalized.matchAll(/✓/g)) {
    const checkIndex = match.index ?? -1;
    if (checkIndex < 0) continue;
    contexts.push(normalized.slice(0, checkIndex).trim());
  }
  return contexts;
}

const SAN_TOKEN = String.raw`(?:O-O-O|O-O|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?(?:[+#])?|[a-h]x[a-h][1-8](?:=[QRBN])?(?:[+#])?|[a-h][1-8](?:=[QRBN])?(?:[+#])?)(?:[?!])?`;
const END_NUMBERED_WHITE =
  String.raw`(\d+)\.\s*(${SAN_TOKEN})(?:\s+mate)?(?:\s*[-+±]+)?\s*$`;

type OrderedMoveEvent = {
  san: string;
  moveNumber: number | null;
  side: "w" | "b";
  endIndex: number;
};

function maxMoveNumberInText(text: string): number {
  let max = 0;
  for (const match of text.matchAll(/(\d+)\.(?:\.\.)?\s/g)) {
    max = Math.max(max, Number.parseInt(match[1], 10));
  }
  return max;
}

/** Main game resumes below the variation peak (e.g. 21.Nd7 ✓ … 20.Ng6+). */
function hasMainLineResumptionAfterVariation(comment: string): boolean {
  const normalized = normalizeChessNotation(comment);
  const parts = normalized.split("✓");
  for (let i = 0; i < parts.length - 1; i += 1) {
    const maxBefore = maxMoveNumberInText(parts[i] ?? "");
    const after = parts[i + 1] ?? "";
    for (const match of after.matchAll(/(\d+)\.(?:\.\.)?\s/g)) {
      const nextMove = Number.parseInt(match[1], 10);
      if (nextMove < maxBefore) return true;
    }
  }
  return false;
}

function isAlternateWhiteMoveHint(comment: string, endIndex: number): boolean {
  const after = comment.slice(endIndex, endIndex + 24).toLowerCase();
  return /^\s+is also good\b/.test(after) || /^\s+or\b/.test(after);
}

function solutionContinuesAfterCheckmark(comment: string, checkIndex: number): boolean {
  const after = normalizeChessNotation(comment.slice(checkIndex + 1))
    .trim()
    .replace(/^[,.;:!?\s]+/, "");
  return /^(?:\d+\.(?:\.\.)?\s*(?:O-O|[KQRBN])|[KQRBN]|O-O|[a-h]x?[a-h][1-8])/.test(after);
}

function parseEndWhiteSan(endMatch: RegExpMatchArray): string {
  let endSan = cleanSanToken(endMatch[2]);
  if (/\bmate\b/i.test(endMatch[0])) {
    endSan = endSan.includes("#") ? endSan : `${endSan}#`;
  }
  return endSan;
}

/** Walk numbered anchors in comment order; skip later black tries at the same move number. */
function extractOrderedMoveEvents(comment: string): OrderedMoveEvent[] {
  const normalized = normalizeChessNotation(comment).replace(/\s+/g, " ");

  const events: OrderedMoveEvent[] = [];
  const anchorPattern = new RegExp(`(\\d+)(\\.(?:\\.\\.)?)\\s*(${SAN_TOKEN})`, "g");

  for (const match of normalized.matchAll(anchorPattern)) {
    const moveNumber = Number.parseInt(match[1], 10);
    const isBlack = match[2] === "...";
    const side: "w" | "b" = isBlack ? "b" : "w";
    events.push({
      san: cleanSanToken(match[3]),
      moveNumber,
      side,
      endIndex: match.index! + match[0].length,
    });

    if (isBlack) continue;

    const afterWhite = normalized.slice(match.index! + match[0].length);
    const inlineBlack = afterWhite.match(
      new RegExp(`^\\s*(${SAN_TOKEN})(?=\\s|$)`, "i")
    );
    if (!inlineBlack) continue;
    if (/^\d+\.(?:\.\.)?\s/.test(afterWhite.trim())) continue;

    events.push({
      san: cleanSanToken(inlineBlack[1]),
      moveNumber,
      side: "b",
      endIndex: match.index! + match[0].length + inlineBlack[0].length,
    });
  }

  const unnumberedPattern = new RegExp(
    `(\\d+)\\.\\s*(${SAN_TOKEN})(?:\\s*[-+±!?]+)?(?:\\s*✓\\s*|\\s+)(?!\\d+\\.\\.\\.\\s)(${SAN_TOKEN})(?=\\s+\\d+\\.)`,
    "g"
  );
  for (const match of normalized.matchAll(unnumberedPattern)) {
    const moveNumber = Number.parseInt(match[1], 10);
    const whiteSan = cleanSanToken(match[2]);
    const blackSan = cleanSanToken(match[3]);
    const whiteIdx = events.findIndex(
      (event) =>
        event.moveNumber === moveNumber && event.side === "w" && event.san === whiteSan
    );
    if (whiteIdx < 0) continue;
    const hasBlackAtNumber = events.some(
      (event, idx) =>
        idx > whiteIdx &&
        event.moveNumber === moveNumber &&
        event.side === "b" &&
        event.san === blackSan
    );
    if (hasBlackAtNumber) continue;
    events.splice(whiteIdx + 1, 0, {
      san: blackSan,
      moveNumber,
      side: "b",
      endIndex: match.index! + match[0].length,
    });
  }

  return events;
}

function buildSequentialMainLineFromComment(
  fen: string,
  sideToMove: "w" | "b",
  comment: string
): string[] | null {
  if (!hasMainLineResumptionAfterVariation(comment)) return null;

  const normalizedComment = normalizeChessNotation(comment).replace(/\s+/g, " ");
  const events = extractOrderedMoveEvents(comment);
  if (events.length === 0) return null;

  const chess = new Chess(fen);
  if (chess.turn() !== sideToMove) return null;

  const line: string[] = [];
  const blackPlayedAt = new Set<number>();
  const whitePlayedAt = new Set<number>();
  const maxMoveNumber = events.reduce(
    (max, event) => Math.max(max, event.moveNumber ?? 0),
    0
  );
  const firstWhiteMoveNumber =
    events.find((event) => event.side === sideToMove && event.moveNumber != null)?.moveNumber ??
    1;
  let nextWhiteMoveNumber = firstWhiteMoveNumber;
  let lastPlayedEndIndex = -1;

  while (nextWhiteMoveNumber <= maxMoveNumber) {
    const whiteCandidatesAll = events.filter(
      (event) =>
        event.side === "w" &&
        event.moveNumber === nextWhiteMoveNumber &&
        event.endIndex > lastPlayedEndIndex &&
        !whitePlayedAt.has(event.moveNumber!) &&
        !isAlternateWhiteMoveHint(normalizedComment, event.endIndex)
    );
    const whiteCandidates =
      whiteCandidatesAll.length > 0 ? [whiteCandidatesAll[0]!] : [];
    let whitePlayed = false;

    for (const whiteEvent of whiteCandidates) {
      if (chess.turn() !== "w") break;
      const trial = new Chess(chess.fen());
      if (!tryApplySanMove(trial, whiteEvent.san)) continue;

      const blackCandidates = events.filter(
        (event) =>
          event.side === "b" &&
          event.moveNumber === nextWhiteMoveNumber &&
          event.endIndex > whiteEvent.endIndex &&
          !blackPlayedAt.has(event.moveNumber!)
      );
      const unnumberedBlack = events.find(
        (event) =>
          event.side === "b" &&
          event.moveNumber == null &&
          event.endIndex > whiteEvent.endIndex &&
          event.endIndex <
            (events.find(
              (later) =>
                later.side === "w" &&
                later.moveNumber === nextWhiteMoveNumber + 1 &&
                later.endIndex > whiteEvent.endIndex
            )?.endIndex ?? Number.POSITIVE_INFINITY)
      );

      let chosenBlack: OrderedMoveEvent | undefined;
      for (let i = blackCandidates.length - 1; i >= 0; i -= 1) {
        const blackEvent = blackCandidates[i]!;
        const blackTrial = new Chess(trial.fen());
        if (tryApplySanMove(blackTrial, blackEvent.san)) {
          chosenBlack = blackEvent;
          break;
        }
      }

      if (!chosenBlack && unnumberedBlack) {
        const blackTrial = new Chess(trial.fen());
        if (tryApplySanMove(blackTrial, unnumberedBlack.san)) {
          chosenBlack = unnumberedBlack;
        }
      }

      tryApplySanMove(chess, whiteEvent.san);
      line.push(whiteEvent.san);
      whitePlayedAt.add(nextWhiteMoveNumber);

      if (chosenBlack) {
        tryApplySanMove(chess, chosenBlack.san);
        line.push(chosenBlack.san);
        if (chosenBlack.moveNumber != null) {
          blackPlayedAt.add(chosenBlack.moveNumber);
        } else {
          blackPlayedAt.add(nextWhiteMoveNumber);
        }
      }

      const lastEvent = chosenBlack ?? whiteEvent;
      lastPlayedEndIndex = lastEvent.endIndex;
      const checkIndex = normalizedComment.indexOf("✓", lastEvent.endIndex);
      if (
        checkIndex >= 0 &&
        checkIndex - lastEvent.endIndex < 24 &&
        !solutionContinuesAfterCheckmark(normalizedComment, checkIndex)
      ) {
        return line.length >= 2 ? line : null;
      }

      whitePlayed = true;
      break;
    }

    if (!whitePlayed) break;
    nextWhiteMoveNumber += 1;
  }

  return line.length >= 2 ? line : null;
}

/**
 * Woodpecker "if instead" branches:
 *   23.Rxe6+ Kxe6 23...fxe6 24.Bh6+  → Rxe6+, fxe6, Bh6+ (skip inline Kxe6)
 *   23.Rxe6+ Kxe6 24.Qe4+             → Rxe6+, Kxe6, Qe4+
 */
export function extractWoodpeckerBranchLines(
  fen: string,
  sideToMove: "w" | "b",
  comment: string
): string[][] {
  const normalized = normalizeChessNotation(comment)
    .replace(/[✓µ]/g, " ")
    .replace(/\s+/g, " ");

  const branches: string[][] = [];

  const variationPattern = new RegExp(
    `(\\d+)\\.\\s*(${SAN_TOKEN})\\s+(${SAN_TOKEN})\\s+\\1\\.\\.\\.\\s*(${SAN_TOKEN})(?:\\s+(\\d+)\\.\\s*(${SAN_TOKEN}))?`,
    "g"
  );

  for (const match of normalized.matchAll(variationPattern)) {
    const sans = [match[2], match[4], match[6]].filter(Boolean).map((san) => cleanSanToken(san));
    const line = buildReplayableLine(fen, sideToMove, sans);
    if (line) branches.push(line);
  }

  const inlinePattern = new RegExp(
    `(\\d+)\\.\\s*(${SAN_TOKEN})\\s+(${SAN_TOKEN})\\s+(\\d+)\\.\\s*(${SAN_TOKEN})`,
    "g"
  );

  for (const match of normalized.matchAll(inlinePattern)) {
    const whiteMoveNumber = Number.parseInt(match[1], 10);
    const nextWhiteMoveNumber = Number.parseInt(match[4], 10);
    if (nextWhiteMoveNumber !== whiteMoveNumber + 1) continue;

    const between = match[0];
    if (between.includes("...")) continue;

    const sans = [match[2], match[3], match[5]].map((san) => cleanSanToken(san));
    const line = buildReplayableLine(fen, sideToMove, sans);
    if (line) branches.push(line);
  }

  for (const context of checkmarkCumulativeContexts(comment)) {
    const inlineToMarkedWhite = buildInlineBranchToMarkedWhite(fen, sideToMove, context);
    if (inlineToMarkedWhite) branches.push(inlineToMarkedWhite);

    const orBranch = buildLineFromOrAlternative(fen, sideToMove, context);
    if (orBranch) branches.push(orBranch);

    const firstBlackBranch = buildLineFromFirstBlackAtMoveNumber(fen, sideToMove, context);
    if (firstBlackBranch) branches.push(firstBlackBranch);
  }

  return dedupeLines(branches);
}

/**
 * Woodpecker "Or" same-move alternatives (white or black):
 *   34.f3 Or 34.fxe3 … 34...Rg6 ✓  → … e3, f3, Rg6 (not fxe3)
 *   23...Rd1+ Or 23...Qh1+          → first option + continuation
 */
function buildLineFromOrAlternative(
  fen: string,
  sideToMove: "w" | "b",
  context: string
): string[] | null {
  const normalized = normalizeChessNotation(context).replace(/\s+/g, " ");
  const orPattern = new RegExp(
    `(\\d+)(\\.(?:\\.\\.)?)\\s*(${SAN_TOKEN})\\s+Or\\s+\\1\\2\\s*(${SAN_TOKEN})`,
    "gi"
  );

  const matches = [...normalized.matchAll(orPattern)];
  if (matches.length === 0) return null;

  let best: string[] | null = null;

  for (const match of matches) {
    const moveNumber = Number.parseInt(match[1], 10);
    const isBlack = match[2] === "...";
    const primarySan = cleanSanToken(match[3]);
    const beforeOr = normalized.slice(0, match.index);
    const afterOr = normalized.slice(match.index! + match[0].length);

    const prefixLine = buildLineFromParsedMoves(
      fen,
      sideToMove,
      parseNumberedCommentMoves(beforeOr),
      context
    );

    const tailSans = [primarySan];
    if (!isBlack) {
      const blackResponse = afterOr.match(
        new RegExp(`${moveNumber}\\.\\.\\.\\s*(${SAN_TOKEN})`)
      );
      if (blackResponse) tailSans.push(cleanSanToken(blackResponse[1]));
    } else {
      const whiteResponse = afterOr.match(
        new RegExp(`${moveNumber + 1}\\.\\s*(${SAN_TOKEN})`)
      );
      if (whiteResponse) tailSans.push(cleanSanToken(whiteResponse[1]));
    }

    const combined = prefixLine ? [...prefixLine, ...tailSans] : tailSans;
    if (!replayMainLine(fen, combined)) continue;
    if (!best || combined.length < best.length) best = combined;
  }

  return best;
}

function dedupeLines(lines: string[][]): string[][] {
  const seen = new Set<string>();
  return lines.filter((line) => {
    const key = line.join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildReplayableLine(
  fen: string,
  sideToMove: "w" | "b",
  sans: string[]
): string[] | null {
  if (sans.length === 0) return null;
  if (replayMainLine(fen, sans)) return sans;

  const chess = new Chess(fen);
  if (chess.turn() !== sideToMove) return null;

  for (const candidate of chess.moves()) {
    const trial = new Chess(fen);
    if (!tryApplySanMove(trial, candidate)) continue;
    if (replayMainLine(trial.fen(), sans)) return [candidate, ...sans];
  }

  return null;
}

function buildInlineBranchToMarkedWhite(
  fen: string,
  sideToMove: "w" | "b",
  context: string
): string[] | null {
  const normalized = normalizeChessNotation(context).trim();
  const endMatch = normalized.match(new RegExp(END_NUMBERED_WHITE, "i"));
  if (!endMatch) return null;

  const endMoveNumber = Number.parseInt(endMatch[1], 10);
  const endSan = parseEndWhiteSan(endMatch);
  const priorNumber = endMoveNumber - 1;
  const startMatch = normalized.match(
    new RegExp(`${priorNumber}\\.\\s*(${SAN_TOKEN})\\s+(${SAN_TOKEN})`)
  );
  if (!startMatch) return null;

  const startWhite = cleanSanToken(startMatch[1]);
  const inlineBlack = cleanSanToken(startMatch[2]);
  return buildReplayableLine(fen, sideToMove, [startWhite, inlineBlack, endSan]);
}

/**
 * Multiple black tries at the same move number — first `N...` is main, white `N+1.` closes:
 *   14.Ne6+ 14...Ke8 14...fxe6 15.Ba5+ ✓ … 15.Nbc7 mate ✓  →  Ne6+, Ke8, Nbc7#
 */
function buildLineFromFirstBlackAtMoveNumber(
  fen: string,
  sideToMove: "w" | "b",
  context: string
): string[] | null {
  const normalized = normalizeChessNotation(context).trim();
  const endMatch = normalized.match(new RegExp(END_NUMBERED_WHITE, "i"));
  if (!endMatch) return null;

  const endMoveNumber = Number.parseInt(endMatch[1], 10);
  const endSan = parseEndWhiteSan(endMatch);
  const priorNumber = endMoveNumber - 1;

  const whiteMatch = normalized.match(new RegExp(`${priorNumber}\\.\\s*(${SAN_TOKEN})`));
  if (!whiteMatch) return null;
  const whiteSan = cleanSanToken(whiteMatch[1]);

  const afterWhite = normalized.slice(whiteMatch.index! + whiteMatch[0].length);
  const firstBlackMatch = afterWhite.match(
    new RegExp(`${priorNumber}\\.\\.\\.\\s*(${SAN_TOKEN})`)
  );
  if (!firstBlackMatch) return null;
  const blackSan = cleanSanToken(firstBlackMatch[1]);

  return buildReplayableLine(fen, sideToMove, [whiteSan, blackSan, endSan]);
}

function mateBonusForLine(mainLine: string[]): number {
  const last = mainLine[mainLine.length - 1] ?? "";
  if (last.includes("#") || /mate$/i.test(last)) return 20;
  return 0;
}

function inferLinesFromCheckmarkBranches(
  fen: string,
  sideToMove: "w" | "b",
  comment: string
): Array<{ mainLine: string[]; checkmarkIndex: number }> {
  const contexts = checkmarkCumulativeContexts(comment);
  const lines: Array<{ mainLine: string[]; checkmarkIndex: number }> = [];

  for (let index = 0; index < contexts.length; index += 1) {
    const context = contexts[index];
    const branches = extractWoodpeckerBranchLines(fen, sideToMove, context);
    for (const branch of branches) {
      lines.push({ mainLine: branch, checkmarkIndex: index });
    }

    const inlineToMarkedWhite = buildInlineBranchToMarkedWhite(fen, sideToMove, context);
    if (inlineToMarkedWhite) {
      lines.push({ mainLine: inlineToMarkedWhite, checkmarkIndex: index });
    }

    const orBranch = buildLineFromOrAlternative(fen, sideToMove, context);
    if (orBranch) {
      lines.push({ mainLine: orBranch, checkmarkIndex: index });
    }

    const firstBlackBranch = buildLineFromFirstBlackAtMoveNumber(fen, sideToMove, context);
    if (firstBlackBranch) {
      lines.push({ mainLine: firstBlackBranch, checkmarkIndex: index });
    }
  }

  return lines;
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

  const branchLines = inferLinesFromCheckmarkBranches(fen, sideToMove, comment);
  for (const branch of branchLines) {
    if (!replayMainLine(fen, branch.mainLine)) continue;
    candidates.push({
      mainLine: branch.mainLine,
      source: "checkmark-segment",
      // Prefer first checkmark and shorter refutation lines over game continuations.
      score:
        120 -
        branch.checkmarkIndex * 5 -
        branch.mainLine.length +
        mateBonusForLine(branch.mainLine),
    });
  }

  const numbered = parseNumberedCommentMoves(comment);
  const numberedLine = buildLineFromParsedMoves(fen, sideToMove, numbered, comment);
  if (numberedLine && replayMainLine(fen, numberedLine)) {
    candidates.push({
      mainLine: numberedLine,
      source: "numbered-moves",
      score: numberedLine.length * 10,
    });
  }

  const sequentialLine = buildSequentialMainLineFromComment(fen, sideToMove, comment);
  if (sequentialLine && replayMainLine(fen, sequentialLine)) {
    candidates.push({
      mainLine: sequentialLine,
      source: "numbered-moves",
      score: 130 + sequentialLine.length * 8 + mateBonusForLine(sequentialLine),
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
    replayMainLine(fen, tokenSubsequence) &&
    branchLines.length === 0
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
