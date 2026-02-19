"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSetLoginUser } from "@/context/login";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import KakaoButton from "@/components/login/KakaoLogin";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const setLoginUser = useSetLoginUser();

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

      if (!response.ok) {
        const data = await response.json();
        setError(`오류: ${data.error}`);
      }

      setMessage("로그인 성공!");

      const userResponse = await fetch("/api/user");
      const userJson = await userResponse.json();

      if (!userJson.email) {
        console.error("API returned invalid user data:", userJson);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("name, id, position, level, works_email")
        .eq("email", userJson.email);

      if (error) {
        console.error("Error fetching user data from Supabase:", error);
        return;
      }

      if (!data || data.length === 0) {
        console.error("No user found in Supabase for email:", userJson.email);
        return;
      }

      // 3) 전역 상태 업데이트
      setLoginUser({
        email: userJson.email,
        role: userJson.role || "user",
        name: data[0].name,
        id: data[0].id,
        position: data[0].position || "",
        level: data[0].level || "",
        worksEmail: data[0].works_email || "",
      });

      const redirectTo =
        new URLSearchParams(window.location.search).get("redirectTo") || "/";
      router.push(redirectTo);
    } catch (error) {
      console.error("서버 오류:", error);
      setError("서버 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return <KakaoButton />;

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100">
      <div className="bg-white shadow-xl rounded-lg p-6 w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-slate-800 mb-4 text-center">
          {step === 1 ? "로그인" : "인증번호 입력"}
        </h1>

        {step === 1 && !isLoggedIn && (
          <div className="space-y-4">
            {/* <label className="block text-slate-600 font-medium">
              우양신소재 영업관리
            </label> */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-sky-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSendCode}
              className={`w-full flex justify-center items-center bg-sky-500 text-white py-2 rounded-md transition hover:bg-sky-600 ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                "인증번호 받기"
              )}
            </button>
          </div>
        )}

        {step === 2 && !isLoggedIn && (
          <div className="space-y-4">
            <label className="block text-slate-600 font-medium">인증번호</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="인증번호 입력"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-sky-500"
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
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                "로그인"
              )}
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full bg-slate-500 text-white py-2 rounded-md hover:bg-slate-600 transition"
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
