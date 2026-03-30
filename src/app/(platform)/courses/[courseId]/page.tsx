import { getCourseById } from "@/lib/data/courses";
import { notFound } from "next/navigation";
import CourseViewClient from "./course-view-client";

export default async function CourseViewPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);

  if (!course) {
    notFound();
  }

  // Serialize for client component
  const serializedCourse = {
    id: course.id,
    slug: course.slug || course.id,
    title: course.title,
    description: course.description || "",
    status: course.status,
    thumbnailUrl: course.thumbnail || "",
    chapters: course.chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      number: ch.displayOrder + 1,
      isLocked: false,
      lessons: ch.lessons.map((l) => ({
        id: l.id,
        slug: l.slug || l.id,
        title: l.title,
        videoUrl: l.videoUrl || "",
        duration: l.duration ? `${Math.floor(l.duration / 60)}:${String(l.duration % 60).padStart(2, "0")}` : "",
        number: l.displayOrder + 1,
        completed: false,
        hasAssignment: l.hasAssignment || false,
      })),
    })),
  };

  return <CourseViewClient course={serializedCourse} />;
}
