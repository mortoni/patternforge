/**
 * Normalize exercise CSV rows into {@link ExerciseRecord} JSON + a normalization report.
 *
 * Usage:
 *   pnpm run exercises:normalize
 *   pnpm exec tsx scripts/exercises/normalize-exercises.ts -i path/to.csv -o contract.json -r report.json
 */

import * as fs from "fs";
import * as path from "path";
import { getDataRowNumber, parseCsv } from "../../src/lib/csv";
import type { ExerciseRecord } from "../../src/domain/training/types/exercise-record";
import {
  buildNormalizationReport,
  deriveExerciseId,
  mapRawCsvRowToExerciseRecord,
  trimCsvRow,
  type NormalizationReport,
} from "./exercise-record-normalize";

export const DEFAULT_INPUT_CSV = path.join(
  process.cwd(),
  "data",
  "imports",
  "puzzle.csv"
);

export const DEFAULT_OUTPUT_JSON = path.join(
  process.cwd(),
  "data",
  "exercises",
  "generated",
  "exercise.contract.json"
);

export const DEFAULT_REPORT_JSON = path.join(
  process.cwd(),
  "data",
  "exercises",
  "generated",
  "exercise.normalization-report.json"
);

/** Top-level artifact: metadata + strict contract records (mapped rows only). */
export interface ExerciseContractFileV3 {
  schemaVersion: 3;
  generatedAt: string;
  sourceCsvPath: string;
  recordCount: number;
  records: ExerciseRecord[];
}

export function writeJsonFile(outputPath: string, data: unknown): void {
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

function parseArgs(argv: string[]): {
  input: string;
  output: string;
  report: string;
} {
  let input = DEFAULT_INPUT_CSV;
  let output = DEFAULT_OUTPUT_JSON;
  let report = DEFAULT_REPORT_JSON;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if ((a === "--input" || a === "-i") && argv[i + 1]) {
      input = path.resolve(process.cwd(), argv[++i]);
    } else if ((a === "--output" || a === "-o") && argv[i + 1]) {
      output = path.resolve(process.cwd(), argv[++i]);
    } else if ((a === "--report" || a === "-r") && argv[i + 1]) {
      report = path.resolve(process.cwd(), argv[++i]);
    }
  }
  return { input, output, report };
}

function main(): void {
  const { input, output, report } = parseArgs(process.argv);

  if (!fs.existsSync(input)) {
    console.error("Input CSV not found:", input);
    process.exit(1);
  }

  const csvText = fs.readFileSync(input, "utf-8");
  const { rows } = parseCsv(csvText);
  const totalRows = rows.length;

  const records: ExerciseRecord[] = [];
  const reportEntries: NormalizationReport["entries"] = [];
  let mappedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const csvRowNumber = getDataRowNumber(i);
    const trimmed = trimCsvRow(rows[i]);
    const { record: body, entry } = mapRawCsvRowToExerciseRecord(trimmed, {
      csvRowNumber,
      dataRowIndex1Based: i + 1,
    });

    if (body) {
      mappedCount += 1;
      const id = deriveExerciseId(mappedCount);
      const full: ExerciseRecord = { id, ...body };
      records.push(full);
      entry.exerciseId = id;
    }

    reportEntries.push(entry);
  }

  const relSource = path.relative(process.cwd(), input) || input;
  const generatedAt = new Date().toISOString();

  const envelope: ExerciseContractFileV3 = {
    schemaVersion: 3,
    generatedAt,
    sourceCsvPath: relSource,
    recordCount: records.length,
    records,
  };

  const normalizationReport: NormalizationReport = buildNormalizationReport(
    relSource,
    totalRows,
    reportEntries,
    generatedAt
  );

  writeJsonFile(output, envelope);
  writeJsonFile(report, normalizationReport);

  const issueRows = normalizationReport.rowsWithIssues;
  console.log(
    `Mapped ${records.length} / ${totalRows} rows → ${output}\nReport (${issueRows} rows with issues) → ${report}\n` +
      `Move normalization (mapped rows): fully=${normalizationReport.fullyNormalizedRows} partial=${normalizationReport.partiallyNormalizedRows} failed=${normalizationReport.failedNormalizationRows}`
  );
  if (records.length < totalRows) {
    console.warn(
      `Skipped ${totalRows - records.length} row(s); see report for errors.`
    );
  }
}

main();
