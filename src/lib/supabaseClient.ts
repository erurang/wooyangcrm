import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase =
  createClientComponentClient();
  //   supabaseUrl, supabaseAnonKey,
  //   {
  //   auth: {
  //     persistSession: true, // 쿠키 세션 유지
  //     autoRefreshToken: true, // 토큰 자동 갱신
  //   },
  // }
