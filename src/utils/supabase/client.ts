/**
 * @deprecated Use @/lib/supabase instead
 *
 * This file is kept for backwards compatibility.
 * New code should import from @/lib/supabase:
 *
 * import { supabase } from "@/lib/supabase";
 */
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
