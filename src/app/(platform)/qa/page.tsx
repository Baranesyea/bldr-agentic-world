export const revalidate = 10;
import { getCourses } from "@/lib/data/courses";
import QAPageClient from "./qa-client";

export default async function QAPage() {
  const courses = await getCourses();

  const serializedCourses = courses.map((c) => ({
    id: c.id,
    name: c.title,
  }));

  return <QAPageClient courses={serializedCourses} />;
}
