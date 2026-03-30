import { db } from "@/lib/db";
import { supportQuestions, users } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export async function getForumQuestions() {
  const questions = await db
    .select({
      id: supportQuestions.id,
      userId: supportQuestions.userId,
      title: supportQuestions.title,
      description: supportQuestions.description,
      mediaLink: supportQuestions.mediaLink,
      status: supportQuestions.status,
      adminResponse: supportQuestions.adminResponse,
      adminResponseMedia: supportQuestions.adminResponseMedia,
      tags: supportQuestions.tags,
      isPublished: supportQuestions.isPublished,
      createdAt: supportQuestions.createdAt,
      answeredAt: supportQuestions.answeredAt,
      userName: users.fullName,
      userAvatar: users.avatarUrl,
    })
    .from(supportQuestions)
    .leftJoin(users, eq(supportQuestions.userId, users.id))
    .orderBy(desc(supportQuestions.createdAt));

  return questions;
}

export async function getForumQuestionById(id: string) {
  const [question] = await db
    .select({
      id: supportQuestions.id,
      userId: supportQuestions.userId,
      title: supportQuestions.title,
      description: supportQuestions.description,
      mediaLink: supportQuestions.mediaLink,
      status: supportQuestions.status,
      adminResponse: supportQuestions.adminResponse,
      adminResponseMedia: supportQuestions.adminResponseMedia,
      tags: supportQuestions.tags,
      isPublished: supportQuestions.isPublished,
      createdAt: supportQuestions.createdAt,
      answeredAt: supportQuestions.answeredAt,
      userName: users.fullName,
      userAvatar: users.avatarUrl,
    })
    .from(supportQuestions)
    .leftJoin(users, eq(supportQuestions.userId, users.id))
    .where(eq(supportQuestions.id, id));

  return question || null;
}
