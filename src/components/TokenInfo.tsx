"use client";

import { sendKakaoMessage } from "@/lib/sendKakaoMessage";
import { createSupabaseClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TokenInfo() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [userData, setUserData] = useState<any>(null);
  const [remainingTime, setRemainingTime] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTokenInfo() {
      try {
        const res = await fetch("/api/auth-token");
        const data = await res.json();

        // await sendKakaoMessage(data.provider_token);

        // console.log("dataasdfsafasdfsdaf", data);

        if (!res.ok) {
          setUserData(null);
          setRemainingTime(null);
          return;
        }

        setUserData(data);
        updateRemainingTime(data.expires_at);
      } catch (error) {
        console.error("❌ 토큰 정보 확인 중 오류 발생:", error);
      }
    }

    fetchTokenInfo();
  }, []);

  async function handleLogout() {
    try {
      // Supabase 로그아웃

      // ✅ 사용자 `access_token` 가져오기
      const { data, error } = await supabase.auth.getSession();
      console.log("logount getsession data", data);
      if (error || !data?.session?.provider_token) {
        console.error("카카오 로그아웃 실패: 액세스 토큰 없음", error);
        return;
      }

      const ACCESS_TOKEN = data.session.provider_token; // ✅ 카카오 OAuth 액세스 토큰

      // ✅ 카카오 로그아웃 API 호출 (access_token 이용)
      const res = await fetch("https://kapi.kakao.com/v1/user/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      await supabase.auth.signOut();

      if (!res.ok) {
        console.error("카카오 로그아웃 실패:", await res.json());
        return;
      }

      console.log("✅ 카카오 로그아웃 성공!");
      setUserData(null);
      setRemainingTime(null);
      router.push("/login");
      // ✅ 로그아웃 후 리디렉트
      // window.location.href = `https://kauth.kakao.com/oauth/logout?client_id=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID}&logout_redirect_uri=http://localhost:3000/login
      // `;
    } catch (error) {
      console.error("로그아웃 처리 중 오류:", error);
    }
  }

  useEffect(() => {
    if (!userData?.expires_at) return;

    const interval = setInterval(() => {
      updateRemainingTime(userData.expires_at);
    }, 1000);

    return () => clearInterval(interval);
  }, [userData]);

  function updateRemainingTime(exp: number) {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = exp - now;

    if (timeLeft <= 0) {
      setRemainingTime("⏳ 세션 만료됨");
    } else {
      const hours = Math.floor(timeLeft / 3600)
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((timeLeft % 3600) / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (timeLeft % 60).toString().padStart(2, "0");

      setRemainingTime(`${hours}:${minutes}:${seconds}`);
    }
  }

  return (
    <span className="px-3 text-xs text-[#5F5E5B] opacity-60 text-center">
      {userData ? (
        <>
          <span>세션만료: </span>
          <span className="w-28 font-mono">{remainingTime}</span>
          <span
            className="cursor-pointer text-red-500 font-semibold"
            onClick={handleLogout}
          >
            {" "}
            로그아웃
          </span>
        </>
      ) : (
        <span className="text-sm text-red-500 px-3">로그인 만료됨</span>
      )}
    </span>
  );
}
