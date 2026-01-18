"use client";

import { CircularProgress } from "@mui/material";
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
        <div className="text-sm text-gray-600">
          총 <span className="font-semibold text-blue-600">{total}</span>건
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">표시 개수:</label>
          <select
            value={itemsPerPage}
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

      {/* Customs Cost Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <CircularProgress size={40} />
          </div>
        ) : customsCosts && customsCosts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    통관일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    거래처
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    운송
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    관세
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    소계
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    합계
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                    포워더
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customsCosts.map((cost) => (
                  <tr
                    key={cost.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {cost.clearance_date}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {cost.company_name || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {cost.invoice_no || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100">
                        <ShippingMethodIcon method={cost.shipping_method} />
                        <span>{SHIPPING_METHOD_LABELS[cost.shipping_method]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right hidden md:table-cell">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(cost.customs_duty)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right hidden lg:table-cell">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(cost.subtotal)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-blue-600">
                        {formatCurrency(cost.total)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap hidden xl:table-cell">
                      <div className="text-sm text-gray-900 truncate max-w-[150px]">
                        {cost.forwarder || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(cost)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        >
                          <Edit size={14} />
                          수정
                        </button>
                        <button
                          onClick={() => onDelete(cost)}
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
            type="document"
            onAction={onAdd}
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
