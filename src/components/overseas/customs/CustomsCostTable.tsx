"use client";

import { Edit, Trash2, ChevronLeft, ChevronRight, Ship, Plane, Package } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { CustomsCost, ShippingMethodType, SHIPPING_METHOD_LABELS } from "@/types/overseas";

interface CustomsCostTableProps {
  customsCosts: CustomsCost[];
  total: number;
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onEdit: (cost: CustomsCost) => void;
  onDelete: (cost: CustomsCost) => void;
  onAdd?: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("ko-KR").format(value);
};

const ShippingMethodIcon = ({ method }: { method: ShippingMethodType }) => {
  switch (method) {
    case "air":
      return <Plane size={14} className="text-blue-500" />;
    case "sea":
      return <Ship size={14} className="text-green-500" />;
    case "express":
      return <Package size={14} className="text-orange-500" />;
    default:
      return null;
  }
};

export default function CustomsCostTable({
  customsCosts,
  total,
  isLoading,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onPerPageChange,
  onEdit,
  onDelete,
  onAdd,
}: CustomsCostTableProps) {
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
        <div className="text-sm text-slate-500">
          총 <span className="font-semibold text-teal-600">{total}</span>건
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">표시:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
          >
            <option value="10">10개</option>
            <option value="20">20개</option>
            <option value="30">30개</option>
            <option value="50">50개</option>
          </select>
        </div>
      </div>

      {/* Customs Cost Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-500">통관비용을 불러오는 중...</p>
          </div>
        ) : customsCosts && customsCosts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                    통관일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                    거래처
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">
                    운송
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 hidden md:table-cell">
                    관세
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 hidden lg:table-cell">
                    소계
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    합계
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden xl:table-cell">
                    포워더
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customsCosts.map((cost) => (
                  <tr
                    key={cost.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-slate-700">
                        {cost.clearance_date}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-800">
                        {cost.company_name || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-slate-700">
                        {cost.invoice_no || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-slate-100">
                        <ShippingMethodIcon method={cost.shipping_method} />
                        <span className="text-slate-600">{SHIPPING_METHOD_LABELS[cost.shipping_method]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right hidden md:table-cell">
                      <div className="text-sm text-slate-700">
                        {formatCurrency(cost.customs_duty)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right hidden lg:table-cell">
                      <div className="text-sm text-slate-700">
                        {formatCurrency(cost.subtotal)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-teal-600">
                        {formatCurrency(cost.total)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell">
                      <div className="text-sm text-slate-700 truncate max-w-[150px]">
                        {cost.forwarder || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(cost)}
                          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(cost)}
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
        ) : (
          <EmptyState
            type="document"
            onAction={onAdd}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
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
