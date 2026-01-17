"use client";

import { useLoginUser } from "@/context/login";
import { FileText, MessageSquare, FileCheck } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface Stats {
  postsCount: number;
  consultationsCount: number;
  documentsCount: number;
}

interface UserInfo {
  id: string;
  name: string;
  level?: string;
  position?: string;
  email?: string;
}

interface MyPageHeaderProps {
  targetUserId?: string;
}

export default function MyPageHeader({ targetUserId }: MyPageHeaderProps) {
  const loginUser = useLoginUser();
  const isOwnProfile = !targetUserId || targetUserId === loginUser?.id;

  // 타겟 유저 정보 조회 (본인이 아닐 경우)
  const { data: targetUser } = useSWR<UserInfo>(
    !isOwnProfile && targetUserId ? `/api/users/${targetUserId}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    { revalidateOnFocus: false }
  );

  const user = isOwnProfile ? loginUser : targetUser;
  const userId = isOwnProfile ? loginUser?.id : targetUserId;

  const { data: stats } = useSWR<Stats>(
    userId ? `/api/my/stats?userId=${userId}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    { revalidateOnFocus: false }
  );

  if (!user) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const initials = user.name?.charAt(0) || "U";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* 프로필 정보 */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {user.name}{" "}
              <span className="text-base font-normal text-gray-500">
                {user.level}
              </span>
              {!isOwnProfile && (
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  프로필
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500">{user.position}</p>
            {isOwnProfile && <p className="text-xs text-gray-400">{user.email}</p>}
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="flex gap-4">
          <StatCard
            icon={<FileText className="w-5 h-5 text-blue-500" />}
            label="게시글"
            value={stats?.postsCount ?? "-"}
          />
          <StatCard
            icon={<MessageSquare className="w-5 h-5 text-green-500" />}
            label="상담"
            value={stats?.consultationsCount ?? "-"}
          />
          <StatCard
            icon={<FileCheck className="w-5 h-5 text-purple-500" />}
            label="문서"
            value={stats?.documentsCount ?? "-"}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2">
      {icon}
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
