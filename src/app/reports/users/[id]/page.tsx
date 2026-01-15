import { Suspense } from "react";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import UserDetailClient from "./UserDetailClient";

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
        title: `${data.name}${data.position ? ` ${data.position}` : ""} 실적 | WOOYANG CRM`,
        description: `${data.name} 담당자 영업 실적 분석`,
      };
    }
  } catch {
    // fallback to default
  }

  return {
    title: "담당자 실적 | WOOYANG CRM",
    description: "담당자별 영업 실적 분석",
  };
}

export default function UserDetailPage() {
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
      <UserDetailClient />
    </Suspense>
  );
}
