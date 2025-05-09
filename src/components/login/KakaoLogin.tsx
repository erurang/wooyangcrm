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

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="relative w-full max-w-md">
        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-100 rounded-full opacity-70 blur-2xl"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-green-100 rounded-full opacity-70 blur-2xl"></div>

        {/* Card */}
        <div className="relative w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-10">
          {/* Logo and header */}
          <div className="flex flex-col items-center mb-2">
            <div className="mb-4">
              <Image
                src="/images/logo.png"
                alt="우양신소재 로고"
                width={400}
                height={80}
                className="object-contain"
              />
            </div>
          </div>

          {/* Login section */}
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-gray-600 text-sm mb-2 text-center">
                안전한 로그인을 위해 카카오 계정을 사용합니다
              </p>
              <button
                onClick={signInWithKakao}
                className="transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] w-full"
              >
                <Image
                  src="/images/kakao_login_large_wide.png"
                  alt="카카오 로그인"
                  width={400}
                  height={100}
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-4 border-t border-gray-100">
            <p className="text-gray-400 text-xs text-center">
              © {currentYear} 우양신소재. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
