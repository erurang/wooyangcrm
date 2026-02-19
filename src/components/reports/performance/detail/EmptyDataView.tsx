"use client";

import { useRouter } from "next/navigation";

export default function EmptyDataView() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <p className="text-lg font-semibold">📉 표시할 데이터가 없어요.</p>
      <p className="text-sm">해당 회사의 영업 기록이 없습니다.</p>
      <button
        onClick={() => router.back()}
        className="px-4 py-2 rounded-md text-black"
      >
        뒤로가기
      </button>
    </div>
  );
}
