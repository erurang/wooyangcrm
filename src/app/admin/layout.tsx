import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리자 | WOOYANG CRM",
  description: "사용자 관리, 로그 조회, 시스템 설정",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
