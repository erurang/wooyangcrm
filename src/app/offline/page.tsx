"use client";

import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-md">
        {/* 아이콘 */}
        <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
          <WifiOff className="w-12 h-12 text-slate-400" />
        </div>

        {/* 제목 */}
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          오프라인 상태입니다
        </h1>

        {/* 설명 */}
        <p className="text-slate-500 mb-8">
          인터넷 연결이 끊어졌습니다.
          <br />
          연결 상태를 확인하고 다시 시도해주세요.
        </p>

        {/* 다시 시도 버튼 */}
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <RefreshCw className="w-5 h-5" />
          다시 시도
        </button>

        {/* 추가 안내 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
          <p className="font-medium mb-1">오프라인에서 사용 가능한 기능</p>
          <ul className="text-blue-600 text-left list-disc list-inside">
            <li>이전에 방문한 페이지 일부 열람</li>
            <li>저장된 데이터 확인</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
