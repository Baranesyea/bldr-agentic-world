"use client";

import React, { use } from "react";
import CourseEditor from "@/components/admin/course-editor";

export default function EditCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  return <CourseEditor courseId={courseId} />;
}
