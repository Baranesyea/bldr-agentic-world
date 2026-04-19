import { createClient } from "@supabase/supabase-js";
import { wrapperUrlForEmail } from "@/lib/password-link-token";

export interface PasswordLinkResult {
  ok: boolean;
  url?: string;
  error?: string;
}

/**
 * Raw Supabase recovery link. Single-use token — callers should only expose this
 * at the moment a human actually clicks through the wrapper page, not in an email
 * body, because link-preview bots will burn the token first.
 */
export async function generateSupabaseRecoveryLink(email: string): Promise<PasswordLinkResult> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY missing" };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.bldr.co.il"}/reset-password`;

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: email.toLowerCase().trim(),
    options: { redirectTo },
  });

  if (error) return { ok: false, error: error.message };
  const url = data?.properties?.action_link;
  if (!url) return { ok: false, error: "No action_link returned" };
  return { ok: true, url };
}

/**
 * Preview-safe wrapper URL. The user clicks this and lands on /set-password,
 * which only generates the real Supabase link when the button is pressed.
 */
export async function generatePasswordLink(email: string): Promise<PasswordLinkResult> {
  try {
    const url = wrapperUrlForEmail(email);
    return { ok: true, url };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "token secret missing" };
  }
}
