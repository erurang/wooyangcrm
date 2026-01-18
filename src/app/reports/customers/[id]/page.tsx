import { Suspense } from "react";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import CompanyDetailClient from "./CompanyDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const { data } = await supabase
      .from("companies")
      .select("name")
      .eq("id", id)
      .single();

    if (data?.name) {
      return {
        title: `${data.name} 거래처 분석 | WOOYANG CRM`,
        description: `${data.name} 거래처 매출/매입 분석`,
      };
    }
  } catch {
    // fallback to default
  }

  return {
    title: "거래처 분석 | WOOYANG CRM",
    description: "거래처별 매출/매입 분석",
  };
}

export default function CompanyDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 mt-4">데이터를 불러오는 중입니다...</p>
          </div>
        </div>
      }
    >
      <CompanyDetailClient />
    </Suspense>
  );
}
