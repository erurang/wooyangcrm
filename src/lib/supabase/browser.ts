/**
 * Browser-side Supabase client
 *
 * Use this in client components ("use client") for browser-side operations.
 * This client uses the anon key and doesn't have access to cookies.
 *
 * For server-side operations, use @/lib/supabase/server instead.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Singleton browser Supabase client
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false,
  },
});

/**
 * Factory function to create a new browser client instance
 * Use this when you need a fresh client instance
 */
export function createBrowserSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
    },
  });
}
