/**
 * Generate slugs for courses and lessons.
 * Run: node scripts/generate-slugs.mjs
 */
import postgres from "postgres";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres.exzkttttnsnpwzouwiqq:The%40gentic3orldPa5%24@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";

const sql = postgres(DATABASE_URL);

function toSlug(title) {
  return title
    .trim()
    .replace(/[#@!?.,;:'"()\[\]{}<>\/\\|=+*&^%$~`]/g, "") // remove special chars
    .replace(/\s+/g, "-") // spaces to hyphens
    .replace(/-{2,}/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}

async function main() {
  // 1. Add slug columns if they don't exist
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug VARCHAR(500) UNIQUE`;
  await sql`ALTER TABLE lessons ADD COLUMN IF NOT EXISTS slug VARCHAR(500)`;

  console.log("Columns added/verified.");

  // 2. Fetch all courses
  const courses = await sql`SELECT id, title FROM courses ORDER BY display_order`;
  const usedCourseSlugs = new Set();

  for (const course of courses) {
    let slug = toSlug(course.title);
    // Ensure uniqueness
    let finalSlug = slug;
    let i = 2;
    while (usedCourseSlugs.has(finalSlug)) {
      finalSlug = `${slug}-${i}`;
      i++;
    }
    usedCourseSlugs.add(finalSlug);

    await sql`UPDATE courses SET slug = ${finalSlug} WHERE id = ${course.id}`;
    console.log(`Course: "${course.title}" -> "${finalSlug}"`);
  }

  // 3. Fetch all lessons with their chapter info for ordering
  const lessons = await sql`
    SELECT l.id, l.title, l.display_order, l.chapter_id, c.course_id
    FROM lessons l
    JOIN chapters c ON c.id = l.chapter_id
    ORDER BY c.course_id, c.display_order, l.display_order
  `;

  // Track slugs per course to ensure uniqueness within a course
  const usedLessonSlugs = new Map(); // courseId -> Set
  let lessonIndex = new Map(); // courseId -> counter

  for (const lesson of lessons) {
    if (!usedLessonSlugs.has(lesson.course_id)) {
      usedLessonSlugs.set(lesson.course_id, new Set());
      lessonIndex.set(lesson.course_id, 1);
    }

    const idx = lessonIndex.get(lesson.course_id);
    const prefix = String(idx).padStart(2, "0");
    let slug = `${prefix}-${toSlug(lesson.title)}`;

    const courseSet = usedLessonSlugs.get(lesson.course_id);
    let finalSlug = slug;
    let i = 2;
    while (courseSet.has(finalSlug)) {
      finalSlug = `${slug}-${i}`;
      i++;
    }
    courseSet.add(finalSlug);
    lessonIndex.set(lesson.course_id, idx + 1);

    await sql`UPDATE lessons SET slug = ${finalSlug} WHERE id = ${lesson.id}`;
    console.log(`  Lesson: "${lesson.title}" -> "${finalSlug}"`);
  }

  console.log("\nDone!");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
