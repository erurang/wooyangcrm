"use client";

import { useSetLoginUser } from "@/context/login";
import { sendKakaoMessage } from "@/lib/sendKakaoMessage";
import { createSupabaseClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TokenInfo() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const setLoginUser = useSetLoginUser();
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
      // 카카오 로그아웃 시도 (선택적)
      const { data } = await supabase.auth.getSession();
      if (data?.session?.provider_token) {
        try {
          await fetch("https://kapi.kakao.com/v1/user/logout", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${data.session.provider_token}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });
        } catch (kakaoError) {
          console.warn("카카오 로그아웃 실패 (무시됨):", kakaoError);
        }
      }

      // Supabase 로그아웃 (항상 수행)
      await supabase.auth.signOut();

      setUserData(null);
      setLoginUser(undefined);
      setRemainingTime(null);
      router.push("/login");
    } catch (error) {
      console.error("로그아웃 처리 중 오류:", error);
      // 에러가 발생해도 로그인 페이지로 이동
      router.push("/login");
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
    <span className="text-xs text-[#5F5E5B] opacity-60 text-center">
      {userData ? (
        <>
          <span>세션만료: </span>
          <span className="w-28 font-mono">{remainingTime}</span>
          <span
            className="cursor-pointer text-red-500 font-semibold pl-2"
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
