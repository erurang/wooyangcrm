"use client";

import { User, FileText, MessageSquare, Eye, Clock, Calendar } from "lucide-react";
import dayjs from "dayjs";

interface UserStats {
  posts_count: number;
  comments_count: number;
  total_views: number;
  last_activity_at: string | null;
}

interface UserInfo {
  id: string;
  name: string;
  level?: string;
  position?: string;
  joined_at?: string;
}

interface UserProfileCardProps {
  user: UserInfo;
  stats: UserStats;
  isLoading?: boolean;
}

// 이름 첫 글자로 아바타 색상 결정
const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-red-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function UserProfileCard({
  user,
  stats,
  isLoading = false,
}: UserProfileCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-8 bg-gray-200 rounded mb-1" />
              <div className="h-4 bg-gray-200 rounded w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* 프로필 헤더 */}
      <div className="flex items-center gap-4">
        {/* 아바타 */}
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${getAvatarColor(user.name)}`}
        >
          {user.name.charAt(0)}
        </div>

        {/* 유저 정보 */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            {user.name}
            {user.level && (
              <span className="text-sm font-normal text-gray-500">
                {user.level}
              </span>
            )}
          </h2>
          {user.position && (
            <p className="text-sm text-gray-600 mt-0.5">{user.position}</p>
          )}
          {user.joined_at && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              가입일: {dayjs(user.joined_at).format("YYYY-MM-DD")}
            </p>
          )}
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.posts_count}
          </div>
          <div className="text-xs text-gray-500">게시글</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.comments_count}
          </div>
          <div className="text-xs text-gray-500">댓글</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
            <Eye className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.total_views.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">조회수</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-sm font-medium text-gray-900">
            {stats.last_activity_at
              ? dayjs(stats.last_activity_at).format("MM/DD HH:mm")
              : "-"}
          </div>
          <div className="text-xs text-gray-500">최근 활동</div>
        </div>
      </div>
    </div>
  );
}
