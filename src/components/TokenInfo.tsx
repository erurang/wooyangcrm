"use client";

import { useSetLoginUser } from "@/context/login";
import { createSupabaseClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { LogOut } from "lucide-react";

export default function TokenInfo() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const setLoginUser = useSetLoginUser();
  const [userData, setUserData] = useState<any>(null);
  const [remainingTime, setRemainingTime] = useState<string | null>(null);
  const hasRedirected = useRef(false);

  useEffect(() => {
    async function fetchTokenInfo() {
      try {
        const res = await fetch("/api/auth-token");
        const data = await res.json();

        if (!res.ok) {
          setUserData(null);
          setRemainingTime(null);
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            router.push("/login");
          }
          return;
        }

        setUserData(data);
        updateRemainingTime(data.expires_at);
      } catch (error) {
        console.error("토큰 정보 확인 중 오류 발생:", error);
      }
    }

    fetchTokenInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleLogout() {
    try {
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

      await supabase.auth.signOut();

      setUserData(null);
      setLoginUser(undefined);
      setRemainingTime(null);
      router.push("/login");
    } catch (error) {
      console.error("로그아웃 처리 중 오류:", error);
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
      setRemainingTime("세션 만료됨");
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        router.push("/login");
      }
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
    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
      {userData ? (
        <>
          <span className="hidden lg:inline font-mono tabular-nums text-slate-500">{remainingTime}</span>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer transition-colors duration-200 font-medium"
            onClick={handleLogout}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        </>
      ) : (
        <span className="text-xs text-red-500 px-2">로그인 만료됨</span>
      )}
    </div>
  );
}
