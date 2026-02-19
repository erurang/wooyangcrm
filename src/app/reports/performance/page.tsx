"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLoginUser } from "@/context/login";

export default function PerformanceRedirectPage() {
  const router = useRouter();
  const user = useLoginUser();

  useEffect(() => {
    if (user?.id) {
      router.replace(`/reports/performance/${user.id}`);
    }
  }, [user, router]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
      <div className="flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 mt-4">페이지를 이동하는 중입니다...</p>
      </div>
    </div>
  );
}
