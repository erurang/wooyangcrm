"use client";

import { X, User, Building, Mail, Phone } from "lucide-react";

interface ResignSearchFilterProps {
  companyName: string;
  contactName: string;
  email: string;
  mobile: string;
  onCompanyNameChange: (value: string) => void;
  onContactNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onMobileChange: (value: string) => void;
  onKeyPress: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onReset: () => void;
}

export default function ResignSearchFilter({
  companyName,
  contactName,
  email,
  mobile,
  onCompanyNameChange,
  onContactNameChange,
  onEmailChange,
  onMobileChange,
  onKeyPress,
  onReset,
}: ResignSearchFilterProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 거래처명 */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            거래처명
          </label>
          <div className="relative">
            <input
              type="text"
              value={companyName}
              onChange={(e) => onCompanyNameChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="거래처명 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <Building
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {/* 담당자명 */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            담당자명
          </label>
          <div className="relative">
            <input
              type="text"
              value={contactName}
              onChange={(e) => onContactNameChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="담당자명 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {/* 이메일 */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이메일
          </label>
          <div className="relative">
            <input
              type="text"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="이메일 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {/* 연락처 */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            연락처
          </label>
          <div className="relative">
            <input
              type="text"
              value={mobile}
              onChange={(e) => onMobileChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="연락처 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <Phone
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>
      </div>

      {/* 필터 액션 */}
      <div className="flex justify-end mt-4">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <X size={16} />
          <span>필터 초기화</span>
        </button>
      </div>
    </div>
  );
}
