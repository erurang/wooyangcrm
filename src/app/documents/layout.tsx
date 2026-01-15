import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문서 관리 | WOOYANG CRM",
  description: "견적서, 발주서, 의뢰서 관리",
};

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
