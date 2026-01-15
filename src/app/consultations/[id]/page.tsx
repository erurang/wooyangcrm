import { Suspense } from "react";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import ConsultationPage from "./Consultpage";

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
        title: `${data.name} 상담 | WOOYANG CRM`,
        description: `${data.name} 거래처 상담 내역`,
      };
    }
  } catch {
    // fallback to default
  }

  return {
    title: "상담 상세 | WOOYANG CRM",
    description: "거래처 상담 내역",
  };
}

export default function ConsultationsIDPageWrapper() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ConsultationPage />
    </Suspense>
  );
}
