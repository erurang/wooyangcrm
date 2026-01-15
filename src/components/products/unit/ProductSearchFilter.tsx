"use client";

import {
  Package,
  Ruler,
  DollarSign,
  Users,
  Filter,
  ChevronDown,
  Building,
} from "lucide-react";

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
      <div className="space-y-4">
        {/* 상단 필터 그룹: 거래처, 물품명, 규격 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* 거래처 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              거래처
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Building className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchCompany}
                onChange={onSearchCompanyChange}
                placeholder="거래처명"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* 물품명 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              물품명
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Package className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchProduct}
                onChange={onSearchProductChange}
                placeholder="물품명"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* 규격 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              규격
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Ruler className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchSpec}
                onChange={onSearchSpecChange}
                placeholder="규격"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* 하단 필터 그룹: 단가 범위, 상태, 상담자 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* 단가 범위 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              단가 범위
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={minPrice}
                  onChange={onMinPriceChange}
                  placeholder="최소"
                  className="pl-10 pr-2 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <span className="self-center text-gray-500">~</span>
              <div className="relative flex-1">
                <input
                  type="number"
                  value={maxPrice}
                  onChange={onMaxPriceChange}
                  placeholder="최대"
                  className="pl-3 pr-2 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* 상태 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              상태
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={status}
                onChange={onStatusChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
              >
                <option value="all">모든 상태</option>
                <option value="pending">진행 중</option>
                <option value="completed">완료됨</option>
                <option value="canceled">취소됨</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* 상담자 (관리자 또는 관리지원 역할만 표시) */}
          {showUserFilter && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                상담자
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  value={selectedUser?.id || ""}
                  onChange={onUserChange}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="">모든 상담자</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.level}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
