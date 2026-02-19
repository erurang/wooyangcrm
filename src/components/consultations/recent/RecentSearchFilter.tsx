"use client";

import { Calendar, User, RotateCcw, Building2, MessageSquare, Clock } from "lucide-react";
import HeadlessSelect from "@/components/ui/HeadlessSelect";

interface UserType {
  id: string;
  name: string;
  level: string;
}

interface RecentSearchFilterProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  contentSearch: string;
  onContentSearchChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  selectedUser: UserType | null;
  onUserChange: (user: UserType | null) => void;
  users: UserType[];
  onReset: () => void;
}

export default function RecentSearchFilter({
  searchTerm,
  onSearchTermChange,
  contentSearch,
  onContentSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  selectedUser,
  onUserChange,
  users,
  onReset,
}: RecentSearchFilterProps) {
  const hasFilters = searchTerm || contentSearch || selectedUser;

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
      <div className="px-4 py-3.5">
        {/* 타이틀 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-sky-50 rounded-xl">
            <Clock className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">최근 상담</h1>
            <p className="text-xs text-slate-400">오늘 상담 내역을 확인합니다</p>
          </div>
        </div>

        {/* 검색 필터 */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 거래처 검색 */}
          <div className="relative flex-1 min-w-[140px] max-w-[180px]">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              placeholder="거래처..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 bg-slate-50/50 hover:bg-white transition-all duration-200 placeholder:text-slate-300"
            />
          </div>

          {/* 상담내용 검색 */}
          <div className="relative flex-1 min-w-[140px] max-w-[180px]">
            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input
              value={contentSearch}
              onChange={(e) => onContentSearchChange(e.target.value)}
              placeholder="상담내용..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 bg-slate-50/50 hover:bg-white transition-all duration-200 placeholder:text-slate-300"
            />
          </div>

          {/* 상담 기간 */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-slate-300" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="px-2.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 bg-slate-50/50 hover:bg-white transition-all duration-200"
            />
            <span className="text-slate-300 text-xs font-medium">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="px-2.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 bg-slate-50/50 hover:bg-white transition-all duration-200"
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
              focusClass="focus:ring-sky-500"
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
