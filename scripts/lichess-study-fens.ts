/**
 * Extracts chapter FENs from a Lichess study via the PGN export API.
 * Usage: pnpm exec tsx scripts/lichess-study-fens.ts
 *
 * If you get 403 Forbidden, Lichess may require authentication for study export.
 * Create a token at https://lichess.org/account/oauth/token and run:
 *   LICHESS_API_TOKEN=your_token pnpm exec tsx scripts/lichess-study-fens.ts
 */

import { mkdir, writeFile } from "fs/promises";
import * as path from "path";

const STUDY_URL = "https://lichess.org/study/a7tf5sc1";
/** Offset for chapter numbers; e.g. 50 → chapters are numbered 51, 52, 53, ... */
const CHAPTER_NUMBER_OFFSET = 1013;

/** Optional. Set LICHESS_API_TOKEN if you get 403 Forbidden (e.g. create at https://lichess.org/account/oauth/token). */
const LICHESS_API_TOKEN = process.env.LICHESS_API_TOKEN;

type Row = {
  chapterNumber: number;
  chapterTitle: string;
  fen: string;
};

const OUTPUT_DIR = path.join(process.cwd(), "output");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "study-fens.csv");

function getStudyId(url: string): string {
  const match = url.match(/lichess\.org\/study\/([^/#?]+)/);
  if (!match) {
    throw new Error(
      `Invalid Lichess study URL: ${url}. Expected format: https://lichess.org/study/<studyId>`
    );
  }
  return match[1];
}

async function fetchStudyPgn(studyId: string): Promise<string> {
  const exportUrl = `https://lichess.org/api/study/${studyId}.pgn?clocks=false&comments=false`;
  console.log("Fetching PGN from:", exportUrl);
  if (LICHESS_API_TOKEN) console.log("Using LICHESS_API_TOKEN for authentication.");

  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/x-chess-pgn, text/plain, */*",
    Referer: "https://lichess.org/",
  };
  if (LICHESS_API_TOKEN) {
    headers["Authorization"] = `Bearer ${LICHESS_API_TOKEN}`;
  }

  const res = await fetch(exportUrl, { headers });

  if (!res.ok) {
    const bodyPreview = (await res.text()).slice(0, 300);
    console.error("Export request failed.");
    console.error("Status:", res.status, res.statusText);
    console.error("Body preview:", bodyPreview);
    if (res.status === 403 && !LICHESS_API_TOKEN) {
      console.error(
        "\nTip: Lichess may require auth for study export. Set LICHESS_API_TOKEN (create at https://lichess.org/account/oauth/token)."
      );
    }
    throw new Error(`Lichess export returned ${res.status} ${res.statusText}`);
  }

  const text = await res.text();

  const trimmed = text.trim();
  if (
    trimmed.startsWith("<!DOCTYPE html") ||
    trimmed.startsWith("<!doctype html") ||
    trimmed.toLowerCase().startsWith("<html")
  ) {
    throw new Error(
      "Lichess returned HTML instead of PGN. The study may be private, not exist, or the export endpoint may have changed."
    );
  }

  return text;
}

function splitPgnGames(pgn: string): string[] {
  const trimmed = pgn.trim();
  if (!trimmed) return [];

  // Games are separated by blank lines; each game starts with [Event "..."]
  const chunks = trimmed.split(/\n\n(?=\[Event\s)/);
  return chunks.map((c) => c.trim()).filter(Boolean);
}

function extractTag(game: string, tag: string): string | undefined {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\[${escaped}\\s+"([^"]*)"\\s*\\]`, "i");
  const match = game.match(regex);
  return match ? match[1] : undefined;
}

function parseRows(pgn: string): Row[] {
  const games = splitPgnGames(pgn);
  console.log("Found", games.length, "chapter(s) in PGN.");

  const rows: Row[] = [];
  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    const chapterNumber = CHAPTER_NUMBER_OFFSET + (i + 1);
    const chapterTitle = extractTag(game, "Event") ?? `Chapter ${chapterNumber}`;
    const fen = extractTag(game, "FEN") ?? "startpos";
    rows.push({ chapterNumber, chapterTitle, fen });
    console.log(`  ${chapterNumber}. ${chapterTitle}`);
  }
  return rows;
}

function toCsv(rows: Row[]): string {
  const header = "chapterNumber,fen";
  const escape = (s: string) => {
    const needsQuotes = /[",\n]/.test(s);
    return needsQuotes ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header, ...rows.map((r) => [r.chapterNumber, escape(r.fen)].join(","))];
  return lines.join("\n");
}

async function main(): Promise<void> {
  console.log("Lichess study FEN extractor");
  console.log("Study URL:", STUDY_URL, "\n");

  const studyId = getStudyId(STUDY_URL);
  console.log("Study ID:", studyId);

  const pgn = await fetchStudyPgn(studyId);
  console.log("PGN length:", pgn.length, "characters\n");

  const rows = parseRows(pgn);
  if (rows.length === 0) {
    console.log("No chapters to write.");
    return;
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  const csv = toCsv(rows);
  await writeFile(OUTPUT_FILE, csv, "utf-8");

  console.log("\nWrote", rows.length, "row(s) to", OUTPUT_FILE);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
