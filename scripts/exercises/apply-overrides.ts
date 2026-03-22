/**
 * Apply developer manual overrides on top of `exercise.verified.json`.
 *
 * - Inputs: verified envelope (certified exercises), `data/exercises/overrides/exercise.overrides.json`
 * - Output: `data/exercises/generated/exercise.final.json` (deterministic merge; does not edit verified)
 *
 * Usage:
 *   pnpm run exercises:apply-overrides
 *   pnpm exec tsx scripts/exercises/apply-overrides.ts --verified path --overrides path --output path
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type {
  ExerciseRecord,
  ExerciseStatus,
  ExerciseVerification,
} from "../../src/domain/training/types/exercise-record";

export const DEFAULT_VERIFIED_PATH = path.join(
  process.cwd(),
  "data",
  "exercises",
  "generated",
  "exercise.verified.json"
);

export const DEFAULT_OVERRIDES_PATH = path.join(
  process.cwd(),
  "data",
  "exercises",
  "overrides",
  "exercise.overrides.json"
);

export const DEFAULT_FINAL_PATH = path.join(
  process.cwd(),
  "data",
  "exercises",
  "generated",
  "exercise.final.json"
);

const OVERRIDE_STATUSES = new Set<ExerciseStatus>([
  "certified",
  "manual_review",
  "broken",
]);

export interface ExerciseOverrideEntry {
  exerciseId: string;
  status: "certified" | "manual_review" | "broken";
  reason: string;
  acceptedAlternativeFirstMoves?: string[];
}

export interface ExerciseOverridesFile {
  schemaVersion: 1;
  overrides: ExerciseOverrideEntry[];
}

export interface ExerciseFinalEnvelope {
  schemaVersion: 1;
  generatedAt: string;
  lastVerifiedAt: string;
  sourceVerifiedPath: string;
  sourceOverridesPath: string;
  appliedOverrideCount: number;
  recordCount: number;
  records: ExerciseRecord[];
  readError?: string;
}

interface VerifiedEnvelope {
  schemaVersion?: number;
  records?: ExerciseRecord[];
  sourceContractPath?: string;
  sourceValidationReportPath?: string;
  certificationKind?: string;
  generatedAt?: string;
  lastVerifiedAt?: string;
}

function parseArgs(argv: string[]): {
  verified: string;
  overrides: string;
  output: string;
} {
  let verified = DEFAULT_VERIFIED_PATH;
  let overrides = DEFAULT_OVERRIDES_PATH;
  let output = DEFAULT_FINAL_PATH;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if ((a === "--verified" || a === "-v") && argv[i + 1]) {
      verified = path.resolve(process.cwd(), argv[++i]);
    } else if ((a === "--overrides" || a === "-o") && argv[i + 1]) {
      overrides = path.resolve(process.cwd(), argv[++i]);
    } else if ((a === "--output" || a === "-O") && argv[i + 1]) {
      output = path.resolve(process.cwd(), argv[++i]);
    }
  }
  return { verified, overrides, output };
}

function loadOverrides(filePath: string): {
  byId: Map<string, ExerciseOverrideEntry>;
  relPath: string;
  error?: string;
} {
  const relPath = path.relative(process.cwd(), filePath) || filePath;
  if (!fs.existsSync(filePath)) {
    return { byId: new Map(), relPath, error: `Overrides file not found: ${relPath}` };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as ExerciseOverridesFile;
    const list = Array.isArray(raw.overrides) ? raw.overrides : [];
    const byId = new Map<string, ExerciseOverrideEntry>();
    for (const o of list) {
      if (!o?.exerciseId || typeof o.exerciseId !== "string") continue;
      if (!OVERRIDE_STATUSES.has(o.status)) continue;
      if (typeof o.reason !== "string" || o.reason.trim() === "") continue;
      byId.set(o.exerciseId.trim(), {
        exerciseId: o.exerciseId.trim(),
        status: o.status,
        reason: o.reason.trim(),
        ...(Array.isArray(o.acceptedAlternativeFirstMoves)
          ? {
              acceptedAlternativeFirstMoves: o.acceptedAlternativeFirstMoves.filter(
                (m) => typeof m === "string" && m.trim() !== ""
              ),
            }
          : {}),
      });
    }
    return { byId, relPath };
  } catch (e) {
    return {
      byId: new Map(),
      relPath,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

function loadVerified(filePath: string): {
  records: ExerciseRecord[];
  relPath: string;
  meta: Partial<VerifiedEnvelope>;
  error?: string;
} {
  const relPath = path.relative(process.cwd(), filePath) || filePath;
  if (!fs.existsSync(filePath)) {
    return {
      records: [],
      relPath,
      meta: {},
      error: `Verified file not found: ${relPath}`,
    };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as VerifiedEnvelope;
    const records = Array.isArray(raw.records) ? raw.records : [];
    return {
      records,
      relPath,
      meta: {
        sourceContractPath: raw.sourceContractPath,
        sourceValidationReportPath: raw.sourceValidationReportPath,
        lastVerifiedAt: raw.lastVerifiedAt,
      },
    };
  } catch (e) {
    return {
      records: [],
      relPath,
      meta: {},
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Merge one override into a copy of {@link ExerciseVerification}.
 * Deterministic: reasons = [`[manual_override] …`, …prior reasons without prior override markers].
 */
export function mergeVerificationWithOverride(
  verification: ExerciseVerification,
  override: ExerciseOverrideEntry,
  appliedAt: string
): ExerciseVerification {
  const priorReasons = verification.reasons.filter(
    (r) => typeof r === "string" && !r.startsWith("[manual_override]")
  );
  const reasons = [`[manual_override] ${override.reason}`, ...priorReasons];

  let manualReviewNotes = verification.manualReviewNotes;
  const alt = override.acceptedAlternativeFirstMoves;
  if (alt && alt.length > 0) {
    const line = `Accepted alternative first moves (UCI): ${alt.join(", ")}`;
    manualReviewNotes = manualReviewNotes
      ? `${manualReviewNotes}\n${line}`
      : line;
  }

  return {
    ...verification,
    status: override.status,
    reasons,
    ...(manualReviewNotes !== undefined ? { manualReviewNotes } : {}),
    lastVerifiedAt: appliedAt,
  };
}

export function applyOverridesToRecords(
  records: ExerciseRecord[],
  byId: Map<string, ExerciseOverrideEntry>,
  appliedAt: string
): { next: ExerciseRecord[]; appliedCount: number } {
  let appliedCount = 0;
  const next = records.map((r) => {
    const o = byId.get(r.id);
    if (!o) return r;
    appliedCount += 1;
    return {
      ...r,
      verification: mergeVerificationWithOverride(r.verification, o, appliedAt),
    };
  });
  return { next, appliedCount };
}

function writeFinal(outputPath: string, envelope: ExerciseFinalEnvelope): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${JSON.stringify(envelope, null, 2)}\n`,
    "utf-8"
  );
}

function main(): void {
  const { verified, overrides, output } = parseArgs(process.argv);
  const generatedAt = new Date().toISOString();

  const v = loadVerified(verified);
  const o = loadOverrides(overrides);

  if (v.error) {
    const envelope: ExerciseFinalEnvelope = {
      schemaVersion: 1,
      generatedAt,
      lastVerifiedAt: generatedAt,
      sourceVerifiedPath: v.relPath,
      sourceOverridesPath: o.relPath,
      appliedOverrideCount: 0,
      recordCount: 0,
      records: [],
      readError: v.error,
    };
    writeFinal(output, envelope);
    console.warn("[exercises:apply-overrides]", v.error);
    console.log(`Wrote → ${path.relative(process.cwd(), output) || output}`);
    return;
  }

  if (o.error) {
    console.warn("[exercises:apply-overrides] overrides:", o.error);
  }

  const recordIds = new Set(v.records.map((r) => r.id));
  for (const id of o.byId.keys()) {
    if (!recordIds.has(id)) {
      console.warn(
        `[exercises:apply-overrides] override for unknown exerciseId (not in verified): ${id}`
      );
    }
  }

  const { next, appliedCount } = applyOverridesToRecords(
    v.records,
    o.byId,
    generatedAt
  );

  const envelope: ExerciseFinalEnvelope = {
    schemaVersion: 1,
    generatedAt,
    lastVerifiedAt: generatedAt,
    sourceVerifiedPath: v.relPath,
    sourceOverridesPath: o.relPath,
    appliedOverrideCount: appliedCount,
    recordCount: next.length,
    records: next,
  };

  writeFinal(output, envelope);

  console.log(
    `[exercises:apply-overrides] records=${next.length} appliedOverrides=${appliedCount} → ${path.relative(process.cwd(), output) || output}`
  );
}

main();
