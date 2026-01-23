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
    <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="px-4 py-3">
        {/* 타이틀 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-cyan-50 rounded-lg">
            <Clock className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">최근 상담</h1>
            <p className="text-xs text-slate-500">오늘 상담 내역을 확인합니다</p>
          </div>
        </div>

        {/* 검색 필터 */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* 거래처 검색 */}
          <div className="relative flex-1 min-w-[140px] max-w-[180px]">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              placeholder="거래처..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
            />
          </div>

          {/* 상담내용 검색 */}
          <div className="relative flex-1 min-w-[140px] max-w-[180px]">
            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={contentSearch}
              onChange={(e) => onContentSearchChange(e.target.value)}
              placeholder="상담내용..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
            />
          </div>

          {/* 상담 기간 */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="px-2.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
            />
            <span className="text-slate-400">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="px-2.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
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
              focusClass="focus:ring-cyan-500"
            />
          </div>

          {/* 필터 초기화 */}
          {hasFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              초기화
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
