import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function findAuthUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<User | null> {
  const normalized = email.toLowerCase().trim();
  // perPage=1000 adds ~1s per call; 100 returns in ~350ms and is plenty
  // for paginating up to 10k users.
  const perPage = 100;
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users) return null;
    const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (match) return match;
    if (data.users.length < perPage) return null;
  }
  return null;
}
