"use client";

import { Building, FileText, Search, Clock, User, FileStack } from "lucide-react";
import HeadlessSelect from "@/components/ui/HeadlessSelect";

interface UserType {
  id: string;
  name: string;
  level: string;
}

interface DocumentSearchFiltersProps {
  searchTerm: string;
  searchDocNumber: string;
  searchNotes: string;
  selectedStatus: string;
  selectedUser: UserType | null;
  users: UserType[];
  onSearchTermChange: (value: string) => void;
  onDocNumberChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onUserChange: (user: UserType | null) => void;
}

export default function DocumentSearchFilters({
  searchTerm,
  searchDocNumber,
  searchNotes,
  selectedStatus,
  selectedUser,
  users,
  onSearchTermChange,
  onDocNumberChange,
  onNotesChange,
  onStatusChange,
  onUserChange,
}: DocumentSearchFiltersProps) {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="px-3 sm:px-4 py-3">
        {/* 타이틀 */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="p-1.5 sm:p-2 bg-indigo-50 rounded-lg">
            <FileStack className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-800">문서 상세</h1>
            <p className="text-[10px] sm:text-xs text-slate-500">문서를 검색하고 관리합니다</p>
          </div>
        </div>

        {/* 검색 필터 - 모바일: 2열 그리드 */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 sm:flex-wrap">
          {/* 거래처 */}
          <div className="relative sm:flex-1 sm:min-w-[140px] sm:max-w-[180px]">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              placeholder="거래처..."
              className="w-full pl-9 pr-3 py-2.5 sm:py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
            />
          </div>

          {/* 문서번호 */}
          <div className="relative sm:flex-1 sm:min-w-[140px] sm:max-w-[180px]">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchDocNumber}
              onChange={(e) => onDocNumberChange(e.target.value)}
              placeholder="문서번호..."
              className="w-full pl-9 pr-3 py-2.5 sm:py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
            />
          </div>

          {/* 특기사항 */}
          <div className="relative sm:flex-1 sm:min-w-[140px] sm:max-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="특기사항..."
              className="w-full pl-9 pr-3 py-2.5 sm:py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
            />
          </div>

          {/* 상태 */}
          <div className="sm:min-w-[150px]">
            <HeadlessSelect
              value={selectedStatus}
              onChange={(val) => onStatusChange(val)}
              options={[
                { value: "all", label: "전체" },
                { value: "pending", label: "진행" },
                { value: "expiring_soon", label: "만료임박" },
                { value: "completed", label: "완료" },
                { value: "canceled", label: "취소" },
                { value: "expired", label: "만료" },
              ]}
              placeholder="전체"
              icon={<Clock className="h-4 w-4" />}
              className="bg-slate-50 hover:bg-white"
              focusClass="focus:ring-indigo-500"
            />
          </div>

          {/* 상담자 */}
          <div className="sm:min-w-[120px]">
            <HeadlessSelect
              value={selectedUser?.id || ""}
              onChange={(val) => {
                const user = users.find((u) => u.id === val) || null;
                onUserChange(user);
              }}
              options={[
                { value: "", label: "전체" },
                ...users.map((u) => ({
                  value: u.id,
                  label: `${u.name} ${u.level}`,
                })),
              ]}
              placeholder="전체"
              icon={<User className="h-4 w-4" />}
              className="bg-slate-50 hover:bg-white"
              focusClass="focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
