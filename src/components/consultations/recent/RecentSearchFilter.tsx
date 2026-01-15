"use client";

import { motion } from "framer-motion";
import { Calendar, User, RefreshCw, Building } from "lucide-react";

interface UserType {
  id: string;
  name: string;
  level: string;
}

interface RecentSearchFilterProps {
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

export default function RecentSearchFilter({
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
}: RecentSearchFilterProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <Building className="w-4 h-4 mr-2 text-gray-500" />
            거래처
          </label>
          <motion.input
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="거래처명 입력"
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            whileFocus={{
              scale: 1.02,
              boxShadow: "0px 0px 8px rgba(59, 130, 246, 0.3)",
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            상담 기간
          </label>
          <div className="flex items-center space-x-2">
            <motion.input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              whileFocus={{
                scale: 1.02,
                boxShadow: "0px 0px 8px rgba(59, 130, 246, 0.3)",
              }}
            />
            <span className="text-gray-500">~</span>
            <motion.input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              whileFocus={{
                scale: 1.02,
                boxShadow: "0px 0px 8px rgba(59, 130, 246, 0.3)",
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <User className="w-4 h-4 mr-2 text-gray-500" />
            상담자
          </label>
          <motion.select
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedUser?.id || ""}
            onChange={(e) => {
              const user = users.find((u) => u.id === e.target.value) || null;
              onUserChange(user);
            }}
            whileFocus={{
              scale: 1.02,
              boxShadow: "0px 0px 8px rgba(59, 130, 246, 0.3)",
            }}
          >
            <option value="">전체 상담자</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} {user.level}
              </option>
            ))}
          </motion.select>
        </div>

        <div className="flex items-end">
          <button
            onClick={onReset}
            className="w-full p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            필터 초기화
          </button>
        </div>
      </div>
    </div>
  );
}
