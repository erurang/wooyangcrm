"use client";

import { Calendar, User, RefreshCw, Building } from "lucide-react";

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
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
        {/* 거래처 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <Building className="w-3 h-3 mr-1 text-gray-400" />
            거래처
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="거래처명"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* 후속상담 기간 */}
        <div className="space-y-1 col-span-2 md:col-span-1 lg:col-span-2">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
            후속상담 기간
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
            value={selectedUser?.id || ""}
            onChange={(e) => {
              const user = users.find((u) => u.id === e.target.value) || null;
              onUserChange(user);
            }}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
