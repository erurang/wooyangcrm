"use client";

import { User, Target, Clock } from "lucide-react";

interface UserProfileCardProps {
  user: {
    name?: string;
    level?: string;
    position?: string;
    target?: number;
  } | null;
  loginLogs: {
    ip_address?: string;
    login_time?: string;
  } | null;
  completedSales: number;
}

export default function UserProfileCard({
  user,
  loginLogs,
  completedSales,
}: UserProfileCardProps) {
  const targetRate = user?.target
    ? Math.min(100, Math.round((completedSales / user.target) * 100))
    : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      {/* 프로필 헤더 */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
          {user?.name?.charAt(0) || "U"}
        </div>
        <div className="flex-grow">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
            {user?.level && (
              <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                {user?.level}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">{user?.position}</p>
        </div>
        <div className="text-end text-xs text-slate-400">
          <p>접속IP: {loginLogs?.ip_address || "-"}</p>
          <p>
            최근 로그인:{" "}
            {loginLogs?.login_time
              ? new Date(loginLogs.login_time).toLocaleString("ko-KR")
              : "-"}
          </p>
        </div>
      </div>

      {/* 목표/달성 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-slate-200 rounded-md">
              <Target className="h-4 w-4 text-slate-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">목표 금액</span>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {user?.target?.toLocaleString() || "-"}
            <span className="text-sm font-normal text-slate-500 ml-1">원</span>
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-indigo-200 rounded-md">
              <Clock className="h-4 w-4 text-indigo-600" />
            </div>
            <span className="text-xs font-medium text-indigo-700">달성 금액</span>
          </div>
          <p className="text-lg font-bold text-indigo-600">
            {completedSales?.toLocaleString()}
            <span className="text-sm font-normal text-indigo-500 ml-1">원</span>
          </p>
        </div>
      </div>

      {/* 달성률 프로그레스 바 */}
      {user?.target && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium text-slate-600">목표 달성률</span>
            <span className={`text-xs font-bold ${targetRate >= 100 ? "text-emerald-600" : "text-indigo-600"}`}>
              {targetRate}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                targetRate >= 100 ? "bg-emerald-500" : "bg-indigo-500"
              }`}
              style={{ width: `${Math.min(100, targetRate)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
