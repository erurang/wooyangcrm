import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리 | WOOYANG CRM",
  description: "거래처, 담당자, 일정 관리",
};

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
