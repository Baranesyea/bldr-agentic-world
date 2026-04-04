import * as XLSX from "xlsx";

// ── Types ──────────────────────────────────────────────────────────

export interface ParsedRow {
  [key: string]: string;
}

export interface ParsePreview {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
}

export interface FieldMapping {
  [csvColumn: string]: string; // csvColumn → target field or "skip"
}

// Target fields the user can map to
export const TARGET_FIELDS = [
  { value: "email", label: "אימייל", required: true },
  { value: "fullName", label: "שם מלא", required: false },
  { value: "phone", label: "טלפון", required: false },
  { value: "notes", label: "הערות", required: false },
  { value: "type", label: "סוג (free/paid)", required: false },
  { value: "status", label: "סטטוס", required: false },
  { value: "skip", label: "דלג", required: false },
] as const;

// Auto-detect mapping by common Hebrew/English header names
const AUTO_DETECT_MAP: Record<string, string> = {
  // Email
  email: "email",
  "אימייל": "email",
  "דואר אלקטרוני": "email",
  "מייל": "email",
  "כתובת מייל": "email",
  "e-mail": "email",
  // Full name
  "full name": "fullName",
  fullname: "fullName",
  name: "fullName",
  "שם": "fullName",
  "שם מלא": "fullName",
  "שם_מלא": "fullName",
  // Phone
  phone: "phone",
  "טלפון": "phone",
  "נייד": "phone",
  "פלאפון": "phone",
  tel: "phone",
  mobile: "phone",
  // Notes
  notes: "notes",
  "הערות": "notes",
  // Type
  type: "type",
  "סוג": "type",
  // Status
  status: "status",
  "סטטוס": "status",
};

// ── Parse file ────────────────────────────────────────────────────

export function parseUserFile(buffer: ArrayBuffer): ParsePreview {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (jsonData.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const headers = Object.keys(jsonData[0]);
  const rows: ParsedRow[] = jsonData.map((row) => {
    const parsed: ParsedRow = {};
    for (const key of headers) {
      parsed[key] = String(row[key] ?? "").trim();
    }
    return parsed;
  });

  return {
    headers,
    rows: rows.slice(0, 10), // Preview first 10 rows
    totalRows: rows.length,
  };
}

export function autoDetectMapping(headers: string[]): FieldMapping {
  const mapping: FieldMapping = {};
  for (const header of headers) {
    const normalized = header.toLowerCase().trim().replace(/_/g, " ");
    mapping[header] = AUTO_DETECT_MAP[normalized] || "skip";
  }
  return mapping;
}

// ── Validate mapping ──────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMapping(mapping: FieldMapping): ValidationResult {
  const errors: string[] = [];
  const mappedFields = Object.values(mapping).filter((v) => v !== "skip");

  if (!mappedFields.includes("email")) {
    errors.push("חובה למפות עמודת אימייל");
  }

  // Check for duplicates (same target mapped twice)
  const seen = new Set<string>();
  for (const [col, target] of Object.entries(mapping)) {
    if (target === "skip") continue;
    if (seen.has(target)) {
      errors.push(`השדה "${target}" ממופה ליותר מעמודה אחת`);
    }
    seen.add(target);
  }

  return { valid: errors.length === 0, errors };
}

// ── Apply mapping to rows ─────────────────────────────────────────

export interface MappedUser {
  email: string;
  fullName?: string;
  phone?: string;
  notes?: string;
  type?: string;
  status?: string;
}

export function applyMapping(
  buffer: ArrayBuffer,
  mapping: FieldMapping
): { users: MappedUser[]; skippedRows: number } {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const users: MappedUser[] = [];
  let skippedRows = 0;

  // Invert mapping: target → csvColumn
  const targetToColumn = new Map<string, string>();
  for (const [col, target] of Object.entries(mapping)) {
    if (target !== "skip") targetToColumn.set(target, col);
  }

  for (const row of jsonData) {
    const email = String(row[targetToColumn.get("email") ?? ""] ?? "")
      .trim()
      .toLowerCase();

    if (!email || !email.includes("@")) {
      skippedRows++;
      continue;
    }

    const user: MappedUser = { email };

    for (const [target, col] of targetToColumn.entries()) {
      if (target === "email") continue;
      const val = String(row[col] ?? "").trim();
      if (val) {
        (user as unknown as Record<string, string>)[target] = val;
      }
    }

    // Default fullName to email prefix if not mapped
    if (!user.fullName) {
      user.fullName = email.split("@")[0];
    }

    users.push(user);
  }

  return { users, skippedRows };
}
