"use client";

import { Calendar, User, RotateCcw, Building2, CalendarClock } from "lucide-react";
import HeadlessSelect from "@/components/ui/HeadlessSelect";

interface UserType {
  id: string;
  name: string;
  level: string;
}

interface FollowSearchFilterProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  selectedUser: UserType | null;
  onUserChange: (user: UserType | null) => void;
  users: UserType[];
  onReset: () => void;
}

export default function FollowSearchFilter({
  searchTerm,
  onSearchTermChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  selectedUser,
  onUserChange,
  users,
  onReset,
}: FollowSearchFilterProps) {
  const hasFilters = searchTerm || selectedUser;

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
      <div className="px-4 py-3.5">
        {/* 타이틀 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-50 rounded-xl">
            <CalendarClock className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">후속상담</h1>
            <p className="text-xs text-slate-400">예정된 후속상담 일정을 관리합니다</p>
          </div>
        </div>

        {/* 검색 필터 */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 거래처 검색 */}
          <div className="relative flex-1 min-w-[140px] max-w-[180px]">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              placeholder="거래처..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-slate-50/50 hover:bg-white transition-all duration-200 placeholder:text-slate-300"
            />
          </div>

          {/* 후속상담 기간 */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-slate-300" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="px-2.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-slate-50/50 hover:bg-white transition-all duration-200"
            />
            <span className="text-slate-300 text-xs font-medium">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="px-2.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-slate-50/50 hover:bg-white transition-all duration-200"
            />
          </div>

          {/* 상담자 */}
          <div className="min-w-[140px]">
            <HeadlessSelect
              value={selectedUser?.id || ""}
              onChange={(val) => {
                const user = users.find((u) => u.id === val) || null;
                onUserChange(user);
              }}
              options={[
                { value: "", label: "전체" },
                ...users.map((user) => ({
                  value: user.id,
                  label: `${user.name} ${user.level}`,
                })),
              ]}
              placeholder="전체"
              icon={<User className="h-4 w-4" />}
              focusClass="focus:ring-orange-500"
            />
          </div>

          {/* 필터 초기화 */}
          {hasFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              초기화
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
