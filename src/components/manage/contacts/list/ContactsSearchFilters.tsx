"use client";

import { RotateCcw, Plus, Building2, User, Mail, Phone, Search, Users } from "lucide-react";

interface ContactsSearchFiltersProps {
  companyName: string;
  contactName: string;
  email: string;
  mobile: string;
  total?: number;
  onCompanyNameChange: (value: string) => void;
  onContactNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onMobileChange: (value: string) => void;
  onReset: () => void;
  onAddClick: () => void;
}

export default function ContactsSearchFilters({
  companyName,
  contactName,
  email,
  mobile,
  total = 0,
  onCompanyNameChange,
  onContactNameChange,
  onEmailChange,
  onMobileChange,
  onReset,
  onAddClick,
}: ContactsSearchFiltersProps) {
  const hasFilters = companyName || contactName || email || mobile;

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="px-4 py-3">
        {/* 상단 타이틀 및 추가 버튼 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 rounded-lg">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">담당자 관리</h1>
              <p className="text-xs text-slate-500">
                총 <span className="font-semibold text-violet-600">{total.toLocaleString()}</span>명 담당자
              </p>
            </div>
          </div>
          <button
            onClick={onAddClick}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            담당자 추가
          </button>
        </div>

        {/* 검색 필터 영역 */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* 거래처명 검색 */}
          <div className="relative flex-1 min-w-[140px] max-w-[180px]">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={companyName}
              onChange={(e) => onCompanyNameChange(e.target.value)}
              placeholder="거래처명..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
            />
          </div>

          {/* 담당자명 검색 */}
          <div className="relative flex-1 min-w-[140px] max-w-[180px]">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={contactName}
              onChange={(e) => onContactNameChange(e.target.value)}
              placeholder="담당자명..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
            />
          </div>

          {/* 이메일 검색 */}
          <div className="relative flex-1 min-w-[140px] max-w-[180px]">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="이메일..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
            />
          </div>

          {/* 연락처 검색 */}
          <div className="relative flex-1 min-w-[140px] max-w-[180px]">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={mobile}
              onChange={(e) => onMobileChange(e.target.value)}
              placeholder="연락처..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
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
