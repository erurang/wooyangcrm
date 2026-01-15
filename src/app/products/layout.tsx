import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "제품/단가 관리 | WOOYANG CRM",
  description: "제품 정보 및 매입/매출 단가 관리",
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
