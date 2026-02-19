"use client";

import { User, Target } from "lucide-react";
import { formatDateTimeKST } from "@/utils/dateUtils";

interface UserInfoCardProps {
  userName?: string;
  userLevel?: string;
  userPosition?: string;
  targetAmount?: number;
  loginIp?: string;
  loginTime?: string;
}

export default function UserInfoCard({
  userName,
  userLevel,
  userPosition,
  targetAmount,
  loginIp,
  loginTime,
}: UserInfoCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
      <div className="flex items-center mb-4">
        <div className="bg-sky-50 p-2 rounded-md mr-3">
          <User className="h-5 w-5 text-sky-600" />
        </div>
        <div className="flex-grow">
          <h2 className="text-xl font-semibold text-slate-800">
            {userName} {userLevel}
          </h2>
          <p className="text-slate-500">{userPosition}</p>
        </div>
        <div className="text-end text-slate-500 text-xs">
          <p>최근 접속IP : {loginIp || "-"}</p>
          <p>
            최근 로그인 :{" "}
            {formatDateTimeKST(loginTime)}
          </p>
        </div>
      </div>

      <div className="flex items-center">
        <div className="bg-sky-50 p-2 rounded-md mr-3">
          <Target className="h-5 w-5 text-sky-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">목표 금액</p>
          <p className="text-lg font-semibold text-sky-600">
            {targetAmount?.toLocaleString() || "-"} 원
          </p>
        </div>
      </div>
    </div>
  );
}
