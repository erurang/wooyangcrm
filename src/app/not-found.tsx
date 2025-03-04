"use client";

import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-800">
      {/* 메시지 */}
      <h1 className="text-3xl md:text-5xl font-bold mt-6">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="text-md md:text-lg text-gray-600 mt-2">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>

      {/* 버튼 */}
      <div className="mt-6 flex space-x-4">
        <button
          // onClick={() => router.push("/")}
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition"
        >
          홈으로 가기
        </button>
        <button
          // onClick={() => router.back()}
          className="px-6 py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-400 transition"
        >
          이전 페이지
        </button>
      </div>
    </div>
  );
}
