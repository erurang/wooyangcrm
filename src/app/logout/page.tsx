"use client";
import { createSupabaseClient } from "@/utils/supabase/client";
import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    async function logout() {
      const supabase = createSupabaseClient();
      await supabase.auth.signOut(); // ✅ Supabase 세션 삭제
      document.cookie =
        "sb-mjyxnwedqxmyodrainib-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      window.location.href = "/login"; // ✅ 로그아웃 후 로그인 페이지로 이동
    }
    logout();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-500">로그아웃 중...</div>
    </div>
  );
}
