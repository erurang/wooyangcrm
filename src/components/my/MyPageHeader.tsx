"use client";

import { useLoginUser } from "@/context/login";
import { FileText, MessageSquare, FileCheck, Mail, Briefcase } from "lucide-react";
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-200 rounded-full" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-slate-200 rounded" />
            <div className="h-4 w-24 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const initials = user.name?.charAt(0) || "U";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        {/* 프로필 정보 */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold shadow-md">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
              {user.level && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                  {user.level}
                </span>
              )}
              {!isOwnProfile && (
                <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                  프로필
                </span>
              )}
            </div>
            {user.position && (
              <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {user.position}
              </p>
            )}
            {isOwnProfile && user.email && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3" />
                {user.email}
              </p>
            )}
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="flex gap-3">
          <StatCard
            icon={<FileText className="w-5 h-5 text-blue-500" />}
            label="게시글"
            value={stats?.postsCount ?? "-"}
            color="blue"
          />
          <StatCard
            icon={<MessageSquare className="w-5 h-5 text-emerald-500" />}
            label="상담"
            value={stats?.consultationsCount ?? "-"}
            color="emerald"
          />
          <StatCard
            icon={<FileCheck className="w-5 h-5 text-purple-500" />}
            label="문서"
            value={stats?.documentsCount ?? "-"}
            color="purple"
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
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: "blue" | "emerald" | "purple";
}) {
  const bgColors = {
    blue: "bg-blue-50 border-blue-100",
    emerald: "bg-emerald-50 border-emerald-100",
    purple: "bg-purple-50 border-purple-100",
  };

  return (
    <div className={`flex items-center gap-2.5 ${bgColors[color]} border rounded-lg px-4 py-2.5`}>
      {icon}
      <div>
        <p className="text-lg font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
