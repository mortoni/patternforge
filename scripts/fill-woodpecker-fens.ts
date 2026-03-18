/**
 * Fills the `fen` column in a Woodpecker CSV dataset in a resumable way.
 *
 * Usage:
 *   pnpm woodpecker:fill-fens --input data/woodpecker_1128_dataset.csv --failures data/woodpecker_fen_failures.json
 *
 * Use a Lichess study (one chapter per game, chapter Event = "White – Black, Event Year"):
 *   pnpm woodpecker:fill-fens --input data/woodpecker_1128_dataset.csv --study-url https://lichess.org/study/YOUR_STUDY_ID
 *   LICHESS_API_TOKEN=... pnpm woodpecker:fill-fens --study-url https://lichess.org/study/YOUR_STUDY_ID ...
 *
 * Notes:
 * - Rows that already have a `fen` value are skipped.
 * - After each successful update, the CSV is written back to disk atomically.
 * - Failures are recorded to a separate JSON file for later manual resolution.
 * Resolvers (in order): Lichess study (if --study-url) → ChessRest API → local PGN (if --pgn-file) → manual map.
 *
 * Optional: --pgn-file path/to/games.pgn  (index by White|Black|Event|Year and resolve from file)
 */

import * as fs from "fs";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import * as path from "path";
import { Chess } from "chess.js";
import { parseCsv } from "../src/lib/csv";

type WoodpeckerCsvRow = {
  exercise_number: string;
  section: string;
  title: string;
  fen: string;
  move_position: string;
  raw_solution: string;
  solution: string;
  comment: string;
  // Allow additional columns without typing them explicitly
  [key: string]: string;
};

type FailureRecord = {
  exercise_number: string;
  title: string;
  move_position: string;
  reason: string;
};

type GameCacheEntry = {
  source: "lichess" | "manual" | "chessrest" | "localpgn";
  pgn: string;
};

type GameCache = Record<string, GameCacheEntry>;

type ParsedTitle = {
  original: string;
  normalizedKey: string;
  white: string;
  black: string;
  eventText?: string;
  year?: number;
};

type ResolverSuccess = {
  ok: true;
  source: "lichess" | "manual" | "chessrest" | "localpgn";
  key: string;
  pgn: string;
};

type ResolverFailure = {
  ok: false;
  reason: string;
};

type ResolverResult = ResolverSuccess | ResolverFailure;

interface GameResolver {
  readonly name: string;
  resolve(parsed: ParsedTitle, cacheKey: string): Promise<ResolverResult>;
}

type CliOptions = {
  inputPath: string;
  failuresPath: string;
  cachePath: string;
  studyUrl?: string;
  pgnFile?: string;
  limit?: number;
  fromExercise?: number;
  dryRun: boolean;
};

const DEFAULT_INPUT = path.join(process.cwd(), "data", "woodpecker_1128_dataset.csv");
const DEFAULT_FAILURES = path.join(process.cwd(), "data", "woodpecker_fen_failures.json");
const DEFAULT_CACHE = path.join(process.cwd(), ".cache", "woodpecker-game-cache.json");

async function atomicWriteFile(filePath: string, contents: string): Promise<void> {
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(filePath)}.tmp`);
  await writeFile(tmp, contents, "utf-8");
  await rename(tmp, filePath);
}

function serializeCsv(headers: string[], rows: Record<string, string>[]): string {
  const escape = (value: string) => {
    const needsQuotes = /[",\n]/.test(value);
    return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value;
  };
  const headerLine = headers.join(",");
  const lines = rows.map((row) => headers.map((h) => escape(row[h] ?? "")).join(","));
  return [headerLine, ...lines].join("\n");
}

function normalizeTitle(raw: string): string {
  let s = raw.replace(/[–—]/g, "-");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function normalizePlayerName(raw: string): string {
  return raw
    .replace(/\./g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeEventText(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let s = raw;
  s = s.replace(/\([^)]*\)/g, " ");
  s = s.replace(/[.,]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s.toLowerCase() || undefined;
}

function parseWoodpeckerTitle(title: string): ParsedTitle {
  const normalized = normalizeTitle(title);

  const yearMatch = normalized.match(/(\d{4})(?!.*\d{4})/);
  const year = yearMatch ? Number(yearMatch[1]) : undefined;
  const withoutYear = yearMatch ? normalized.slice(0, yearMatch.index).trim() : normalized;

  const [playersPart, metaPart] = withoutYear.split(",", 2).map((s) => s.trim());
  const players = playersPart.split("-").map((s) => s.trim());
  const whiteRaw = players[0] ?? "";
  const blackRaw = players[1] ?? "";

  const white = normalizePlayerName(whiteRaw);
  const black = normalizePlayerName(blackRaw);
  const eventText = normalizeEventText(metaPart);

  const keyParts = [white, black];
  if (eventText) keyParts.push(eventText);
  if (!Number.isNaN(year) && year) keyParts.push(String(year));

  const normalizedKey = keyParts.join("|");

  return {
    original: title,
    normalizedKey,
    white,
    black,
    eventText,
    year,
  };
}

async function loadCache(cachePath: string): Promise<GameCache> {
  try {
    const text = await readFile(cachePath, "utf-8");
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      return parsed as GameCache;
    }
  } catch {
    // No cache yet or unreadable; start fresh.
  }
  return {};
}

async function saveCache(cachePath: string, cache: GameCache): Promise<void> {
  await atomicWriteFile(cachePath, JSON.stringify(cache, null, 2));
}

function extractPgnTag(gamePgn: string, tag: string): string | undefined {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\[${escaped}\\s+"([^"]*)"\\s*\\]`, "i");
  const match = gamePgn.match(regex);
  return match ? match[1] : undefined;
}

function splitPgnIntoGames(pgn: string): string[] {
  const trimmed = pgn.trim();
  if (!trimmed) return [];
  const chunks = trimmed.split(/\n\n(?=\[Event\s)/);
  return chunks.map((c) => c.trim()).filter(Boolean);
}

function getStudyIdFromUrl(url: string): string {
  const match = url.match(/lichess\.org\/study\/([^/#?]+)/);
  if (!match) return url.trim();
  return match[1];
}

/** Resolves games from a Lichess study: fetch study PGN, index chapters by title, look up by normalized key. */
class LichessStudyResolver implements GameResolver {
  readonly name = "LichessStudyResolver";
  private index = new Map<string, string>();
  private initialized = false;

  constructor(
    private readonly studyUrlOrId: string,
    private readonly options: { cacheDir: string; token?: string }
  ) {}

  private async fetchStudyPgn(studyId: string): Promise<string> {
    const exportUrl = `https://lichess.org/api/study/${studyId}.pgn?clocks=false&comments=false`;
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (compatible; PatternforgeWoodpeckerFen/1.0)",
      Accept: "application/x-chess-pgn, text/plain, */*",
      Referer: "https://lichess.org/",
    };
    if (this.options.token) {
      headers["Authorization"] = `Bearer ${this.options.token}`;
    }
    const res = await fetch(exportUrl, { headers });
    if (!res.ok) {
      const body = (await res.text()).slice(0, 200);
      throw new Error(`Lichess study export failed: ${res.status} ${res.statusText}. ${body}`);
    }
    const text = await res.text();
    const t = text.trim();
    if (t.startsWith("<!DOCTYPE html") || t.startsWith("<!doctype html") || t.toLowerCase().startsWith("<html")) {
      throw new Error("Lichess returned HTML instead of PGN. Study may be private or not exist.");
    }
    return text;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    const studyId = getStudyIdFromUrl(this.studyUrlOrId);
    const cacheFile = path.join(this.options.cacheDir, `woodpecker-lichess-study-${studyId}.pgn`);
    let pgn: string;
    try {
      pgn = await readFile(cacheFile, "utf-8");
      console.log("Using cached Lichess study PGN:", cacheFile);
    } catch {
      console.log("Fetching Lichess study PGN for", studyId, "...");
      pgn = await this.fetchStudyPgn(studyId);
      await mkdir(this.options.cacheDir, { recursive: true });
      await writeFile(cacheFile, pgn, "utf-8");
      console.log("Cached study PGN to", cacheFile);
    }
    const games = splitPgnIntoGames(pgn);
    for (const game of games) {
      const eventStr = extractPgnTag(game, "Event") ?? "";
      const parsed = parseWoodpeckerTitle(eventStr);
      if (parsed.normalizedKey) this.index.set(parsed.normalizedKey, game);
      const white = (extractPgnTag(game, "White") ?? "").trim();
      const black = (extractPgnTag(game, "Black") ?? "").trim();
      const date = extractPgnTag(game, "Date") ?? "";
      const year = date.slice(-4);
      if (white && black) {
        const altKey = [normalizePlayerName(white), normalizePlayerName(black), parsed.eventText ?? "", year].filter(Boolean).join("|");
        if (altKey && !this.index.has(altKey)) this.index.set(altKey, game);
      }
    }
    this.initialized = true;
    console.log("Lichess study indexed", this.index.size, "chapters.");
  }

  async resolve(parsed: ParsedTitle, cacheKey: string): Promise<ResolverResult> {
    if (!this.initialized) await this.init();
    const pgn = this.index.get(cacheKey) ?? this.index.get(parsed.normalizedKey);
    if (pgn) return { ok: true, source: "lichess", key: cacheKey, pgn };
    return { ok: false, reason: "study_chapter_not_found" };
  }
}

/** Resolves games via chess.rest gameref API (search by player names + year, then fetch game by ID). */
class ChessRestResolver implements GameResolver {
  readonly name = "ChessRestResolver";
  private readonly baseUrl = "https://chess.rest/gameref";

  private capitalize(s: string): string {
    return s.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  async resolve(parsed: ParsedTitle, cacheKey: string): Promise<ResolverResult> {
    if (!parsed.white || !parsed.black) {
      return { ok: false, reason: "chessrest_missing_players" };
    }
    const year = parsed.year ?? 0;
    if (!year || year < 1000 || year > 9999) {
      return { ok: false, reason: "chessrest_missing_year" };
    }
    try {
      const searchParams = new URLSearchParams({
        player1_name: this.capitalize(parsed.white),
        player2_name: this.capitalize(parsed.black),
        year: String(year),
      });
      const searchUrl = `${this.baseUrl}/game/search?${searchParams.toString()}`;
      const searchRes = await fetch(searchUrl, {
        headers: { Accept: "application/json" },
      });
      if (!searchRes.ok) {
        return { ok: false, reason: `chessrest_search_${searchRes.status}` };
      }
      const searchData = (await searchRes.json()) as unknown;
      const games = Array.isArray(searchData)
        ? searchData
        : (searchData as Record<string, unknown>)?.games ?? (searchData as Record<string, unknown>)?.data;
      if (!Array.isArray(games) || games.length === 0) {
        return { ok: false, reason: "chessrest_no_results" };
      }
      const first = games[0] as Record<string, unknown>;
      const gameId = first?.id ?? first?.game_id ?? first?.gameId;
      if (gameId == null || String(gameId).trim() === "") {
        return { ok: false, reason: "chessrest_no_game_id" };
      }
      const gameUrl = `${this.baseUrl}/game?id=${encodeURIComponent(String(gameId))}`;
      const gameRes = await fetch(gameUrl, { headers: { Accept: "application/json" } });
      if (!gameRes.ok) {
        return { ok: false, reason: `chessrest_game_${gameRes.status}` };
      }
      const gameData = (await gameRes.json()) as Record<string, unknown>;
      let pgn = typeof gameData?.pgn === "string" ? gameData.pgn : null;
      if (!pgn && typeof gameData?.moves === "string") {
        const white = String(gameData?.white ?? "White").replace(/"/g, '""');
        const black = String(gameData?.black ?? "Black").replace(/"/g, '""');
        const event = String(gameData?.event ?? "?").replace(/"/g, '""');
        const date = String(gameData?.date ?? "????.??.??");
        pgn = `[Event "${event}"]\n[White "${white}"]\n[Black "${black}"]\n[Date "${date}"]\n\n${gameData.moves}`;
      }
      if (!pgn || pgn.trim() === "") {
        return { ok: false, reason: "chessrest_no_pgn" };
      }
      await new Promise((r) => setTimeout(r, 300));
      return { ok: true, source: "chessrest", key: cacheKey, pgn };
    } catch (err) {
      return {
        ok: false,
        reason: `chessrest_error: ${(err as Error).message}`,
      };
    }
  }
}

/** Resolves games from a local PGN file indexed by White|Black|Event|Year. */
class LocalPgnResolver implements GameResolver {
  readonly name = "LocalPgnResolver";
  private index = new Map<string, string>();
  private initialized = false;

  constructor(private readonly pgnPath: string) {}

  async init(): Promise<void> {
    if (this.initialized) return;
    const content = await readFile(this.pgnPath, "utf-8");
    const games = splitPgnIntoGames(content);
    for (const game of games) {
      const white = normalizePlayerName(extractPgnTag(game, "White") ?? "");
      const black = normalizePlayerName(extractPgnTag(game, "Black") ?? "");
      const date = extractPgnTag(game, "Date") ?? "";
      const year = date.slice(-4).replace(/\D/g, "") || undefined;
      const event = normalizeEventText(extractPgnTag(game, "Event") ?? "");
      const keyParts = [white, black];
      if (event) keyParts.push(event);
      if (year) keyParts.push(year);
      const key = keyParts.join("|");
      if (key && !this.index.has(key)) this.index.set(key, game);
      const eventStr = extractPgnTag(game, "Event") ?? "";
      const parsed = parseWoodpeckerTitle(eventStr);
      if (parsed.normalizedKey && !this.index.has(parsed.normalizedKey)) {
        this.index.set(parsed.normalizedKey, game);
      }
    }
    this.initialized = true;
    console.log("Local PGN indexed", this.index.size, "games from", this.pgnPath);
  }

  async resolve(parsed: ParsedTitle, cacheKey: string): Promise<ResolverResult> {
    if (!this.initialized) await this.init();
    const pgn = this.index.get(cacheKey) ?? this.index.get(parsed.normalizedKey);
    if (pgn) return { ok: true, source: "localpgn", key: cacheKey, pgn };
    return { ok: false, reason: "localpgn_not_found" };
  }
}

class LichessGameResolver implements GameResolver {
  readonly name = "LichessGameResolver";

  async resolve(parsed: ParsedTitle, _cacheKey: string): Promise<ResolverResult> {
    return {
      ok: false,
      reason: "lichess_title_search_not_supported",
    };
  }
}

class ManualMappingResolver implements GameResolver {
  readonly name = "ManualMappingResolver";

  constructor(private readonly mapPath: string) {}

  async resolve(parsed: ParsedTitle, cacheKey: string): Promise<ResolverResult> {
    try {
      const text = await readFile(this.mapPath, "utf-8");
      const data = JSON.parse(text) as Record<string, { pgn: string }>;
      const direct = data[cacheKey];
      if (direct?.pgn) {
        return { ok: true, source: "manual", key: cacheKey, pgn: direct.pgn };
      }
      const fallback = data[parsed.normalizedKey];
      if (fallback?.pgn) {
        return { ok: true, source: "manual", key: parsed.normalizedKey, pgn: fallback.pgn };
      }
      return { ok: false, reason: "manual_mapping_not_found" };
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        return { ok: false, reason: "manual_mapping_not_found" };
      }
      return {
        ok: false,
        reason: `manual_mapping_read_error: ${(err as Error).message}`,
      };
    }
  }
}

function parseMovePosition(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function inferFirstMoveInfo(rawSolution: string): { moveNumber: number; startsWithBlack: boolean } | null {
  const s = rawSolution.trim();
  if (!s) return null;
  const match = s.match(/^(\d+)\.(\.\.)?/);
  if (!match) return null;
  const num = Number(match[1]);
  if (!Number.isFinite(num)) return null;
  const startsWithBlack = !!match[2];
  return { moveNumber: num, startsWithBlack };
}

function extractFirstSan(solution: string, rawSolution?: string): string | undefined {
  const trimmedSolution = solution.trim();
  if (trimmedSolution) {
    if (trimmedSolution.startsWith("[")) {
      try {
        const arr = JSON.parse(trimmedSolution) as unknown;
        if (Array.isArray(arr) && typeof arr[0] === "string" && arr[0].trim()) {
          return arr[0].trim();
        }
      } catch {
        // Fall through to raw_solution parsing.
      }
    }
  }

  const src = rawSolution ?? trimmedSolution;
  if (!src) return undefined;
  const withoutPrefix = src.replace(/^\d+\.(\.\.)?\s*/, "");
  const token = withoutPrefix.split(/\s+/)[0];
  return token || undefined;
}

function getFenAtWoodpeckerMovePosition(pgn: string, movePosition: number, rawSolution?: string): string | null {
  const info = inferFirstMoveInfo(rawSolution ?? "");
  if (!info) return null;

  const targetFullMove = movePosition + 1;
  const targetTurn: "w" | "b" = info.startsWithBlack ? "b" : "w";

  const game = new Chess();
  if (!game.loadPgn(pgn, { sloppy: true })) {
    return null;
  }
  const sanMoves = game.history();

  const replay = new Chess();

  const checkPosition = (): string | null => {
    const fen = replay.fen();
    const parts = fen.split(" ");
    if (parts.length < 6) return null;
    const fullMove = Number(parts[5]);
    const turn = replay.turn();
    if (fullMove === targetFullMove && turn === targetTurn) {
      return fen;
    }
    return null;
  };

  let fen = checkPosition();
  if (fen) return fen;

  for (const san of sanMoves) {
    const move = replay.move(san, { sloppy: true });
    if (!move) break;
    fen = checkPosition();
    if (fen) return fen;
  }

  return null;
}

function validateFirstSolutionMove(fen: string, solution: string, rawSolution?: string): boolean {
  const firstSan = extractFirstSan(solution, rawSolution);
  if (!firstSan) return true;
  const chess = new Chess(fen);
  const res = chess.move(firstSan, { sloppy: true });
  return !!res;
}

function parseCliArgs(argv: string[]): CliOptions {
  let inputPath = DEFAULT_INPUT;
  let failuresPath = DEFAULT_FAILURES;
  let cachePath = DEFAULT_CACHE;
  let studyUrl: string | undefined;
  let pgnFile: string | undefined;
  let limit: number | undefined;
  let fromExercise: number | undefined;
  let dryRun = false;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--input" && argv[i + 1]) {
      inputPath = path.resolve(argv[++i]);
    } else if (arg === "--failures" && argv[i + 1]) {
      failuresPath = path.resolve(argv[++i]);
    } else if (arg === "--cache" && argv[i + 1]) {
      cachePath = path.resolve(argv[++i]);
    } else if ((arg === "--study-url" || arg === "--study") && argv[i + 1]) {
      studyUrl = argv[++i].trim();
    } else if ((arg === "--pgn-file" || arg === "--pgn") && argv[i + 1]) {
      pgnFile = path.resolve(argv[++i].trim());
    } else if (arg === "--limit" && argv[i + 1]) {
      const num = Number(argv[++i]);
      if (Number.isFinite(num) && num > 0) limit = num;
    } else if (arg === "--from" && argv[i + 1]) {
      const num = Number(argv[++i]);
      if (Number.isFinite(num) && num > 0) fromExercise = num;
    } else if (arg === "--dry-run") {
      dryRun = true;
    }
  }

  return { inputPath, failuresPath, cachePath, studyUrl, pgnFile, limit, fromExercise, dryRun };
}

async function loadFailures(pathname: string): Promise<FailureRecord[]> {
  try {
    const text = await readFile(pathname, "utf-8");
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data as FailureRecord[];
  } catch {
    // No failures yet; start fresh.
  }
  return [];
}

async function saveFailures(pathname: string, failures: FailureRecord[]): Promise<void> {
  await atomicWriteFile(pathname, JSON.stringify(failures, null, 2));
}

async function main() {
  const cli = parseCliArgs(process.argv);

  console.log("Woodpecker FEN filler\n");
  console.log("Input CSV:", cli.inputPath);
  console.log("Failures report:", cli.failuresPath);
  console.log("Cache file:", cli.cachePath);
  if (cli.studyUrl) console.log("Lichess study:", cli.studyUrl);
  if (cli.pgnFile) console.log("Local PGN file:", cli.pgnFile);
  if (cli.limit) console.log("Limit:", cli.limit);
  if (cli.fromExercise) console.log("From exercise_number >=", cli.fromExercise);
  if (cli.dryRun) console.log("Dry run: no files will be written.");
  console.log();

  if (!fs.existsSync(cli.inputPath)) {
    console.error("Error: Input file not found:", cli.inputPath);
    process.exit(1);
  }

  const csvText = await readFile(cli.inputPath, "utf-8");
  const { headers, rows } = parseCsv(csvText);

  const expectedColumns = [
    "exercise_number",
    "section",
    "title",
    "fen",
    "move_position",
    "raw_solution",
    "solution",
    "comment",
  ];
  const missing = expectedColumns.filter((c) => !headers.includes(c));
  if (missing.length > 0) {
    console.error("Error: Input CSV is missing expected columns:", missing.join(", "));
    process.exit(1);
  }

  let failures = await loadFailures(cli.failuresPath);
  let cache = await loadCache(cli.cachePath);
  const resolvers: GameResolver[] = [];
  if (cli.studyUrl) {
    const studyResolver = new LichessStudyResolver(cli.studyUrl, {
      cacheDir: path.dirname(cli.cachePath),
      token: process.env.LICHESS_API_TOKEN,
    });
    await studyResolver.init();
    resolvers.push(studyResolver);
  }
  resolvers.push(new ChessRestResolver());
  if (cli.pgnFile) {
    if (!fs.existsSync(cli.pgnFile)) {
      console.error("Error: PGN file not found:", cli.pgnFile);
      process.exit(1);
    }
    const localPgn = new LocalPgnResolver(cli.pgnFile);
    await localPgn.init();
    resolvers.push(localPgn);
  }
  resolvers.push(new LichessGameResolver());
  resolvers.push(new ManualMappingResolver(path.join(process.cwd(), "data", "woodpecker-manual-game-map.json")));

  const rowObjects = rows as WoodpeckerCsvRow[];

  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < rowObjects.length; i++) {
    const row = rowObjects[i];
    const idx = i + 1;
    const exerciseNumber = Number(row.exercise_number);

    if (cli.fromExercise && Number.isFinite(exerciseNumber) && exerciseNumber < cli.fromExercise) {
      skipped++;
      continue;
    }

    if (row.fen && row.fen.trim() !== "") {
      console.log(
        `[${idx}/${rowObjects.length}] exercise ${row.exercise_number} - ${row.title} :: skipped (fen already present)`
      );
      skipped++;
      continue;
    }

    processed++;
    if (cli.limit && processed > cli.limit) {
      console.log("\nReached processing limit. Stopping.");
      break;
    }

    console.log(
      `[${idx}/${rowObjects.length}] exercise ${row.exercise_number} - ${row.title} :: resolving game and FEN...`
    );

    const parsedTitle = parseWoodpeckerTitle(row.title);
    const movePos = parseMovePosition(row.move_position);
    if (movePos == null) {
      const reason = "invalid_move_position";
      console.log("  -> failed:", reason);
      failures.push({
        exercise_number: row.exercise_number,
        title: row.title,
        move_position: row.move_position,
        reason,
      });
      if (!cli.dryRun) {
        await saveFailures(cli.failuresPath, failures);
      }
      failed++;
      continue;
    }

    const cacheKey = parsedTitle.normalizedKey;
    let pgn: string | null = null;
    let source: "lichess" | "manual" | "chessrest" | "localpgn" | null = null;

    const cached = cache[cacheKey];
    if (cached) {
      pgn = cached.pgn;
      source = cached.source;
      console.log("  -> cache hit from", source);
    } else {
      for (const resolver of resolvers) {
        const res = await resolver.resolve(parsedTitle, cacheKey);
        if (res.ok) {
          pgn = res.pgn;
          source = res.source;
          cache[res.key] = { source: res.source, pgn: res.pgn };
          console.log("  -> resolved via", resolver.name, "source:", source);
          break;
        } else {
          console.log("  ->", resolver.name, "failed:", res.reason);
        }
      }
      if (pgn && !cli.dryRun) {
        await saveCache(cli.cachePath, cache);
      }
    }

    if (!pgn) {
      const reason = "no_matching_game_found";
      console.log("  -> failed:", reason);
      failures.push({
        exercise_number: row.exercise_number,
        title: row.title,
        move_position: row.move_position,
        reason,
      });
      if (!cli.dryRun) {
        await saveFailures(cli.failuresPath, failures);
      }
      failed++;
      continue;
    }

    const fen = getFenAtWoodpeckerMovePosition(pgn, movePos, row.raw_solution);
    if (!fen) {
      const reason = "could_not_compute_fen_at_move_position";
      console.log("  -> failed:", reason);
      failures.push({
        exercise_number: row.exercise_number,
        title: row.title,
        move_position: row.move_position,
        reason,
      });
      if (!cli.dryRun) {
        await saveFailures(cli.failuresPath, failures);
      }
      failed++;
      continue;
    }

    const isValid = validateFirstSolutionMove(fen, row.solution, row.raw_solution);
    if (!isValid) {
      const reason = "first_solution_move_illegal_from_computed_fen";
      console.log("  -> failed:", reason);
      failures.push({
        exercise_number: row.exercise_number,
        title: row.title,
        move_position: row.move_position,
        reason,
      });
      if (!cli.dryRun) {
        await saveFailures(cli.failuresPath, failures);
      }
      failed++;
      continue;
    }

    row.fen = fen;
    updated++;
    console.log("  -> success. FEN set.");

    if (!cli.dryRun) {
      const csvOut = serializeCsv(headers, rowObjects);
      await atomicWriteFile(cli.inputPath, csvOut);
    }
  }

  console.log("\nDone.");
  console.log("  Processed (missing-fen rows considered):", processed);
  console.log("  Updated:", updated);
  console.log("  Skipped (fen already present or before --from):", skipped);
  console.log("  Failed:", failed);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

