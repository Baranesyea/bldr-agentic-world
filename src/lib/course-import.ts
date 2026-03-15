import * as XLSX from "xlsx";

// ── Types ──────────────────────────────────────────────────────────
export interface ImportedLesson {
  number: number;
  title: string;
  videoUrl: string;
  duration: string;
  description?: string;
  hasAssignment: boolean;
  assignmentText?: string;
  skills: string[];
  attachments: string[];
  notes?: string;
}

export interface ImportedChapter {
  number: number;
  title: string;
  lessons: ImportedLesson[];
}

export interface ImportedCourse {
  title: string;
  description?: string;
  status?: string;
  chapters: ImportedChapter[];
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: "error" | "warning";
}

export interface ParseResult {
  course: ImportedCourse | null;
  errors: ValidationError[];
  stats: {
    totalChapters: number;
    totalLessons: number;
    withAssignments: number;
    withAttachments: number;
  };
}

// ── Column definitions ────────────────────────────────────────────
const REQUIRED_COLUMNS = [
  "מספר_נושא",
  "שם_הנושא",
  "מספר_שיעור",
  "שם_השיעור",
  "כתובת_וידאו",
];

const ALL_COLUMNS = [
  ...REQUIRED_COLUMNS,
  "תיאור",
  "מטלה",
  "טקסט_מטלה",
  "כישורים",
  "קבצים",
  "הערות",
];

// Alias map: English -> Hebrew
const COLUMN_ALIASES: Record<string, string> = {
  chapter_number: "מספר_נושא",
  chapter_title: "שם_הנושא",
  lesson_number: "מספר_שיעור",
  lesson_title: "שם_השיעור",
  video_url: "כתובת_וידאו",
  duration: "משך",
  description: "תיאור",
  has_assignment: "מטלה",
  assignment_text: "טקסט_מטלה",
  skills: "כישורים",
  attachments: "קבצים",
  notes: "הערות",
};

// ── Parse file ─────────────────────────────────────────────────────
export function parseFile(file: ArrayBuffer, fileName: string): ParseResult {
  const errors: ValidationError[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(file, { type: "array" });
  } catch {
    return {
      course: null,
      errors: [{ row: 0, column: "", message: "לא ניתן לקרוא את הקובץ. ודא שזהו קובץ xlsx או csv תקין.", severity: "error" }],
      stats: { totalChapters: 0, totalLessons: 0, withAssignments: 0, withAttachments: 0 },
    };
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (rawRows.length === 0) {
    return {
      course: null,
      errors: [{ row: 0, column: "", message: "הקובץ ריק או לא מכיל שורות נתונים.", severity: "error" }],
      stats: { totalChapters: 0, totalLessons: 0, withAssignments: 0, withAttachments: 0 },
    };
  }

  // Normalize column headers: trim, replace spaces with underscores
  // Then map English aliases to Hebrew canonical names
  const rawHeaders = Object.keys(rawRows[0]);
  const headerMap: Record<string, string> = {};
  for (const h of rawHeaders) {
    let normalized = h.trim().replace(/\s+/g, "_");
    // Check if it's an English alias and map to Hebrew
    const lowered = normalized.toLowerCase();
    if (COLUMN_ALIASES[lowered]) {
      normalized = COLUMN_ALIASES[lowered];
    }
    // Keep Hebrew headers as-is (don't lowercase them)
    headerMap[h] = normalized;
  }

  // Remap rows to use normalized headers
  const rows = rawRows.map((row) => {
    const newRow: Record<string, unknown> = {};
    for (const [original, normalized] of Object.entries(headerMap)) {
      newRow[normalized] = row[original];
    }
    return newRow;
  });

  // Validate columns
  const normalizedHeaders = Object.values(headerMap);
  for (const col of REQUIRED_COLUMNS) {
    if (!normalizedHeaders.includes(col)) {
      errors.push({ row: 0, column: col, message: `חסרה עמודה נדרשת: "${col}"`, severity: "error" });
    }
  }

  if (errors.some((e) => e.severity === "error")) {
    return {
      course: null,
      errors,
      stats: { totalChapters: 0, totalLessons: 0, withAssignments: 0, withAttachments: 0 },
    };
  }

  // Validate rows and build structure
  const chaptersMap = new Map<number, ImportedChapter>();
  let withAssignments = 0;
  let withAttachments = 0;

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // 1-indexed + header

    const chapterNum = Number(row["מספר_נושא"]);
    const lessonNum = Number(row["מספר_שיעור"]);
    const chapterTitle = String(row["שם_הנושא"] || "").trim();
    const lessonTitle = String(row["שם_השיעור"] || "").trim();
    const videoUrl = String(row["כתובת_וידאו"] || "").trim();
    const duration = String(row["משך"] || "").trim() || "—";

    if (!chapterNum || isNaN(chapterNum)) {
      errors.push({ row: rowNum, column: "מספר_נושא", message: "מספר נושא לא תקין", severity: "error" });
    }
    if (!chapterTitle) {
      errors.push({ row: rowNum, column: "שם_הנושא", message: "שם נושא ריק", severity: "error" });
    }
    if (!lessonNum || isNaN(lessonNum)) {
      errors.push({ row: rowNum, column: "מספר_שיעור", message: "מספר שיעור לא תקין", severity: "error" });
    }
    if (!lessonTitle) {
      errors.push({ row: rowNum, column: "שם_השיעור", message: "שם שיעור ריק", severity: "error" });
    }
    if (!videoUrl) {
      errors.push({ row: rowNum, column: "כתובת_וידאו", message: "כתובת וידאו ריקה", severity: "error" });
    }

    // Parse optional fields
    const hasAssignment = String(row["מטלה"] || "").toUpperCase() === "TRUE";
    const assignmentText = String(row["טקסט_מטלה"] || "").trim() || undefined;
    const skills = String(row["כישורים"] || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const attachments = String(row["קבצים"] || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const description = String(row["תיאור"] || "").trim() || undefined;
    const notes = String(row["הערות"] || "").trim() || undefined;

    if (hasAssignment) withAssignments++;
    if (attachments.length > 0) withAttachments++;

    if (errors.some((e) => e.severity === "error" && e.row === rowNum)) return;

    if (!chaptersMap.has(chapterNum)) {
      chaptersMap.set(chapterNum, { number: chapterNum, title: chapterTitle, lessons: [] });
    }

    chaptersMap.get(chapterNum)!.lessons.push({
      number: lessonNum,
      title: lessonTitle,
      videoUrl,
      duration,
      description,
      hasAssignment,
      assignmentText,
      skills,
      attachments,
      notes,
    });
  });

  // Sort chapters and lessons
  const chapters = Array.from(chaptersMap.values())
    .sort((a, b) => a.number - b.number)
    .map((ch) => ({ ...ch, lessons: ch.lessons.sort((a, b) => a.number - b.number) }));

  const hasErrors = errors.some((e) => e.severity === "error");

  return {
    course: hasErrors ? null : { title: "", chapters },
    errors,
    stats: {
      totalChapters: chapters.length,
      totalLessons: rows.length,
      withAssignments,
      withAttachments,
    },
  };
}

// ── Generate template Excel ────────────────────────────────────────
export function generateTemplate(): ArrayBuffer {
  const data = [
    {
      מספר_נושא: 1,
      שם_הנושא: "יסודות",
      מספר_שיעור: 1,
      שם_השיעור: "מבוא לקורס",
      כתובת_וידאו: "https://www.youtube.com/watch?v=example1",
      תיאור: "",
      מטלה: "FALSE",
      טקסט_מטלה: "",
      כישורים: "מבוא, יסודות",
      קבצים: "",
      הערות: "",
    },
    {
      מספר_נושא: 1,
      שם_הנושא: "יסודות",
      מספר_שיעור: 2,
      שם_השיעור: "התקנה והגדרות",
      כתובת_וידאו: "https://www.youtube.com/watch?v=example2",
      תיאור: "",
      מטלה: "TRUE",
      טקסט_מטלה: "התקן את הכלים הנדרשים",
      כישורים: "",
      קבצים: "",
      הערות: "",
    },
    {
      מספר_נושא: 1,
      שם_הנושא: "יסודות",
      מספר_שיעור: 3,
      שם_השיעור: "מושגים בסיסיים",
      כתובת_וידאו: "https://www.youtube.com/watch?v=example3",
      תיאור: "",
      מטלה: "FALSE",
      טקסט_מטלה: "",
      כישורים: "",
      קבצים: "",
      הערות: "",
    },
    {
      מספר_נושא: 2,
      שם_הנושא: "טכניקות מתקדמות",
      מספר_שיעור: 1,
      שם_השיעור: "עבודה עם APIs",
      כתובת_וידאו: "https://www.youtube.com/watch?v=example4",
      תיאור: "",
      מטלה: "TRUE",
      טקסט_מטלה: "",
      כישורים: "",
      קבצים: "",
      הערות: "",
    },
    {
      מספר_נושא: 2,
      שם_הנושא: "טכניקות מתקדמות",
      מספר_שיעור: 2,
      שם_השיעור: "אוטומציות",
      כתובת_וידאו: "https://www.youtube.com/watch?v=example5",
      תיאור: "",
      מטלה: "FALSE",
      טקסט_מטלה: "",
      כישורים: "אוטומציה, תהליכים",
      קבצים: "",
      הערות: "",
    },
    {
      מספר_נושא: 2,
      שם_הנושא: "טכניקות מתקדמות",
      מספר_שיעור: 3,
      שם_השיעור: "טיפים מתקדמים",
      כתובת_וידאו: "https://www.youtube.com/watch?v=example6",
      תיאור: "",
      מטלה: "FALSE",
      טקסט_מטלה: "",
      כישורים: "",
      קבצים: "",
      הערות: "",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(data, { header: ALL_COLUMNS });

  // Set column widths
  ws["!cols"] = ALL_COLUMNS.map((col) => ({
    wch: col === "תיאור" || col === "טקסט_מטלה" ? 40 : col === "כתובת_וידאו" ? 45 : 20,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "תבנית קורס");

  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}
