"use client";

import { Edit, Trash2, Phone, Building2, List, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import HeadlessSelect from "@/components/ui/HeadlessSelect";
import Pagination from "@/components/ui/Pagination";

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

const LAB_COMPANY_ID = "1ef367e7-2807-491a-8852-183b392fa3e7";

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
  const isDesktop = useIsDesktop();

  const filteredCompanies = companies.filter(c => c.id !== LAB_COMPANY_ID);

  return (
    <div className="p-3 sm:p-5">
      {/* Table Controls */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-xs font-medium text-slate-400 tabular-nums">
          <span className="text-slate-600">{currentPage}</span> / {totalPages} 페이지
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">표시:</span>
          <div className="min-w-[80px]">
            <HeadlessSelect
              value={String(companiesPerPage)}
              onChange={(value) => {
                onPerPageChange(Number(value));
                onPageChange(1);
              }}
              options={[
                { value: "10", label: "10개" },
                { value: "20", label: "20개" },
                { value: "30", label: "30개" },
                { value: "50", label: "50개" },
              ]}
              placeholder="20개"
              icon={<List className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      {/* Companies */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-sm text-slate-400">불러오는 중...</span>
          </div>
        ) : filteredCompanies && filteredCompanies.length > 0 ? (
          <>
            {/* 모바일: 카드 레이아웃 */}
            {!isDesktop && (
            <div className="divide-y divide-slate-100/80">
              {filteredCompanies.map((company: Company) => (
                <div
                  key={company.id}
                  className="p-3.5 active:bg-slate-50 transition-colors"
                  onClick={() => router.push(`/consultations/${company.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="p-2 bg-sky-50 rounded-xl shrink-0">
                        <Building2 className="h-4 w-4 text-sky-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-800 truncate">
                          {company.name}
                        </div>
                        {company.business_number && (
                          <div className="text-[11px] text-slate-400 tabular-nums">
                            {company.business_number}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(company);
                        }}
                        className="p-2 text-slate-300 hover:text-sky-600 hover:bg-sky-50 active:bg-sky-100 rounded-xl transition-all"
                        title="수정"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(company);
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 active:bg-red-100 rounded-xl transition-all"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {(company.phone || company.address) && (
                    <div className="mt-2 ml-[46px] space-y-1">
                      {company.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Phone className="h-3 w-3" />
                          {company.phone}
                        </div>
                      )}
                      {company.address && (
                        <div className="text-xs text-slate-400 truncate">
                          {company.address}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            )}

            {/* 데스크탑: 테이블 레이아웃 */}
            {isDesktop && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80">
                  <tr className="border-b border-slate-200/60">
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      거래처명
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                      주소
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                      전화번호
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                      팩스
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider w-28">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {filteredCompanies.map((company: Company) => (
                    <tr
                      key={company.id}
                      className="hover:bg-sky-50/30 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/consultations/${company.id}`)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-sky-50 rounded-lg group-hover:bg-sky-100 transition-colors">
                            <Building2 className="h-4 w-4 text-sky-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800 group-hover:text-sky-700 transition-colors">
                              {company.name}
                            </div>
                            {company.business_number && (
                              <div className="text-[11px] text-slate-400 tabular-nums">
                                {company.business_number}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="text-sm text-slate-500 truncate max-w-xs">
                          {company.address || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          {company.phone ? (
                            <>
                              <Phone className="h-3.5 w-3.5 text-slate-300" />
                              <span className="tabular-nums">{company.phone}</span>
                            </>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <div className="text-sm text-slate-500 tabular-nums">
                          {company.fax || <span className="text-slate-300">-</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(company);
                            }}
                            className="p-1.5 text-slate-300 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                            title="수정"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(company);
                            }}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
            )}
          </>
        ) : (
          <EmptyState
            type={hasSearchQuery ? "search" : "company"}
            onAction={!hasSearchQuery && onAdd ? onAdd : undefined}
          />
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-5 px-2 sm:px-0">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
