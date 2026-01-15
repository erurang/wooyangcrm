import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "업로드 | WOOYANG CRM",
  description: "문서 및 파일 업로드",
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
