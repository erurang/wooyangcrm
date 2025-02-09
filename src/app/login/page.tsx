"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // 로그인 상태 확인
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/check-auth", {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          setIsLoggedIn(true);
          router.push("/dashboard"); // 로그인 상태일 경우 대시보드로 리다이렉트
        }
      } catch (error) {
        console.error("인증 확인 실패:", error);
      }
    };

    checkAuth();
  }, []);

  const handleSendCode = async () => {
    try {
      setError(null);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.error("위치 정보 가져오기 실패:", error.message);
            setError(
              "위치 정보 가져오기에 실패했습니다. 위치 액세스를 허용해주세요."
            );
          }
        );
      }

      const response = await fetch("/api/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStep(2);
        setMessage("인증번호가 전송되었습니다. 이메일을 확인하세요.");
      } else {
        const data = await response.json();
        setError(`오류: ${data.error}`);
      }
    } catch (error) {
      console.error("서버 오류:", error);
      setError("서버 오류가 발생했습니다.");
    }
  };

  const handleLogin = async () => {
    try {
      setError(null);

      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          location,
        }),
        credentials: "include",
      });

      if (response.ok) {
        setMessage("로그인 성공!");

        const redirectTo =
          new URLSearchParams(window.location.search).get("redirectTo") || "/";
        router.push(redirectTo);
      } else {
        const data = await response.json();
        setError(`오류: ${data.error}`);
      }
    } catch (error) {
      console.error("서버 오류:", error);
      setError("서버 오류가 발생했습니다.");
    }
  };

  const handleGoBack = () => {
    if (step > 1) {
      setStep(1);
      setMessage("");
      setError(null);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          {step === 1 ? "로그인" : "인증번호 입력"}
        </h1>
        {step === 1 && !isLoggedIn && (
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 입력"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <button
              onClick={handleSendCode}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
            >
              인증번호 받기
            </button>
          </div>
        )}
        {step === 2 && !isLoggedIn && (
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              인증번호
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="인증번호 입력"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition"
            >
              로그인
            </button>
            <button
              onClick={handleGoBack}
              className="w-full mt-2 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition"
            >
              뒤로가기
            </button>
          </div>
        )}
        {message && <p className="text-green-600 text-sm mt-4">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
      </div>
    </div>
  );
}
