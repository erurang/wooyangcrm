"use client";

import { Building, FileText, Search, Clock, User } from "lucide-react";

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

        {/* 문서번호 */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            문서번호
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchDocNumber}
              onChange={(e) => onDocNumberChange(e.target.value)}
              placeholder="WY-YYYYMMDD-NNNN"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <FileText
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {/* 특기사항 */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            특기사항
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="특기사항 검색"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {/* 상태 */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            상태
          </label>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="all">전체</option>
              <option value="pending">진행</option>
              <option value="completed">완료</option>
              <option value="canceled">취소</option>
              <option value="expired">만료</option>
            </select>
            <Clock
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
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
                const user =
                  users.find((u) => u.id === e.target.value) || null;
                onUserChange(user);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="">전체 상담자</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.level}
                </option>
              ))}
            </select>
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
