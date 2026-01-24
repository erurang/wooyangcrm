import { Suspense } from "react";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import OverseasCompanyPage from "./OverseasCompanyPage";
import OverseasDetailSkeleton from "@/components/skeleton/OverseasDetailSkeleton";

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
        title: `${data.name} | 해외거래처 | WOOYANG CRM`,
        description: `${data.name} 해외거래처 발주 내역`,
      };
    }
  } catch {
    // fallback to default
  }

  return {
    title: "해외거래처 상세 | WOOYANG CRM",
    description: "해외거래처 발주 내역",
  };
}

export default function OverseasCompanyDetailPageWrapper() {
  return (
    <Suspense fallback={<OverseasDetailSkeleton />}>
      <OverseasCompanyPage />
    </Suspense>
  );
}
