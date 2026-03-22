/**
 * Assign certification status to each exercise from contract + static validation report.
 * Does not modify `exercise.contract.json`; writes derived JSON artifacts only. Always exits 0.
 *
 * Prerequisites: run `pnpm run exercises:validate` (after `exercises:normalize`) so the
 * validation report exists.
 *
 * Usage:
 *   pnpm run exercises:certify
 *   pnpm exec tsx scripts/exercises/certify-exercises.ts --contract path --validation path --out-dir path
 */

import * as fs from "fs";
import * as path from "path";
import type {
  ExerciseRecord,
  ExerciseStatus,
} from "../../src/domain/training/types/exercise-record";
import type {
  ExerciseValidationFlag,
  ExerciseValidationReport,
} from "./validate-exercises";

export const DEFAULT_CONTRACT_PATH = path.join(
  process.cwd(),
  "data",
  "exercises",
  "generated",
  "exercise.contract.json"
);

export const DEFAULT_VALIDATION_PATH = path.join(
  process.cwd(),
  "data",
  "exercises",
  "generated",
  "exercise.validation-report.json"
);

export const DEFAULT_OUT_DIR = path.join(
  process.cwd(),
  "data",
  "exercises",
  "generated"
);

/**
 * ## Status rules (certificationRulesVersion 2)
 *
 * **broken** — any of these validation flags:
 *   - invalid_fen, missing_fen, illegal_first_move, illegal_line, duplicate_id, missing_solution
 *
 * **manual_review** — at least one validation flag remains, and none are broken-tier, including:
 *   - missing_title, side_to_move_mismatch
 *   - solution_normalization_partial (UCI prefix OK; tail of raw tokens did not convert)
 *   - solution_normalization_failed (no usable UCI; notation/import issue — not scored as illegal_line)
 *
 * Clearly **illegal stored UCI replay** still surfaces as illegal_first_move / illegal_line → **broken**.
 *
 * **certified** — validation entry exists, no flags.
 *
 * **pending** — status cannot be decided from this report:
 *   - validation report file missing
 *   - validation report `contractReadError` set
 *   - no `exercises[i]` entry for this contract index (length mismatch or missing row)
 */
export const CERTIFICATION_RULES_VERSION = 2;

const BROKEN_FLAGS: ReadonlySet<ExerciseValidationFlag> = new Set([
  "invalid_fen",
  "missing_fen",
  "illegal_first_move",
  "illegal_line",
  "duplicate_id",
  /** Unplayable; broken-tier even though not named in the original task list. */
  "missing_solution",
]);

export interface CertifiedDatasetEnvelope {
  schemaVersion: 1;
  certificationKind: "certified" | "manual_review" | "broken";
  certificationRulesVersion: number;
  generatedAt: string;
  lastVerifiedAt: string;
  sourceContractPath: string;
  sourceValidationReportPath: string;
  recordCount: number;
  records: ExerciseRecord[];
}

export interface ExerciseCertificationSummary {
  schemaVersion: 1;
  certificationRulesVersion: number;
  generatedAt: string;
  lastVerifiedAt: string;
  sourceContractPath: string;
  sourceValidationReportPath: string;
  totals: {
    total: number;
    certified: number;
    manual_review: number;
    broken: number;
    pending: number;
  };
  /** True when contract record count ≠ validation `exercises` length (or validation unusable). */
  validationAlignmentWarning: boolean;
  notes: string[];
}

function parseArgs(argv: string[]): {
  contract: string;
  validation: string;
  outDir: string;
} {
  let contract = DEFAULT_CONTRACT_PATH;
  let validation = DEFAULT_VALIDATION_PATH;
  let outDir = DEFAULT_OUT_DIR;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if ((a === "--contract" || a === "-c") && argv[i + 1]) {
      contract = path.resolve(process.cwd(), argv[++i]);
    } else if ((a === "--validation" || a === "-v") && argv[i + 1]) {
      validation = path.resolve(process.cwd(), argv[++i]);
    } else if ((a === "--out-dir" || a === "-d") && argv[i + 1]) {
      outDir = path.resolve(process.cwd(), argv[++i]);
    }
  }
  return { contract, validation, outDir };
}

function loadContract(filePath: string): {
  records: ExerciseRecord[];
  relPath: string;
  error?: string;
} {
  const relPath = path.relative(process.cwd(), filePath) || filePath;
  if (!fs.existsSync(filePath)) {
    return { records: [], relPath, error: `Contract not found: ${filePath}` };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
    let records: ExerciseRecord[] = [];
    if (Array.isArray(raw)) {
      records = raw as ExerciseRecord[];
    } else if (
      raw &&
      typeof raw === "object" &&
      "records" in raw &&
      Array.isArray((raw as { records: unknown }).records)
    ) {
      records = (raw as { records: ExerciseRecord[] }).records;
    } else {
      return {
        records: [],
        relPath,
        error: "Contract must be an array or `{ records: [...] }`.",
      };
    }
    return { records, relPath };
  } catch (e) {
    return {
      records: [],
      relPath,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

function loadValidationReport(
  filePath: string
): {
  report: ExerciseValidationReport | null;
  relPath: string;
  error?: string;
} {
  const relPath = path.relative(process.cwd(), filePath) || filePath;
  if (!fs.existsSync(filePath)) {
    return { report: null, relPath, error: `Validation report not found: ${filePath}` };
  }
  try {
    const report = JSON.parse(
      fs.readFileSync(filePath, "utf-8")
    ) as ExerciseValidationReport;
    return { report, relPath };
  } catch (e) {
    return {
      report: null,
      relPath,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

function classifyFromFlags(
  flags: ExerciseValidationFlag[],
  hasEntry: boolean,
  canUseValidation: boolean
): { status: ExerciseStatus; reasons: string[] } {
  const reasons = [...flags];

  if (!canUseValidation) {
    return { status: "pending", reasons: ["validation_unavailable"] };
  }
  if (!hasEntry) {
    return { status: "pending", reasons: ["no_validation_entry"] };
  }

  const hasBroken = flags.some((f) => BROKEN_FLAGS.has(f));
  if (hasBroken) {
    return { status: "broken", reasons };
  }
  if (flags.length > 0) {
    return { status: "manual_review", reasons };
  }
  return { status: "certified", reasons: [] };
}

function applyVerification(
  record: ExerciseRecord,
  status: ExerciseStatus,
  reasons: string[],
  lastVerifiedAt: string
): ExerciseRecord {
  return {
    ...record,
    verification: {
      ...record.verification,
      status,
      reasons,
      lastVerifiedAt,
    },
  };
}

function writeJson(outputPath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${JSON.stringify(data, null, 2)}\n`,
    "utf-8"
  );
}

function main(): void {
  const { contract, validation, outDir } = parseArgs(process.argv);
  const generatedAt = new Date().toISOString();
  const lastVerifiedAt = generatedAt;

  const contractLoad = loadContract(contract);
  const validationLoad = loadValidationReport(validation);

  const notes: string[] = [];
  if (contractLoad.error) notes.push(contractLoad.error);
  if (validationLoad.error) notes.push(validationLoad.error);

  const report = validationLoad.report;
  const canUseValidation = Boolean(
    report && !report.contractReadError && !validationLoad.error
  );

  if (report?.contractReadError) {
    notes.push(`Validation report contractReadError: ${report.contractReadError}`);
  }

  const records = contractLoad.records;
  const entries = report?.exercises ?? [];

  if (
    canUseValidation &&
    entries.length !== records.length
  ) {
    notes.push(
      `Validation entry count (${entries.length}) ≠ contract records (${records.length}); indices without a matching entry are pending.`
    );
  }

  const certified: ExerciseRecord[] = [];
  const manualReview: ExerciseRecord[] = [];
  const broken: ExerciseRecord[] = [];
  let pendingCount = 0;

  for (let i = 0; i < records.length; i++) {
    const hasEntry = i < entries.length;
    const flags = hasEntry ? entries[i].flags : [];

    const { status, reasons } = classifyFromFlags(
      flags,
      hasEntry,
      canUseValidation
    );

    if (status === "pending") pendingCount += 1;

    const updated = applyVerification(
      records[i],
      status,
      reasons,
      lastVerifiedAt
    );

    if (status === "certified") certified.push(updated);
    else if (status === "manual_review") manualReview.push(updated);
    else if (status === "broken") broken.push(updated);
  }

  const relContract = contractLoad.relPath;
  const relValidation = validationLoad.relPath;

  const envelopeBase = {
    schemaVersion: 1 as const,
    certificationRulesVersion: CERTIFICATION_RULES_VERSION,
    generatedAt,
    lastVerifiedAt,
    sourceContractPath: relContract,
    sourceValidationReportPath: relValidation,
  };

  writeJson(path.join(outDir, "exercise.verified.json"), {
    ...envelopeBase,
    certificationKind: "certified" as const,
    recordCount: certified.length,
    records: certified,
  });

  writeJson(path.join(outDir, "exercise.manual-review.json"), {
    ...envelopeBase,
    certificationKind: "manual_review" as const,
    recordCount: manualReview.length,
    records: manualReview,
  });

  writeJson(path.join(outDir, "exercise.broken.json"), {
    ...envelopeBase,
    certificationKind: "broken" as const,
    recordCount: broken.length,
    records: broken,
  });

  const summary: ExerciseCertificationSummary = {
    schemaVersion: 1,
    certificationRulesVersion: CERTIFICATION_RULES_VERSION,
    generatedAt,
    lastVerifiedAt,
    sourceContractPath: relContract,
    sourceValidationReportPath: relValidation,
    totals: {
      total: records.length,
      certified: certified.length,
      manual_review: manualReview.length,
      broken: broken.length,
      pending: pendingCount,
    },
    validationAlignmentWarning:
      canUseValidation && entries.length !== records.length && records.length > 0,
    notes,
  };

  writeJson(path.join(outDir, "exercise.summary.json"), summary);

  console.log(
    `[exercises:certify] certified=${certified.length} manual_review=${manualReview.length} broken=${broken.length} pending=${pendingCount} (total=${records.length}) → ${outDir}`
  );
  if (notes.length > 0) {
    console.warn("[exercises:certify] notes:", notes.join(" | "));
  }
}

main();
