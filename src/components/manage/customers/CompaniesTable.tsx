"use client";

import { Edit, Trash2, ChevronLeft, ChevronRight, Phone, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";

interface Contact {
  contact_name: string;
  mobile: string;
  department: string;
  level: string;
  email: string;
  resign: boolean;
}

interface Company {
  id: string;
  company_code: string;
  name: string;
  business_number: string;
  address: string;
  industry: string[];
  phone: string;
  fax: string;
  email: string;
  notes: string;
  contact: Contact[];
  parcel: string;
}

interface CompaniesTableProps {
  companies: Company[];
  total: number;
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  companiesPerPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onAdd?: () => void;
  hasSearchQuery?: boolean;
}

export default function CompaniesTable({
  companies,
  isLoading,
  currentPage,
  totalPages,
  companiesPerPage,
  onPageChange,
  onPerPageChange,
  onEdit,
  onDelete,
  onAdd,
  hasSearchQuery = false,
}: CompaniesTableProps) {
  const router = useRouter();

  const paginationNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        pageNumbers.push(i);
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        pageNumbers.push("...");
      }
    }
    return pageNumbers;
  };

  return (
    <div className="p-3 sm:p-4">
      {/* Table Controls */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-slate-500">
          {currentPage} / {totalPages} 페이지
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 hidden sm:inline">표시:</span>
          <select
            value={companiesPerPage}
            onChange={(e) => {
              onPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="border border-slate-200 rounded-lg px-2 py-2 sm:py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="10">10개</option>
            <option value="20">20개</option>
            <option value="30">30개</option>
            <option value="50">50개</option>
          </select>
        </div>
      </div>

      {/* Companies - Table for desktop, Cards for mobile */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-sm text-slate-500">불러오는 중...</span>
          </div>
        ) : companies && companies.length > 0 ? (
          <>
            {/* 모바일: 카드 레이아웃 */}
            <div className="sm:hidden divide-y divide-slate-100">
              {companies.map((company: Company) => (
                <div
                  key={company.id}
                  className="p-3 active:bg-slate-50"
                  onClick={() => router.push(`/consultations/${company.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                        <Building2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-800 truncate">
                          {company.name}
                        </div>
                        {company.business_number && (
                          <div className="text-xs text-slate-400">
                            {company.business_number}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(company);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-colors"
                        title="수정"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(company);
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {(company.phone || company.address) && (
                    <div className="mt-2 ml-10 space-y-1">
                      {company.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {company.phone}
                        </div>
                      )}
                      {company.address && (
                        <div className="text-xs text-slate-500 truncate">
                          {company.address}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 데스크탑: 테이블 레이아웃 */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                      거래처명
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden md:table-cell">
                      주소
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">
                      전화번호
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">
                      팩스
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 w-28">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companies.map((company: Company) => (
                    <tr
                      key={company.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/consultations/${company.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 group">
                          <div className="p-1.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <Building2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                              {company.name}
                            </div>
                            {company.business_number && (
                              <div className="text-xs text-slate-400">
                                {company.business_number}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-sm text-slate-600 truncate max-w-xs">
                          {company.address || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          {company.phone ? (
                            <>
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              {company.phone}
                            </>
                          ) : (
                            "-"
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="text-sm text-slate-600">
                          {company.fax || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(company);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="수정"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(company);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <EmptyState
            type={hasSearchQuery ? "search" : "company"}
            onAction={!hasSearchQuery && onAdd ? onAdd : undefined}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 px-2 sm:px-0">
          <nav className="flex items-center gap-0.5 sm:gap-1 bg-white rounded-lg border border-slate-200 p-1 shadow-sm overflow-x-auto max-w-full">
            <button
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2.5 sm:p-2 rounded-lg transition-colors shrink-0 active:scale-95 ${
                currentPage === 1
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:bg-slate-100 active:bg-slate-200"
              }`}
            >
              <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>

            {paginationNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === "number" && onPageChange(page)}
                className={`min-w-[36px] sm:min-w-[32px] h-9 sm:h-8 rounded-lg text-sm font-medium transition-colors shrink-0 active:scale-95 ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : page === "..."
                    ? "text-slate-400 cursor-default"
                    : "text-slate-600 hover:bg-slate-100 active:bg-slate-200"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() =>
                onPageChange(Math.min(currentPage + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`p-2.5 sm:p-2 rounded-lg transition-colors shrink-0 active:scale-95 ${
                currentPage === totalPages
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:bg-slate-100 active:bg-slate-200"
              }`}
            >
              <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
