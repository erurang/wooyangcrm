import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "보고서 | WOOYANG CRM",
  description: "영업 실적, 거래처별, 담당자별 보고서",
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
