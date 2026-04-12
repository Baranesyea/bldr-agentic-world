export const revalidate = 30;

import { Suspense } from "react";
import { getCourseById, formatDuration } from "@/lib/data/courses";
import { notFound } from "next/navigation";
import LessonViewClient from "./lesson-view-client";

export default async function LessonViewPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const course = await getCourseById(courseId);

  if (!course) {
    notFound();
  }

  // Serialize course for client component
  const serializedCourse = {
    id: course.id,
    slug: course.slug || course.id,
    title: course.title,
    description: course.description || "",
    chapters: (course.chapters || []).map((ch) => ({
      id: ch.id,
      number: ch.displayOrder + 1,
      title: ch.title,
      lessons: (ch.lessons || []).map((l) => ({
        id: l.id,
        slug: l.slug || l.id,
        number: l.displayOrder + 1,
        title: l.title,
        videoUrl: l.videoUrl || "",
        duration: l.duration ? formatDuration(l.duration) : "",
        description: l.description || "",
        skills: [],
        hasAssignment: l.hasAssignment || false,
        assignmentText: "",
        attachments: (l.attachments as string[]) || [],
        notes: "",
        thumbnailUrl: "",
      })),
    })),
  };

  // Verify the lesson exists (support both UUID and slug)
  const allLessons = serializedCourse.chapters.flatMap((ch) => ch.lessons);
  const matchedLesson = allLessons.find((l) => l.id === lessonId || l.slug === lessonId);

  if (!matchedLesson) {
    notFound();
  }

  return (
    <Suspense fallback={<div style={{ padding: 32, textAlign: "center", color: "rgba(240,240,245,0.5)" }}>טוען שיעור...</div>}>
      <LessonViewClient course={serializedCourse} lessonId={matchedLesson.id} />
    </Suspense>
  );
}
