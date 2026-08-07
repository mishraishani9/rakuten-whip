import { DIFFICULTIES, REQUIRED_CSV_COLUMNS, CSV_COLUMNS } from "@/game/config";
import type { Question } from "@/game/types";

export type RowError = { row: number; recordId: string; message: string };

export type ParseResult = {
  ok: boolean;
  fileError?: string;
  headers: string[];
  totalRows: number;
  valid: Question[];
  invalid: RowError[];
  duplicatesInFile: string[];
  existingDuplicates: string[];
};

/** Minimal RFC4180 CSV parser (handles quotes, escaped quotes and newlines in fields). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const char = src[i]!;
    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += char;
      continue;
    }
    if (char === '"') inQuotes = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export function validateCsv(text: string, existingRecordIds: Set<string>): ParseResult {
  const rows = parseCsv(text);
  const empty: ParseResult = {
    ok: false,
    headers: [],
    totalRows: 0,
    valid: [],
    invalid: [],
    duplicatesInFile: [],
    existingDuplicates: [],
  };
  if (rows.length < 2) return { ...empty, fileError: "The file is empty or has no data rows." };

  const headers = rows[0]!.map((h) => h.trim());
  const missing = REQUIRED_CSV_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length > 0) {
    return {
      ...empty,
      headers,
      fileError: `Missing required column(s): ${missing.join(", ")}. Nothing was imported.`,
    };
  }

  const index = (name: string) => headers.indexOf(name);
  const get = (row: string[], name: string) => (row[index(name)] ?? "").trim();

  const valid: Question[] = [];
  const invalid: RowError[] = [];
  const seen = new Set<string>();
  const duplicatesInFile: string[] = [];
  const existingDuplicates: string[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]!;
    const recordId = get(row, "Record_ID");
    const rowNumber = r + 1;
    if (!recordId) {
      invalid.push({ row: rowNumber, recordId: "—", message: "Record_ID is empty." });
      continue;
    }
    const difficulty = get(row, "Difficulty");
    if (!DIFFICULTIES.includes(difficulty as never)) {
      invalid.push({ row: rowNumber, recordId, message: `Difficulty "${difficulty}" must be Easy, Medium or Hard.` });
      continue;
    }
    const correctOption = get(row, "Correct_Option").toUpperCase();
    if (!["A", "B", "C", "D"].includes(correctOption)) {
      invalid.push({ row: rowNumber, recordId, message: `Correct_Option "${correctOption}" must be A, B, C or D.` });
      continue;
    }
    const question = get(row, "Question");
    const options = {
      option_a: get(row, "Option_A"),
      option_b: get(row, "Option_B"),
      option_c: get(row, "Option_C"),
      option_d: get(row, "Option_D"),
    };
    if (!question || Object.values(options).some((v) => !v)) {
      invalid.push({ row: rowNumber, recordId, message: "Question text and all four options are required." });
      continue;
    }
    if (seen.has(recordId)) {
      duplicatesInFile.push(recordId);
      continue;
    }
    seen.add(recordId);
    if (existingRecordIds.has(recordId)) existingDuplicates.push(recordId);

    valid.push({
      record_id: recordId,
      record_type: get(row, "Record_Type") || "Generated",
      difficulty: difficulty as Question["difficulty"],
      theme: get(row, "Theme") || "IP fundamentals",
      question,
      ...options,
      correct_option: correctOption as Question["correct_option"],
      correct_answer: get(row, "Correct_Answer") || options[`option_${correctOption.toLowerCase()}` as keyof typeof options],
    });
  }

  return {
    ok: valid.length > 0,
    headers,
    totalRows: rows.length - 1,
    valid,
    invalid,
    duplicatesInFile,
    existingDuplicates,
  };
}

export function csvTemplate(): string {
  const sample = [
    "Generated",
    "E9001",
    "Easy",
    "IP fundamentals",
    "What does IP stand for?",
    "Intellectual Property",
    "International Patent",
    "Innovation Process",
    "Industrial Product",
    "A",
    "Intellectual Property",
  ];
  const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return `${CSV_COLUMNS.join(",")}\n${sample.map(escape).join(",")}\n`;
}

export function downloadCsv(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}