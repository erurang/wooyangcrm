/**
 * Server-side Supabase client
 *
 * Use this in Server Components and API routes.
 * This client has access to cookies for session management.
 *
 * For browser-side operations, use @/lib/supabase/browser instead.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a server-side Supabase client with cookie support
 *
 * @example
 * // In an API route or Server Component
 * const supabase = await createSupabaseServer();
 * const { data } = await supabase.from('users').select();
 */
export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
