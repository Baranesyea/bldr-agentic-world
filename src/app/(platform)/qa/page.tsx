import { getForumQuestions } from "@/lib/data/forum";
export const dynamic = "force-dynamic";
import { getCourses } from "@/lib/data/courses";
import QAPageClient from "./qa-client";

export default async function QAPage() {
  const [questions, courses] = await Promise.all([
    getForumQuestions(),
    getCourses(),
  ]);

  // Serialize questions to match the client's expected format
  const serializedQuestions = questions.map((q) => ({
    id: q.id,
    courseId: "",
    lessonId: "",
    lessonTitle: "",
    courseName: "",
    userId: q.userId,
    userName: q.userName || "משתמש",
    userAvatar: q.userAvatar || "",
    title: q.title,
    content: q.description,
    mediaUrls: q.mediaLink ? [q.mediaLink] : [],
    createdAt: q.createdAt?.toISOString() || new Date().toISOString(),
    status: q.status as "pending" | "answered" | "closed",
    answers: q.adminResponse
      ? [
          {
            id: `admin-${q.id}`,
            userId: "admin",
            userName: "מנהל",
            userAvatar: "",
            content: q.adminResponse,
            mediaUrls: q.adminResponseMedia ? [q.adminResponseMedia] : [],
            createdAt: q.answeredAt?.toISOString() || q.createdAt?.toISOString() || new Date().toISOString(),
            isAdmin: true,
            replies: [],
          },
        ]
      : [],
  }));

  const serializedCourses = courses.map((c) => ({
    id: c.id,
    name: c.title,
  }));

  return (
    <QAPageClient
      initialQuestions={serializedQuestions}
      courses={serializedCourses}
    />
  );
}
