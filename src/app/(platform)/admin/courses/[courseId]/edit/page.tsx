"use client";

import { useParams } from "next/navigation";
import CourseEditor from "@/components/admin/course-editor";

export default function EditCoursePage() {
  const params = useParams();
  const courseId = params.courseId as string;
  return <CourseEditor courseId={courseId} />;
}
