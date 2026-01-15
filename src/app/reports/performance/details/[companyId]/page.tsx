import { Suspense } from "react";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import PerformanceDetailClient from "./PerformanceDetailClient";

interface Props {
  params: Promise<{ companyId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { companyId } = await params;

  try {
    const { data } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();

    if (data?.name) {
      return {
        title: `${data.name} 성과 분석 | WOOYANG CRM`,
        description: `${data.name} 거래처 성과 및 추이 분석`,
      };
    }
  } catch {
    // fallback to default
  }

  return {
    title: "성과 분석 | WOOYANG CRM",
    description: "거래처 성과 및 추이 분석",
  };
}

export default function PerformanceDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600">데이터를 불러오는 중입니다...</p>
          </div>
        </div>
      }
    >
      <PerformanceDetailClient />
    </Suspense>
  );
}
