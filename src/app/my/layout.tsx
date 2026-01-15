import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 정보 | WOOYANG CRM",
  description: "내 할일, 내 정보 관리",
};

export default function MyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
