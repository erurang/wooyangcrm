"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package,
  Ruler,
  DollarSign,
  Users,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Building,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useProductsList } from "@/hooks/products/useProductsList";
import { useDebounce } from "@/hooks/useDebounce";
import { useUsersList } from "@/hooks/useUserList";
import { useCompanySearch } from "@/hooks/manage/contacts/useCompanySearch";
import { useLoginUser } from "@/context/login";

interface User {
  id: string;
  name: string;
  level: string;
}

export default function ProductPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useLoginUser();
  const type = searchParams.get("type") as "estimate" | "order";

  const [searchCompany, setSearchCompany] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [searchSpec, setSearchSpec] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [status, setStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);

  const debounceSearchCompany = useDebounce(searchCompany, 300);
  const debounceSearchProduct = useDebounce(searchProduct, 300);
  const debounceSearchSpec = useDebounce(searchSpec, 300);
  const debounceMinPrice = useDebounce(minPrice, 300);
  const debounceMaxPrice = useDebounce(maxPrice, 300);

  const { companies } = useCompanySearch(debounceSearchCompany);
  const companyIds = companies.map((company: any) => company.id);
  const debounceCompanyIds = useDebounce(companyIds, 300);

  // swr
  const { users } = useUsersList();
  const { products, total, isLoading, mutate } = useProductsList({
    type,
    userId:
      user?.role === "admin" || user?.role === "managementSupport"
        ? selectedUser?.id || ""
        : (user?.id as string),
    companyIds: debounceCompanyIds,
    searchProduct: debounceSearchProduct,
    searchSpec: debounceSearchSpec,
    minPrice: debounceMinPrice,
    maxPrice: debounceMaxPrice,
    status,
    page: currentPage,
    limit: productsPerPage,
  });

  const totalPages = Math.ceil(total / productsPerPage);

  const paginationNumbers = () => {
    const pageNumbers = [];
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

  // 정렬 상태
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  }

  // 정렬된 products
  const sortedProducts = useMemo(() => {
    if (!products) return [];
    if (!sortField) return products;

    return [...products].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      if (sortField === "estimate_date") {
        valA = dayjs(a.estimate_date).valueOf();
        valB = dayjs(b.estimate_date).valueOf();
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      valA = valA?.toString() || "";
      valB = valB?.toString() || "";
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, sortField, sortDirection]);

  // 필터 초기화 함수
  const resetFilters = () => {
    setSearchCompany("");
    setSearchProduct("");
    setSearchSpec("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedUser(null);
    setStatus("all");
    setCurrentPage(1);
  };

  return (
    <div className="">
      {/* 검색 필터 */}
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
                  onChange={(e) => {
                    setSearchCompany(e.target.value);
                    setCurrentPage(1);
                  }}
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
                  onChange={(e) => {
                    setSearchProduct(e.target.value);
                    setCurrentPage(1);
                  }}
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
                  onChange={(e) => {
                    setSearchSpec(e.target.value);
                    setCurrentPage(1);
                  }}
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
                    onChange={(e) => {
                      setMinPrice(Number(e.target.value) || "");
                      setCurrentPage(1);
                    }}
                    placeholder="최소"
                    className="pl-10 pr-2 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <span className="self-center text-gray-500">~</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(Number(e.target.value) || "");
                      setCurrentPage(1);
                    }}
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
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setCurrentPage(1);
                  }}
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
            {(user?.role === "admin" || user?.role === "managementSupport") && (
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
                    onChange={(e) => {
                      const user =
                        users.find(
                          (user: User) => user.id === e.target.value
                        ) || null;
                      setSelectedUser(user);
                      setCurrentPage(1);
                    }}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                  >
                    <option value="">모든 상담자</option>
                    {users.map((u: any) => (
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

      {/* 테이블 컨트롤 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          총 <span className="font-semibold">{total}</span>개의 물품
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm flex items-center transition-colors"
          >
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            필터 초기화
          </button>
          <div className="flex items-center">
            <label className="mr-2 text-sm text-gray-600">표시 개수:</label>
            <select
              value={productsPerPage}
              onChange={(e) => {
                setProductsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 p-1.5 rounded-md text-sm"
            >
              <option value="10">10개</option>
              <option value="20">20개</option>
              <option value="30">30개</option>
              <option value="50">50개</option>
            </select>
          </div>
        </div>
      </div>

      {/* 물품 목록 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center p-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">검색 결과가 없습니다</p>
            <p className="mt-1">
              검색 조건을 변경하거나 필터를 초기화해 보세요.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* 날짜 */}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                    onClick={() => handleSort("estimate_date")}
                  >
                    <div className="flex items-center">
                      <span>{type === "estimate" ? "견적" : "발주"} 날짜</span>
                      {sortField === "estimate_date" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>

                  {/* 거래처명 */}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                    onClick={() => handleSort("company_name")}
                  >
                    <div className="flex items-center">
                      <span>거래처명</span>
                      {sortField === "company_name" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>

                  {/* 물품명 */}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      <span>물품명</span>
                      {sortField === "name" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>

                  {/* 규격 */}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("spec")}
                  >
                    <div className="flex items-center">
                      <span>규격</span>
                      {sortField === "spec" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>

                  {/* 수량 */}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("quantity")}
                  >
                    <div className="flex items-center">
                      <span>수량</span>
                      {sortField === "quantity" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>

                  {/* 단가 */}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("unit_price")}
                  >
                    <div className="flex items-center">
                      <span>단가</span>
                      {sortField === "unit_price" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>

                  {/* 담당자 */}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                    onClick={() => handleSort("user_name")}
                  >
                    <div className="flex items-center">
                      <span>담당</span>
                      {sortField === "user_name" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>

                  {/* 상태 */}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      <span>상태</span>
                      {sortField === "status" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProducts.map((product: any, index: number) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* 날짜 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {dayjs(product.estimate_date).format("YYYY-MM-DD")}
                    </td>

                    {/* 거래처명 */}
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

                    {/* 물품명 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.name}
                    </td>

                    {/* 규격 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.spec}
                    </td>

                    {/* 수량 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.quantity}
                    </td>

                    {/* 단가 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {product.unit_price.toLocaleString()} 원
                    </td>

                    {/* 담당자 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {product.user_name} {product.user_level}
                    </td>

                    {/* 상태 */}
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="flex items-center">
                        {product.status === "pending" && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            진행중
                          </span>
                        )}
                        {product.status === "completed" && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            완료
                          </span>
                        )}
                        {product.status === "canceled" && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            취소
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {!isLoading && sortedProducts.length > 0 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              이전
            </button>

            {paginationNumbers().map((page, index) =>
              typeof page === "number" ? (
                <button
                  key={index}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === page
                      ? "bg-blue-600 text-white font-medium"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span key={index} className="px-2 text-gray-500">
                  ...
                </span>
              )
            )}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              다음
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
