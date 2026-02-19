"use client";

import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-slate-700">
      {/* 메시지 */}
      <h1 className="text-3xl md:text-5xl font-bold mt-6">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="text-md md:text-lg text-slate-500 mt-2">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>

      {/* 버튼 */}
      <div className="mt-6 flex space-x-4">
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-sky-500 text-white font-semibold rounded-lg shadow-md hover:bg-sky-600 transition"
        >
          홈으로 가기
        </button>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-slate-300 text-slate-700 font-semibold rounded-lg shadow-md hover:bg-slate-400 transition"
        >
          이전 페이지
        </button>
      </div>
    </div>
  );
}
