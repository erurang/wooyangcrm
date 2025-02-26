// import { createBrowserClient } from '@supabase/ssr'
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // ✅ 세션 유지
    autoRefreshToken: true, // ✅ 자동 토큰 갱신
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
