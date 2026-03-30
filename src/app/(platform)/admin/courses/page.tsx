import { getCourses } from "@/lib/data/courses";
import AdminCoursesClient from "./admin-courses-client";

export default async function CourseManagerPage() {
  const courses = await getCourses();

  const serializedCourses = courses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description || "",
    status: c.status as "draft" | "active" | "coming_soon",
    featured: false,
    thumbnailUrl: c.thumbnail || "",
    createdAt: c.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: c.updatedAt?.toISOString() || new Date().toISOString(),
    chapters: c.chapters.map((ch) => ({
      id: ch.id,
      number: ch.displayOrder + 1,
      title: ch.title,
      lessons: ch.lessons.map((l) => ({
        id: l.id,
        number: l.displayOrder + 1,
        title: l.title,
        videoUrl: l.videoUrl || "",
        duration: l.duration ? `${Math.floor(l.duration / 60)}:${String(l.duration % 60).padStart(2, "0")}` : "—",
        description: l.description || "",
        skills: [],
        hasAssignment: l.hasAssignment || false,
        assignmentText: "",
        attachments: (l.attachments as string[]) || [],
        notes: "",
        thumbnailUrl: "",
      })),
    })),
  }));

  return <AdminCoursesClient initialCourses={serializedCourses} />;
}
