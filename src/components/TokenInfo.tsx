"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function TokenInfo() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [remainingTime, setRemainingTime] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessionInfo() {
      const { data, error } = await supabase.auth.getSession();

      console.log("tokeninfo getsession", data);

      if (error || !data.session) {
        setSession(null);
        setRemainingTime(null);
        return;
      }

      setSession(data.session);
      updateRemainingTime(data.session.expires_at as any);
    }

    fetchSessionInfo();
  }, []);

  useEffect(() => {
    if (!session?.expires_at) return;

    const interval = setInterval(() => {
      updateRemainingTime(session.expires_at);
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

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

  // 🔹 로그아웃 함수
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("❌ 로그아웃 실패:", error);
      return;
    }

    console.log("✅ 로그아웃 완료");
    setSession(null); // 세션 초기화
    router.push("/login"); // 로그인 페이지로 이동
  };

  if (!session) {
    return <div className="text-sm text-red-500">❌ 로그인 정보 없음</div>;
  }

  return (
    <div className="px-3 text-xs text-[#5F5E5B] opacity-60 text-center">
      <p>세션 만료까지: {remainingTime}</p>
      <button
        onClick={handleLogout}
        className="mt-2 px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
      >
        로그아웃
      </button>
    </div>
  );
}
