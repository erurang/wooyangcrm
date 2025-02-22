"use client";

import { useEffect, useState } from "react";

export default function TokenExpirationTimer() {
  const [remainingTime, setRemainingTime] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTokenExpiration() {
      try {
        const res = await fetch("/api/refresh-token", {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          setRemainingTime("토큰 없음");
          return;
        }

        if (!data.exp) {
          setRemainingTime("만료 시간 없음");
          return;
        }

        const updateRemainingTime = () => {
          const now = Math.floor(Date.now() / 1000);
          const timeLeft = data.exp - now;

          if (timeLeft <= 0) {
            setRemainingTime("토큰 만료됨");
          } else {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            setRemainingTime(`${minutes}분 ${seconds}초`);
          }
        };

        updateRemainingTime();
        const interval = setInterval(updateRemainingTime, 1000);

        return () => clearInterval(interval);
      } catch (error) {
        console.error("❌ 토큰 확인 중 오류 발생:", error);
        setRemainingTime("오류 발생");
      }
    }

    fetchTokenExpiration();
  }, []);

  return (
    <div className="text-sm opacity-70 text-[#333] px-6">
      세션만료: {remainingTime}
    </div>
  );
}
