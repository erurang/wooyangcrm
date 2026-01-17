import type { Metadata } from "next";
import ProfileLayoutClient from "@/components/my/ProfileLayoutClient";

export const metadata: Metadata = {
  title: "프로필 | WOOYANG CRM",
  description: "유저 프로필, 활동, 게시글, 파일, 상담, 문서 관리",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <ProfileLayoutClient>{children}</ProfileLayoutClient>;
}
