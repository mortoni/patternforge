/**
 * Lightweight CSV parser for puzzle import.
 * Handles header row and quoted values. Surfaces row numbers for error reporting.
 */

export interface CsvParseResult<T> {
  rows: T[];
  rowCount: number;
}

/**
 * Parse a CSV string into an array of row objects keyed by header.
 * Values are trimmed. Quoted fields have quotes stripped.
 * Row index is 1-based in errors (header = row 0).
 */
export function parseCsv(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = splitLines(csvText);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseRow(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;
    const values = parseRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Split CSV line into fields, respecting quoted commas.
 */
function parseRow(line: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      const end = readQuoted(line, i);
      result.push(end.value);
      i = end.next;
    } else {
      const end = readUnquoted(line, i);
      result.push(end.value.trim());
      i = end.next;
    }
    if (line[i] === ",") i++;
  }
  return result;
}

function readQuoted(line: string, start: number): { value: string; next: number } {
  let s = "";
  let i = start + 1;
  while (i < line.length) {
    if (line[i] === '"') {
      if (line[i + 1] === '"') {
        s += '"';
        i += 2;
      } else {
        i++;
        break;
      }
    } else {
      s += line[i];
      i++;
    }
  }
  return { value: s.trim(), next: i };
}

function readUnquoted(line: string, start: number): { value: string; next: number } {
  let s = "";
  let i = start;
  while (i < line.length && line[i] !== ",") {
    s += line[i];
    i++;
  }
  return { value: s.trim(), next: i };
}

function splitLines(text: string): string[] {
  return text.split(/\r?\n/).filter((l) => l.trim() !== "");
}

/**
 * Get 1-based row number for error reporting (first data row = 2 after header).
 */
export function getDataRowNumber(index: number): number {
  return index + 2;
}
