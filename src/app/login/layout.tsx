import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 | WOOYANG CRM",
  description: "우양신소재 CRM 시스템 로그인",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
