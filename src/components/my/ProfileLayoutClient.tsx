"use client";

import { useParams } from "next/navigation";
import MyPageHeader from "./MyPageHeader";
import MyPageTabs from "./MyPageTabs";

export default function ProfileLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();

  // URL에서 userId 추출 (/profile/[userId] 라우트)
  const targetUserId = typeof params.userId === "string" ? params.userId : undefined;

  // basePath 계산
  const basePath = targetUserId ? `/profile/${targetUserId}` : "/profile";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <MyPageHeader targetUserId={targetUserId} />
      <MyPageTabs basePath={basePath} />
      {children}
    </div>
  );
}
