import { getCourses } from "@/lib/data/courses";
import DashboardClient from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const courses = await getCourses();

  // Transform DB courses to the shape the client component expects
  const transformedCourses = courses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description || "",
    status: c.status,
    featured: false, // DB doesn't have featured field currently
    thumbnailUrl: c.thumbnail || "",
    chapters: c.chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      lessons: ch.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        videoUrl: l.videoUrl || "",
        duration: l.duration ? `${Math.floor(l.duration / 60)}:${String(l.duration % 60).padStart(2, "0")}` : "—",
      })),
    })),
  }));

  return <DashboardClient courses={transformedCourses} />;
}
