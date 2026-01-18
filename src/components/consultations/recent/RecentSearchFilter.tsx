"use client";

import { Calendar, User, RefreshCw, Building, MessageSquare } from "lucide-react";

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
  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 mb-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
        {/* 거래처 검색 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <Building className="w-3 h-3 mr-1 text-gray-400" />
            거래처
          </label>
          <input
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="거래처명"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* 상담내용 검색 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <MessageSquare className="w-3 h-3 mr-1 text-gray-400" />
            상담내용
          </label>
          <input
            value={contentSearch}
            onChange={(e) => onContentSearchChange(e.target.value)}
            placeholder="쉼표로 다중검색"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* 상담 기간 */}
        <div className="space-y-1 col-span-2 md:col-span-1 lg:col-span-2">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
            상담 기간
          </label>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <span className="text-gray-400 text-sm">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* 상담자 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <User className="w-3 h-3 mr-1 text-gray-400" />
            상담자
          </label>
          <select
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={selectedUser?.id || ""}
            onChange={(e) => {
              const user = users.find((u) => u.id === e.target.value) || null;
              onUserChange(user);
            }}
          >
            <option value="">전체</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} {user.level}
              </option>
            ))}
          </select>
        </div>

        {/* 필터 초기화 */}
        <div>
          <button
            onClick={onReset}
            className="w-full px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors flex items-center justify-center"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            초기화
          </button>
        </div>
      </div>
    </div>
  );
}
