"use client";

import { useEffect, useState } from "react";

export default function TokenInfo() {
  const [userData, setUserData] = useState<any>(null);
  const [remainingTime, setRemainingTime] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTokenInfo() {
      try {
        const res = await fetch("/api/auth-token");
        const data = await res.json();

        if (!res.ok) {
          setUserData(null);
          setRemainingTime(null);
          return;
        }

        setUserData(data);
        updateRemainingTime(data.exp); // ✅ 초기 카운트다운 설정
      } catch (error) {
        console.error("❌ 토큰 정보 확인 중 오류 발생:", error);
      }
    }

    fetchTokenInfo();
  }, []);

  useEffect(() => {
    if (!userData?.exp) return;

    const interval = setInterval(() => {
      updateRemainingTime(userData.exp);
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

  if (!userData) {
    return <div className="text-sm text-red-500">❌ 로그인 정보 없음</div>;
  }

  return (
    <div className="px-3 text-xs text-[#5F5E5B] opacity-60 text-center">
      <p>세션만료: {remainingTime}</p>
      <p>접속IP: {userData.clientIp}</p>
    </div>
  );
}
