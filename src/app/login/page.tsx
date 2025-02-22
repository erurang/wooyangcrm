"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const router = useRouter();

  const handleSendCode = async () => {
    try {
      setError(null);
      setIsLoading(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-xl rounded-lg p-6 w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
          {step === 1 ? "로그인" : "인증번호 입력"}
        </h1>

        {step === 1 && !isLoggedIn && (
          <div className="space-y-4">
            {/* <label className="block text-gray-700 font-medium">
              우양신소재 영업관리
            </label> */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSendCode}
              className={`w-full flex justify-center items-center bg-blue-500 text-white py-2 rounded-md transition hover:bg-blue-600 ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "인증번호 받기"
              )}
            </button>
          </div>
        )}

        {step === 2 && !isLoggedIn && (
          <div className="space-y-4">
            <label className="block text-gray-700 font-medium">인증번호</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="인증번호 입력"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleLogin}
              className={`w-full flex justify-center items-center bg-green-500 text-white py-2 rounded-md transition hover:bg-green-600 ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "로그인"
              )}
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition"
            >
              뒤로가기
            </button>
          </div>
        )}

        {message && (
          <p className="text-green-600 text-sm mt-4 text-center">{message}</p>
        )}
        {error && (
          <p className="text-red-600 text-sm mt-4 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
