"use client";

import { RefreshCw, User, Building, Mail, Phone } from "lucide-react";

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
        {/* 거래처명 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <Building className="w-3 h-3 mr-1 text-gray-400" />
            거래처명
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            onKeyDown={onKeyPress}
            placeholder="거래처명"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* 담당자명 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <User className="w-3 h-3 mr-1 text-gray-400" />
            담당자명
          </label>
          <input
            type="text"
            value={contactName}
            onChange={(e) => onContactNameChange(e.target.value)}
            onKeyDown={onKeyPress}
            placeholder="담당자명"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* 이메일 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <Mail className="w-3 h-3 mr-1 text-gray-400" />
            이메일
          </label>
          <input
            type="text"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onKeyDown={onKeyPress}
            placeholder="이메일"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* 연락처 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <Phone className="w-3 h-3 mr-1 text-gray-400" />
            연락처
          </label>
          <input
            type="text"
            value={mobile}
            onChange={(e) => onMobileChange(e.target.value)}
            onKeyDown={onKeyPress}
            placeholder="연락처"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
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
