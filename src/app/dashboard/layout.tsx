import type { Metadata } from "next";
import DashboardClientLayout from "./DashboardClientLayout";

export const metadata: Metadata = {
  title: "대시보드 | WOOYANG CRM",
  description: "우양신소재 CRM 대시보드 - 영업 현황, 매출/매입 분석, 성과 지표",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
