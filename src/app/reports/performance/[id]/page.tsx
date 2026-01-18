import { Suspense } from "react";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import PerformanceDetailClient from "./PerformanceDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const { data } = await supabase
      .from("users")
      .select("name, position")
      .eq("id", id)
      .single();

    if (data?.name) {
      return {
        title: `${data.name}${data.position ? ` ${data.position}` : ""} 영업 성과 | WOOYANG CRM`,
        description: `${data.name} 담당자 영업 성과 분석`,
      };
    }
  } catch {
    // fallback to default
  }

  return {
    title: "영업 성과 | WOOYANG CRM",
    description: "담당자별 영업 성과 분석",
  };
}

export default function PerformanceDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 mt-4">데이터를 불러오는 중입니다...</p>
          </div>
        </div>
      }
    >
      <PerformanceDetailClient />
    </Suspense>
  );
}
