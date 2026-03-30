import { db } from "@/lib/db";
import { courses, chapters, lessons } from "@/lib/schema";
import { eq, asc, inArray, or } from "drizzle-orm";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

export async function getCourses() {
  const allCourses = await db
    .select()
    .from(courses)
    .orderBy(asc(courses.displayOrder));

  const allChapters = await db
    .select()
    .from(chapters)
    .orderBy(asc(chapters.displayOrder));

  const allLessons = await db
    .select()
    .from(lessons)
    .orderBy(asc(lessons.displayOrder));

  // Nest lessons into chapters, chapters into courses
  const chapterMap = new Map<string, typeof allChapters>();
  for (const ch of allChapters) {
    if (!chapterMap.has(ch.courseId)) chapterMap.set(ch.courseId, []);
    chapterMap.get(ch.courseId)!.push(ch);
  }

  const lessonMap = new Map<string, typeof allLessons>();
  for (const l of allLessons) {
    if (!lessonMap.has(l.chapterId)) lessonMap.set(l.chapterId, []);
    lessonMap.get(l.chapterId)!.push(l);
  }

  return allCourses.map((c) => ({
    ...c,
    chapters: (chapterMap.get(c.id) || []).map((ch) => ({
      ...ch,
      lessons: lessonMap.get(ch.id) || [],
    })),
  }));
}

export async function getCourseById(id: string) {
  const condition = isUUID(id)
    ? or(eq(courses.id, id), eq(courses.slug, id))
    : eq(courses.slug, id);

  const [course] = await db
    .select()
    .from(courses)
    .where(condition!);

  if (!course) return null;

  const courseChapters = await db
    .select()
    .from(chapters)
    .where(eq(chapters.courseId, id))
    .orderBy(asc(chapters.displayOrder));

  const chapterIds = courseChapters.map((ch) => ch.id);

  let courseLessons: (typeof lessons.$inferSelect)[] = [];
  if (chapterIds.length > 0) {
    courseLessons = await db
      .select()
      .from(lessons)
      .orderBy(asc(lessons.displayOrder));
    // Filter to only lessons in this course's chapters
    const chapterIdSet = new Set(chapterIds);
    courseLessons = courseLessons.filter((l) => chapterIdSet.has(l.chapterId));
  }

  const lessonMap = new Map<string, typeof courseLessons>();
  for (const l of courseLessons) {
    if (!lessonMap.has(l.chapterId)) lessonMap.set(l.chapterId, []);
    lessonMap.get(l.chapterId)!.push(l);
  }

  return {
    ...course,
    chapters: courseChapters.map((ch) => ({
      ...ch,
      lessons: lessonMap.get(ch.id) || [],
    })),
  };
}

export function generateSlug(title: string): string {
  return title
    .trim()
    .replace(/[#@!?.,;:'"()\[\]{}<>\/\\|=+*&^%$~`]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createCourse(data: {
  title: string;
  description?: string;
  status?: "draft" | "active" | "archive";
  thumbnail?: string;
  displayOrder?: number;
  chapters?: {
    title: string;
    lessons: {
      title: string;
      description?: string;
      videoUrl?: string;
      duration?: number;
      hasAssignment?: boolean;
      attachments?: unknown[];
    }[];
  }[];
}) {
  const [course] = await db
    .insert(courses)
    .values({
      title: data.title,
      description: data.description || "",
      status: data.status || "draft",
      thumbnail: data.thumbnail || "",
      displayOrder: data.displayOrder || 0,
    })
    .returning();

  if (data.chapters) {
    for (let ci = 0; ci < data.chapters.length; ci++) {
      const chData = data.chapters[ci];
      const [chapter] = await db
        .insert(chapters)
        .values({
          courseId: course.id,
          title: chData.title || `פרק ${ci + 1}`,
          displayOrder: ci,
        })
        .returning();

      if (chData.lessons) {
        for (let li = 0; li < chData.lessons.length; li++) {
          const lData = chData.lessons[li];
          await db.insert(lessons).values({
            chapterId: chapter.id,
            title: lData.title || `שיעור ${li + 1}`,
            description: lData.description || "",
            videoUrl: lData.videoUrl || "",
            duration: lData.duration || 0,
            displayOrder: li,
            hasAssignment: lData.hasAssignment || false,
            attachments: lData.attachments || [],
          });
        }
      }
    }
  }

  return getCourseById(course.id);
}

export async function updateCourse(
  id: string,
  data: {
    title?: string;
    description?: string;
    status?: "draft" | "active" | "archive";
    thumbnail?: string;
    displayOrder?: number;
    chapters?: {
      id?: string;
      title: string;
      lessons: {
        id?: string;
        title: string;
        description?: string;
        videoUrl?: string;
        duration?: number;
        hasAssignment?: boolean;
        attachments?: unknown[];
      }[];
    }[];
  }
) {
  // Update the course row
  await db
    .update(courses)
    .set({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
      ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
      updatedAt: new Date(),
    })
    .where(eq(courses.id, id));

  // If chapters provided, replace them all
  if (data.chapters) {
    // Delete existing chapters (cascades to lessons)
    await db.delete(chapters).where(eq(chapters.courseId, id));

    for (let ci = 0; ci < data.chapters.length; ci++) {
      const chData = data.chapters[ci];
      const [chapter] = await db
        .insert(chapters)
        .values({
          courseId: id,
          title: chData.title || `פרק ${ci + 1}`,
          displayOrder: ci,
        })
        .returning();

      if (chData.lessons) {
        for (let li = 0; li < chData.lessons.length; li++) {
          const lData = chData.lessons[li];
          await db.insert(lessons).values({
            chapterId: chapter.id,
            title: lData.title || `שיעור ${li + 1}`,
            description: lData.description || "",
            videoUrl: lData.videoUrl || "",
            duration: lData.duration || 0,
            displayOrder: li,
            hasAssignment: lData.hasAssignment || false,
            attachments: lData.attachments || [],
          });
        }
      }
    }
  }

  return getCourseById(id);
}

export async function deleteCourse(id: string) {
  await db.delete(courses).where(eq(courses.id, id));
}

export async function duplicateCourse(id: string) {
  const original = await getCourseById(id);
  if (!original) return null;

  return createCourse({
    title: original.title + " (עותק)",
    description: original.description || "",
    status: "draft",
    thumbnail: original.thumbnail || "",
    chapters: original.chapters.map((ch) => ({
      title: ch.title,
      lessons: ch.lessons.map((l) => ({
        title: l.title,
        description: l.description || "",
        videoUrl: l.videoUrl || "",
        duration: l.duration || 0,
        hasAssignment: l.hasAssignment || false,
        attachments: (l.attachments as unknown[]) || [],
      })),
    })),
  });
}

export async function updateCourseOrder(courseIds: string[]) {
  for (let i = 0; i < courseIds.length; i++) {
    await db
      .update(courses)
      .set({ displayOrder: i })
      .where(eq(courses.id, courseIds[i]));
  }
}
