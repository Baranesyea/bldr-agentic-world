export interface ForumAnswer {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  mediaUrls: string[];
  createdAt: string;
  isAdmin: boolean;
  replies: ForumAnswer[];
}

export interface ForumQuestion {
  id: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  courseName: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title: string;
  content: string;
  mediaUrls: string[];
  createdAt: string;
  status: "pending" | "answered" | "closed";
  answers: ForumAnswer[];
}

interface KBEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  source: string;
}

const FORUM_KEY = "bldr_forum_questions";
const KB_KEY = "bldr_knowledge_base";
const NOTIF_KEY = "bldr_notifications";

export function loadQuestions(): ForumQuestion[] {
  try { return JSON.parse(localStorage.getItem(FORUM_KEY) || "[]"); } catch { return []; }
}

export function saveQuestions(questions: ForumQuestion[]): void {
  localStorage.setItem(FORUM_KEY, JSON.stringify(questions));
}

export function addQuestion(q: ForumQuestion): void {
  const all = loadQuestions();
  all.unshift(q);
  saveQuestions(all);

  // Send webhook notification
  import("./webhooks").then(({ sendWebhook }) => {
    sendWebhook("forum_question_posted", {
      firstName: q.userName,
      lessonTitle: q.lessonTitle,
      courseName: q.courseName,
      question: q.content,
      questionTitle: q.title,
      link: `${window.location.origin}/courses/${q.courseId}/lessons/${q.lessonId}`,
    }).catch(() => {});
  });
}

function findAndAddReply(answers: ForumAnswer[], parentId: string, reply: ForumAnswer): boolean {
  for (const a of answers) {
    if (a.id === parentId) {
      if (!a.replies) a.replies = [];
      a.replies.push(reply);
      return true;
    }
    if (a.replies && findAndAddReply(a.replies, parentId, reply)) return true;
  }
  return false;
}

export function addAnswer(questionId: string, answer: ForumAnswer, parentAnswerId?: string): void {
  const all = loadQuestions();
  const q = all.find(x => x.id === questionId);
  if (q) {
    if (parentAnswerId) {
      findAndAddReply(q.answers, parentAnswerId, answer);
    } else {
      q.answers.push(answer);
    }
    q.status = "answered";
    saveQuestions(all);
  }
}

export function updateQuestionStatus(questionId: string, status: ForumQuestion["status"]): void {
  const all = loadQuestions();
  const q = all.find(x => x.id === questionId);
  if (q) { q.status = status; saveQuestions(all); }
}

export function searchKnowledgeBase(query: string): KBEntry | null {
  try {
    const entries: KBEntry[] = JSON.parse(localStorage.getItem(KB_KEY) || "[]");
    if (entries.length === 0) return null;

    // Tokenize and clean
    const stopWords = new Set(["את", "של", "על", "עם", "זה", "מה", "איך", "למה", "כמו", "לא", "כן", "גם", "או", "אם", "the", "a", "is", "to", "in", "and", "or"]);
    const tokenize = (text: string) => text.toLowerCase().split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return null;

    let bestMatch: KBEntry | null = null;
    let bestScore = 0;

    for (const entry of entries) {
      const entryTokens = new Set(tokenize(entry.question + " " + entry.answer));
      const matches = queryTokens.filter(t => entryTokens.has(t)).length;
      const score = matches / queryTokens.length;
      if (score > bestScore) { bestScore = score; bestMatch = entry; }
    }

    return bestScore >= 0.35 ? bestMatch : null;
  } catch { return null; }
}

export function transferToKnowledgeBase(questionId: string, editedQuestion?: string, editedAnswer?: string): void {
  const questions = loadQuestions();
  const q = questions.find(x => x.id === questionId);
  if (!q || q.answers.length === 0) return;

  const entries: KBEntry[] = JSON.parse(localStorage.getItem(KB_KEY) || "[]");
  const newEntry: KBEntry = {
    id: crypto.randomUUID(),
    question: editedQuestion || q.title + "\n" + q.content,
    answer: editedAnswer || q.answers.map(a => a.content).join("\n"),
    category: "קורסים",
    tags: [q.courseName],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: "from_user_question",
  };
  entries.unshift(newEntry);
  localStorage.setItem(KB_KEY, JSON.stringify(entries));
}

export function deleteQuestion(questionId: string): void {
  const all = loadQuestions();
  const filtered = all.filter(q => q.id !== questionId);
  saveQuestions(filtered);
}

function removeAnswerRecursive(answers: ForumAnswer[], answerId: string): ForumAnswer[] {
  return answers
    .filter(a => a.id !== answerId)
    .map(a => ({ ...a, replies: a.replies ? removeAnswerRecursive(a.replies, answerId) : [] }));
}

export function deleteAnswer(questionId: string, answerId: string): void {
  const all = loadQuestions();
  const q = all.find(x => x.id === questionId);
  if (q) {
    q.answers = removeAnswerRecursive(q.answers, answerId);
    saveQuestions(all);
  }
}

export function addForumNotification(title: string, lessonTitle: string): void {
  try {
    const notifs = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]");
    notifs.unshift({
      id: crypto.randomUUID(),
      text: `שאלה חדשה: "${title}" בשיעור ${lessonTitle}`,
      time: "עכשיו",
      read: false,
      type: "qa",
      link: "/admin/qa",
    });
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs.slice(0, 50)));
  } catch {}
}
