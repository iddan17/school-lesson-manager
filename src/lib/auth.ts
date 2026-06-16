import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// React.cache dedupes these within a single server render, so the page
// and the Navbar share one auth check / profile query instead of repeating them.

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  // Read the session from cookies locally — no network round-trip. The middleware
  // (proxy.ts) already verified & refreshed the token on this request, and every
  // data query is still protected by RLS, so this is safe and ~165ms faster.
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data;
});
