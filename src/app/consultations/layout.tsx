import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "상담 관리 | WOOYANG CRM",
  description: "고객 상담 내역 관리 및 후속 상담 추적",
};

export default function ConsultationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
