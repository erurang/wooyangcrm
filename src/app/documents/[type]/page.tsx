import { Suspense } from "react";
import type { Metadata } from "next";
import DocPage from "./DocPage";

interface Props {
  params: Promise<{ type: string }>;
}

const typeLabels: Record<string, string> = {
  estimate: "견적서",
  order: "발주서",
  requestQuote: "의뢰서",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const label = typeLabels[type] || "문서";

  return {
    title: `${label} 관리 | WOOYANG CRM`,
    description: `${label} 작성 및 관리`,
  };
}

export default function DocumentsDetailsPageWrapper() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <DocPage />
    </Suspense>
  );
}
