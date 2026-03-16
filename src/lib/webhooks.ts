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
];

export function loadWebhooks(): Webhook[] {
  try {
    const data = localStorage.getItem(WEBHOOKS_KEY);
    if (!data) {
      saveWebhooks(DEFAULT_WEBHOOKS);
      return DEFAULT_WEBHOOKS;
    }
    return JSON.parse(data);
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
