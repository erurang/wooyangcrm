"use client";

import { Edit, Trash2, ChevronLeft, ChevronRight, Globe, ExternalLink, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";
import HeadlessSelect from "@/components/ui/HeadlessSelect";
import { OverseasCompany } from "@/types/overseas";

interface OverseasCompanyTableProps {
  companies: OverseasCompany[];
  total: number;
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  companiesPerPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onEdit: (company: OverseasCompany) => void;
  onDelete: (company: OverseasCompany) => void;
  onAdd?: () => void;
  hasSearchQuery?: boolean;
}

export default function OverseasCompanyTable({
  companies,
  total,
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
}: OverseasCompanyTableProps) {
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
    <>
      {/* Table Controls */}
      <div className="flex justify-between items-center px-4 py-3">
        <div className="text-sm text-slate-500">
          총 <span className="font-semibold text-teal-600">{total}</span>개 해외 거래처
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">표시:</span>
          <HeadlessSelect
            value={String(companiesPerPage)}
            onChange={(val) => {
              onPerPageChange(Number(val));
              onPageChange(1);
            }}
            options={[
              { value: "10", label: "10개" },
              { value: "20", label: "20개" },
              { value: "30", label: "30개" },
              { value: "50", label: "50개" },
            ]}
            className="w-24"
            focusClass="focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Companies Table */}
      <div className="p-3 sm:p-4 pt-0">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-slate-500">해외 거래처를 불러오는 중...</p>
            </div>
          ) : companies && companies.length > 0 ? (
            <>
              {/* 모바일: 카드 레이아웃 */}
              <div className="sm:hidden divide-y divide-slate-100">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="p-3 active:bg-slate-50"
                    onClick={() => router.push(`/overseas/${company.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="p-2 bg-teal-50 rounded-lg shrink-0">
                          <Globe className="h-4 w-4 text-teal-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-teal-600 truncate">
                            {company.name}
                          </div>
                          {company.address && (
                            <div className="text-xs text-slate-500 mt-0.5 truncate">
                              {company.address}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(company); }}
                          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 active:bg-teal-100 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(company); }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {(company.contacts?.length || company.email) && (
                      <div className="mt-2 ml-10 flex flex-wrap gap-x-4 gap-y-1">
                        {company.contacts && company.contacts.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Users size={12} />
                            {company.contacts[0].name}
                            {company.contacts.length > 1 && ` 외 ${company.contacts.length - 1}명`}
                          </div>
                        )}
                        {company.email && (
                          <div className="text-xs text-slate-500 truncate">
                            {company.email}
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
                        담당자
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">
                        이메일
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">
                        홈페이지
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 w-24">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {companies.map((company) => (
                      <tr
                        key={company.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div
                            className="text-sm font-medium text-teal-600 cursor-pointer hover:text-teal-700"
                            onClick={() =>
                              router.push(`/overseas/${company.id}`)
                            }
                          >
                            {company.name}
                          </div>
                          {company.address && (
                            <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                              {company.address}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {company.contacts && company.contacts.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <Users size={14} className="text-slate-400" />
                              <div>
                                <div className="text-sm text-slate-700">
                                  {company.contacts[0].name}
                                </div>
                                {company.contacts.length > 1 && (
                                  <div className="text-xs text-slate-500">
                                    외 {company.contacts.length - 1}명
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="text-sm text-slate-700">
                            {company.email || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {company.website ? (
                            <a
                              href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={12} />
                              <span className="truncate max-w-[120px]">
                                {company.website.replace(/^https?:\/\//, "")}
                              </span>
                            </a>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onEdit(company)}
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="수정"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onDelete(company)}
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center px-4 pb-4">
          <nav className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
            <button
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === 1
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {paginationNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === "number" && onPageChange(page)}
                className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "bg-teal-600 text-white"
                    : page === "..."
                    ? "text-slate-400 cursor-default"
                    : "text-slate-600 hover:bg-slate-100"
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
              className={`p-2 rounded-lg transition-colors ${
                currentPage === totalPages
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
