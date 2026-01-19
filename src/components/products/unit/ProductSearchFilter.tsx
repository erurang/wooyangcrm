"use client";

import { Package, Ruler, DollarSign, Users, Filter, Building } from "lucide-react";

interface User {
  id: string;
  name: string;
  level: string;
}

interface ProductSearchFilterProps {
  searchCompany: string;
  searchProduct: string;
  searchSpec: string;
  minPrice: number | "";
  maxPrice: number | "";
  status: string;
  selectedUser: User | null;
  users: User[];
  userRole?: string;
  onSearchCompanyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchProductChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSpecChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMinPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onUserChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function ProductSearchFilter({
  searchCompany,
  searchProduct,
  searchSpec,
  minPrice,
  maxPrice,
  status,
  selectedUser,
  users,
  userRole,
  onSearchCompanyChange,
  onSearchProductChange,
  onSearchSpecChange,
  onMinPriceChange,
  onMaxPriceChange,
  onStatusChange,
  onUserChange,
}: ProductSearchFilterProps) {
  const showUserFilter = userRole === "admin" || userRole === "managementSupport";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 mb-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 items-end">
        {/* 거래처 */}
        <div className="space-y-1">
          <label className="text-[10px] sm:text-xs font-medium text-slate-600 flex items-center">
            <Building className="w-3 h-3 mr-1 text-slate-400" />
            거래처
          </label>
          <input
            type="text"
            value={searchCompany}
            onChange={onSearchCompanyChange}
            placeholder="거래처명"
            className="w-full px-2 py-2 sm:py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>

        {/* 물품명 */}
        <div className="space-y-1">
          <label className="text-[10px] sm:text-xs font-medium text-slate-600 flex items-center">
            <Package className="w-3 h-3 mr-1 text-slate-400" />
            물품명
          </label>
          <input
            type="text"
            value={searchProduct}
            onChange={onSearchProductChange}
            placeholder="물품명"
            className="w-full px-2 py-2 sm:py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>

        {/* 규격 */}
        <div className="space-y-1">
          <label className="text-[10px] sm:text-xs font-medium text-slate-600 flex items-center">
            <Ruler className="w-3 h-3 mr-1 text-slate-400" />
            규격
          </label>
          <input
            type="text"
            value={searchSpec}
            onChange={onSearchSpecChange}
            placeholder="규격"
            className="w-full px-2 py-2 sm:py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>

        {/* 단가 범위 - 모바일에서 전체 폭 사용 */}
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <label className="text-[10px] sm:text-xs font-medium text-slate-600 flex items-center">
            <DollarSign className="w-3 h-3 mr-1 text-slate-400" />
            단가 범위
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={minPrice}
              onChange={onMinPriceChange}
              placeholder="최소"
              className="flex-1 w-full px-2 py-2 sm:py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
            <span className="text-slate-400 text-xs">~</span>
            <input
              type="number"
              value={maxPrice}
              onChange={onMaxPriceChange}
              placeholder="최대"
              className="flex-1 w-full px-2 py-2 sm:py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* 상태 */}
        <div className="space-y-1">
          <label className="text-[10px] sm:text-xs font-medium text-slate-600 flex items-center">
            <Filter className="w-3 h-3 mr-1 text-slate-400" />
            상태
          </label>
          <select
            value={status}
            onChange={onStatusChange}
            className="w-full px-2 py-2 sm:py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          >
            <option value="all">모든 상태</option>
            <option value="pending">진행 중</option>
            <option value="completed">완료됨</option>
            <option value="canceled">취소됨</option>
          </select>
        </div>

        {/* 상담자 (관리자 또는 관리지원 역할만 표시) */}
        {showUserFilter && (
          <div className="space-y-1">
            <label className="text-[10px] sm:text-xs font-medium text-slate-600 flex items-center">
              <Users className="w-3 h-3 mr-1 text-slate-400" />
              상담자
            </label>
            <select
              value={selectedUser?.id || ""}
              onChange={onUserChange}
              className="w-full px-2 py-2 sm:py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            >
              <option value="">전체</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.level}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
