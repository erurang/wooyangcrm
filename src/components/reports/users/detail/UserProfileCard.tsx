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
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
      <div className="flex items-center mb-4">
        <div className="bg-indigo-50 p-2 rounded-md mr-3">
          <User className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="flex-grow">
          <h2 className="text-xl font-semibold text-slate-800">
            {user?.name} {user?.level}
          </h2>
          <p className="text-slate-500">{user?.position}</p>
        </div>
        <div className="text-end text-slate-500 text-xs">
          <p>최근 접속IP : {loginLogs?.ip_address || "-"}</p>
          <p>
            최근 로그인 :{" "}
            {loginLogs?.login_time
              ? new Date(loginLogs.login_time).toLocaleString()
              : "-"}
          </p>
        </div>
      </div>

      <div className="flex items-center mb-4">
        <div className="bg-indigo-50 p-2 rounded-md mr-3">
          <Target className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">목표 금액</p>
          <p className="text-lg font-semibold text-slate-800">
            {user?.target?.toLocaleString() || "-"} 원
          </p>
        </div>
      </div>

      <div className="flex items-center">
        <div className="bg-indigo-50 p-2 rounded-md mr-3">
          <Clock className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">달성 금액</p>
          <p className="text-lg font-semibold text-indigo-600">
            {completedSales?.toLocaleString()} 원
          </p>
        </div>
      </div>
    </div>
  );
}
