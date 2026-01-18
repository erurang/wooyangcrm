"use client";

import { CircularProgress } from "@mui/material";
import { Edit, Trash2, ChevronLeft, ChevronRight, Globe, ExternalLink, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";
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
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <Globe size={16} className="text-blue-500" />
          총 <span className="font-semibold text-blue-600">{total}</span>개
          해외 거래처
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">표시 개수:</label>
          <select
            value={companiesPerPage}
            onChange={(e) => {
              onPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="10">10개</option>
            <option value="20">20개</option>
            <option value="30">30개</option>
            <option value="50">50개</option>
          </select>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <CircularProgress size={40} />
          </div>
        ) : companies && companies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    거래처명
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                  >
                    담당자
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell"
                  >
                    이메일
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell"
                  >
                    홈페이지
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                        onClick={() =>
                          router.push(`/overseas/${company.id}`)
                        }
                      >
                        {company.name}
                      </div>
                      {company.address && (
                        <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                          {company.address}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      {company.contacts && company.contacts.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {company.contacts[0].name}
                            </div>
                            {company.contacts.length > 1 && (
                              <div className="text-xs text-gray-500">
                                외 {company.contacts.length - 1}명
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900">
                        {company.email || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      {company.website ? (
                        <a
                          href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={12} />
                          <span className="truncate max-w-[120px]">
                            {company.website.replace(/^https?:\/\//, "")}
                          </span>
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(company)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        >
                          <Edit size={14} />
                          수정
                        </button>
                        <button
                          onClick={() => onDelete(company)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={14} />
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            type={hasSearchQuery ? "search" : "company"}
            onAction={!hasSearchQuery && onAdd ? onAdd : undefined}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ChevronLeft size={18} />
            </button>

            {paginationNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === "number" && onPageChange(page)}
                className={`px-3 py-1.5 rounded-md ${
                  currentPage === page
                    ? "bg-blue-600 text-white font-medium"
                    : page === "..."
                    ? "text-gray-500 cursor-default"
                    : "text-gray-700 hover:bg-gray-100"
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
              className={`p-2 rounded-md ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
