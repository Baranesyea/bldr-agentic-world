import { createClient } from "@supabase/supabase-js";

export interface PasswordLinkResult {
  ok: boolean;
  url?: string;
  error?: string;
}

export async function generatePasswordLink(email: string): Promise<PasswordLinkResult> {
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
