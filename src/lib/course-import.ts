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

// ── Required columns ───────────────────────────────────────────────
const REQUIRED_COLUMNS = [
  "chapter_number",
  "chapter_title",
  "lesson_number",
  "lesson_title",
  "video_url",
  "duration",
];

const ALL_COLUMNS = [
  ...REQUIRED_COLUMNS,
  "description",
  "has_assignment",
  "assignment_text",
  "skills",
  "attachments",
  "notes",
];

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

  // Normalize column headers: lowercase, trim, replace spaces with underscores
  const rawHeaders = Object.keys(rawRows[0]);
  const headerMap: Record<string, string> = {};
  for (const h of rawHeaders) {
    const normalized = h.trim().toLowerCase().replace(/\s+/g, "_");
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

    const chapterNum = Number(row.chapter_number);
    const lessonNum = Number(row.lesson_number);
    const chapterTitle = String(row.chapter_title || "").trim();
    const lessonTitle = String(row.lesson_title || "").trim();
    const videoUrl = String(row.video_url || "").trim();
    const duration = String(row.duration || "").trim();

    if (!chapterNum || isNaN(chapterNum)) {
      errors.push({ row: rowNum, column: "chapter_number", message: `מספר פרק לא תקין`, severity: "error" });
    }
    if (!chapterTitle) {
      errors.push({ row: rowNum, column: "chapter_title", message: `כותרת פרק ריקה`, severity: "error" });
    }
    if (!lessonNum || isNaN(lessonNum)) {
      errors.push({ row: rowNum, column: "lesson_number", message: `Invalid lesson number`, severity: "error" });
    }
    if (!lessonTitle) {
      errors.push({ row: rowNum, column: "lesson_title", message: `Empty lesson title`, severity: "error" });
    }
    if (!videoUrl) {
      errors.push({ row: rowNum, column: "video_url", message: `Empty video URL`, severity: "error" });
    }
    if (!duration) {
      errors.push({ row: rowNum, column: "duration", message: `Empty duration`, severity: "warning" });
    }

    // Parse optional fields
    const hasAssignment = String(row.has_assignment || "").toUpperCase() === "TRUE";
    const assignmentText = String(row.assignment_text || "").trim() || undefined;
    const skills = String(row.skills || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const attachments = String(row.attachments || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const description = String(row.description || "").trim() || undefined;
    const notes = String(row.notes || "").trim() || undefined;

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
      chapter_number: 1,
      chapter_title: "Getting Started",
      lesson_number: 1,
      lesson_title: "Welcome & Overview",
      video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: "05:30",
      description: "Introduction to the course and what you will learn",
      has_assignment: "FALSE",
      assignment_text: "",
      skills: "intro, overview",
      attachments: "",
      notes: "",
    },
    {
      chapter_number: 1,
      chapter_title: "Getting Started",
      lesson_number: 2,
      lesson_title: "Setting Up Your Environment",
      video_url: "https://www.youtube.com/embed/abc123",
      duration: "12:45",
      description: "Install all required tools and configure your workspace",
      has_assignment: "TRUE",
      assignment_text: "Install Node.js and create a new project",
      skills: "setup, tools, node.js",
      attachments: "setup-guide.pdf",
      notes: "Make sure to use Node 20+",
    },
    {
      chapter_number: 1,
      chapter_title: "Getting Started",
      lesson_number: 3,
      lesson_title: "Core Concepts",
      video_url: "https://www.youtube.com/embed/xyz789",
      duration: "18:20",
      description: "Understanding the fundamental building blocks",
      has_assignment: "FALSE",
      assignment_text: "",
      skills: "concepts, fundamentals",
      attachments: "",
      notes: "",
    },
    {
      chapter_number: 2,
      chapter_title: "Advanced Techniques",
      lesson_number: 1,
      lesson_title: "Deep Dive into APIs",
      video_url: "https://www.youtube.com/embed/api101",
      duration: "22:10",
      description: "Learn how to work with REST and GraphQL APIs",
      has_assignment: "TRUE",
      assignment_text: "Build a simple API client",
      skills: "api, rest, graphql",
      attachments: "api-cheatsheet.pdf, postman-collection.json",
      notes: "",
    },
    {
      chapter_number: 2,
      chapter_title: "Advanced Techniques",
      lesson_number: 2,
      lesson_title: "Automation Workflows",
      video_url: "https://www.youtube.com/embed/auto202",
      duration: "15:55",
      description: "Create powerful automation pipelines",
      has_assignment: "TRUE",
      assignment_text: "Automate a daily report generation task",
      skills: "automation, workflows, pipelines",
      attachments: "workflow-template.json",
      notes: "Requires API lesson completion first",
    },
    {
      chapter_number: 2,
      chapter_title: "Advanced Techniques",
      lesson_number: 3,
      lesson_title: "Best Practices & Optimization",
      video_url: "https://www.youtube.com/embed/best303",
      duration: "14:00",
      description: "Tips and tricks for production-ready code",
      has_assignment: "FALSE",
      assignment_text: "",
      skills: "best-practices, optimization, performance",
      attachments: "",
      notes: "Final lesson - includes course summary",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(data, { header: ALL_COLUMNS });

  // Set column widths
  ws["!cols"] = ALL_COLUMNS.map((col) => ({
    wch: col === "description" || col === "assignment_text" ? 40 : col === "video_url" ? 45 : 20,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Course Template");

  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}
