import { Suspense } from "react";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import ContactDetailClient from "./ContactDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const { data } = await supabase
      .from("contacts")
      .select("contact_name, companies(name)")
      .eq("id", id)
      .single();

    if (data?.contact_name) {
      // companies can be an object or array depending on relationship
      const companies = data.companies as { name: string } | { name: string }[] | null;
      const companyName = Array.isArray(companies) ? companies[0]?.name : companies?.name;
      return {
        title: `${data.contact_name}${companyName ? ` (${companyName})` : ""} | WOOYANG CRM`,
        description: `${data.contact_name} 담당자 상세 정보`,
      };
    }
  } catch {
    // fallback to default
  }

  return {
    title: "담당자 상세 | WOOYANG CRM",
    description: "담당자 상세 정보",
  };
}

export default function ContactDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-600 mb-4"></div>
            <p className="text-slate-500">데이터를 불러오는 중입니다...</p>
          </div>
        </div>
      }
    >
      <ContactDetailClient />
    </Suspense>
  );
}
