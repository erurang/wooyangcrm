"use client";

import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface Product {
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
}

export default function ProductTable({
  products,
  isLoading,
  type,
  sortField,
  sortDirection,
  onSort,
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
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer ${className}`}
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
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
          <Clock className="h-3.5 w-3.5 mr-1" />
          진행중
        </span>
      );
    }
    if (status === "completed") {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          <CheckCircle className="h-3.5 w-3.5 mr-1" />
          완료
        </span>
      );
    }
    if (status === "canceled") {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
          <XCircle className="h-3.5 w-3.5 mr-1" />
          취소
        </span>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="text-center p-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">검색 결과가 없습니다</p>
          <p className="mt-1">
            검색 조건을 변경하거나 필터를 초기화해 보세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                  {dayjs(product.estimate_date).format("YYYY-MM-DD")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                  <button
                    onClick={() =>
                      router.push(`/consultations/${product.company_id}`)
                    }
                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    {product.company_name}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.spec}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {product.unit_price.toLocaleString()} 원
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
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
