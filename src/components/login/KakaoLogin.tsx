"use client";

import Image from "next/image";
import { createSupabaseClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const signInWithKakao = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${SITE_URL}/auth/callback`,
        scopes: "profile_nickname,profile_image,talk_message",
      },
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg text-center">
        <h1 className="text-3xl text-gray-800">우양신소재</h1>
        <p className="text-gray-500 mt-2 mb-6">고객 관리 시스템</p>

        <button onClick={signInWithKakao}>
          <Image
            src="/images/kakao_login_large_wide.png"
            alt="카카오 로그인"
            width={400}
            height={100}
          />
        </button>
        <p className="text-gray-400 text-sm mt-4">
          카카오 로그인을 사용해 접속해주세요.
        </p>
      </div>
    </div>
  );
}
