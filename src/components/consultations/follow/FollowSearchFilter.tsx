"use client";

import { Calendar, User, X, Building } from "lucide-react";

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 거래처 */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            거래처
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              placeholder="거래처명 입력"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <Building
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {/* 상담 기간 */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            상담 기간
          </label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
            <span className="text-gray-500">~</span>
            <div className="relative flex-1">
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>
        </div>

        {/* 상담자 */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            상담자
          </label>
          <div className="relative">
            <select
              value={selectedUser?.id || ""}
              onChange={(e) => {
                const user = users.find((u) => u.id === e.target.value) || null;
                onUserChange(user);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="">전체 상담자</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.level}
                </option>
              ))}
            </select>
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {/* 필터 액션 */}
        <div className="flex items-end">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors w-full justify-center"
          >
            <X size={16} />
            <span>필터 초기화</span>
          </button>
        </div>
      </div>
    </div>
  );
}
