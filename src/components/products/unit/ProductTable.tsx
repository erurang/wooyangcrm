"use client";

import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

interface Product {
  id: string;
  document_number: string;
  estimate_date: string;
  company_id: string;
  company_name: string;
  name: string;
  spec: string;
  quantity: string;
  unit_price: number;
  user_name: string;
  user_level: string;
  status: string;
}

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  type: "estimate" | "order";
  sortField: string | null;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  onDocumentClick?: (documentId: string) => void;
}

export default function ProductTable({
  products,
  isLoading,
  type,
  sortField,
  sortDirection,
  onSort,
  onDocumentClick,
}: ProductTableProps) {
  const router = useRouter();

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const SortableHeader = ({
    field,
    children,
    className = "",
  }: {
    field: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      scope="col"
      className={`px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center">
        <span>{children}</span>
        <span className="ml-1">
          <SortIcon field={field} />
        </span>
      </div>
    </th>
  );

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === "pending") {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-700">
          <Clock className="h-3.5 w-3.5 mr-1" />
          진행중
        </span>
      );
    }
    if (status === "completed") {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-700">
          <CheckCircle className="h-3.5 w-3.5 mr-1" />
          완료
        </span>
      );
    }
    if (status === "canceled") {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-700">
          <XCircle className="h-3.5 w-3.5 mr-1" />
          취소
        </span>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="flex flex-col justify-center items-center p-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 mt-3">물품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <EmptyState type="product" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      {/* 모바일: 카드 레이아웃 */}
      <div className="sm:hidden divide-y divide-slate-100">
        {products.map((product, index) => (
          <div key={index} className="p-3 active:bg-slate-50">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{product.name}</div>
                <div className="text-xs text-slate-500">{product.spec}</div>
              </div>
              <StatusBadge status={product.status} />
            </div>
            <div className="flex items-center justify-between text-xs mb-2">
              <button
                onClick={() => router.push(`/consultations/${product.company_id}`)}
                className="text-blue-600"
              >
                {product.company_name}
              </button>
              <span className="text-slate-500">{dayjs(product.estimate_date).format("YY.MM.DD")}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                {product.quantity} × {product.unit_price.toLocaleString()}원
              </div>
              <button
                onClick={() => onDocumentClick?.(product.id)}
                className="text-xs text-blue-600"
              >
                {product.document_number}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 데스크탑: 테이블 레이아웃 */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <SortableHeader field="document_number" className="hidden md:table-cell">
                문서번호
              </SortableHeader>
              <SortableHeader field="estimate_date" className="hidden md:table-cell">
                {type === "estimate" ? "견적" : "발주"} 날짜
              </SortableHeader>
              <SortableHeader field="company_name" className="hidden md:table-cell">
                거래처명
              </SortableHeader>
              <SortableHeader field="name">물품명</SortableHeader>
              <SortableHeader field="spec">규격</SortableHeader>
              <SortableHeader field="quantity">수량</SortableHeader>
              <SortableHeader field="unit_price">단가</SortableHeader>
              <SortableHeader field="user_name" className="hidden md:table-cell">
                담당
              </SortableHeader>
              <SortableHeader field="status" className="hidden md:table-cell">
                상태
              </SortableHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {products.map((product, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                  <button
                    onClick={() => onDocumentClick?.(product.id)}
                    className="text-blue-600 hover:text-blue-700 hover:underline transition-colors font-medium"
                  >
                    {product.document_number}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden md:table-cell">
                  {dayjs(product.estimate_date).format("YYYY-MM-DD")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                  <button
                    onClick={() =>
                      router.push(`/consultations/${product.company_id}`)
                    }
                    className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    {product.company_name}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {product.spec}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {product.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-medium">
                  {product.unit_price.toLocaleString()} 원
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden md:table-cell">
                  {product.user_name} {product.user_level}
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                  <StatusBadge status={product.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
