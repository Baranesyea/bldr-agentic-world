export interface WebhookVariable {
  key: string;
  description: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  event: string;
  messageTemplate: string;
  variables: WebhookVariable[];
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  webhookName: string;
  webhookId: string;
  event: string;
  status: "success" | "fail";
  statusCode: number | null;
  messageSent: string;
  variables: Record<string, string>;
  response: string;
}

const WEBHOOKS_KEY = "bldr_webhooks";
const LOGS_KEY = "bldr_webhook_logs";

const DEFAULT_WEBHOOKS: Webhook[] = [
  {
    id: "default_forum_question",
    name: "שאלה חדשה בפורום",
    url: "",
    enabled: false,
    event: "forum_question_posted",
    messageTemplate:
      "ל{firstName} יש שאלה על שיעור {lessonTitle} בקורס {courseName} והיא: {question}.\nאפשר לעזור ל{firstName} ולענות שם.\nהנה הקישור: {link}",
    variables: [
      { key: "firstName", description: "שם פרטי של השואל" },
      { key: "lessonTitle", description: "שם השיעור" },
      { key: "courseName", description: "שם הקורס" },
      { key: "question", description: "תוכן השאלה" },
      { key: "link", description: "קישור לעמוד השיעור" },
      { key: "questionTitle", description: "כותרת השאלה" },
    ],
  },
  {
    id: "default_subscription_canceled",
    name: "בקשה לביטול מנוי (התראה לאדמין)",
    url: "",
    enabled: false,
    event: "subscription.cancel_requested",
    messageTemplate:
      "המשתמש {fullName} ביקש לבטל את המנוי.\nמייל: {email}\nטלפון: {phone}\nסכום: {priceAmount}\nהגישה תיפסק ב-{effectiveAt}.\n\nכנס לעמוד 'בקשות לביטול' כדי לאשר את הביטול בפועל.",
    variables: [
      { key: "fullName", description: "שם מלא של המשתמש" },
      { key: "email", description: "מייל" },
      { key: "phone", description: "טלפון" },
      { key: "priceAmount", description: "סכום התשלום החודשי" },
      { key: "billingCycle", description: "סוג חיוב (monthly/one_time)" },
      { key: "effectiveAt", description: "תאריך סיום הגישה" },
      { key: "cancelledAt", description: "תאריך הבקשה לביטול" },
    ],
  },
  {
    id: "default_subscription_cancel_completed",
    name: "ביטול מנוי בוצע (וואצאפ למשתמש)",
    url: "",
    enabled: false,
    event: "subscription.cancel_completed",
    messageTemplate:
      "היי {firstName},\nביטול המנוי שלך בוצע בהצלחה. החיוב הבא לא יתבצע ולא תהיה גישה לתכנים החדשים.\nאם תרצה לחזור בעתיד, המחיר שיחול עליך יהיה המחיר העדכני באותו זמן.\nתודה שהיית איתנו 💙",
    variables: [
      { key: "fullName", description: "שם מלא של המשתמש" },
      { key: "firstName", description: "שם פרטי" },
      { key: "email", description: "מייל" },
      { key: "phone", description: "טלפון של המשתמש (לשליחת וואצאפ)" },
      { key: "completedAt", description: "תאריך אישור הביטול הסופי" },
    ],
  },
];

export function loadWebhooks(): Webhook[] {
  try {
    const data = localStorage.getItem(WEBHOOKS_KEY);
    const existing: Webhook[] = data ? JSON.parse(data) : [];
    const existingIds = new Set(existing.map((w) => w.id));
    const missingDefaults = DEFAULT_WEBHOOKS.filter((w) => !existingIds.has(w.id));
    if (missingDefaults.length > 0) {
      const merged = [...existing, ...missingDefaults];
      saveWebhooks(merged);
      return merged;
    }
    return existing;
  } catch {
    return DEFAULT_WEBHOOKS;
  }
}

export function saveWebhooks(webhooks: Webhook[]): void {
  localStorage.setItem(WEBHOOKS_KEY, JSON.stringify(webhooks));
}

export function loadWebhookLogs(): WebhookLog[] {
  try {
    return JSON.parse(localStorage.getItem(LOGS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveWebhookLog(log: WebhookLog): void {
  const logs = loadWebhookLogs();
  logs.unshift(log);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 200)));
}

export function fillTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

export async function sendWebhook(
  eventType: string,
  variables: Record<string, string>
): Promise<void> {
  const webhooks = loadWebhooks();
  const matching = webhooks.filter((w) => w.enabled && w.event === eventType);

  for (const webhook of matching) {
    const message = fillTemplate(webhook.messageTemplate, variables);
    let status: "success" | "fail" = "fail";
    let statusCode: number | null = null;
    let responseText = "";

    try {
      const res = await fetch(webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });
      statusCode = res.status;
      responseText = await res.text().catch(() => "");
      status = res.ok ? "success" : "fail";
    } catch (err: unknown) {
      responseText = err instanceof Error ? err.message : "Network error";
    }

    saveWebhookLog({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      webhookName: webhook.name,
      webhookId: webhook.id,
      event: eventType,
      status,
      statusCode,
      messageSent: message,
      variables,
      response: responseText,
    });
  }
}
