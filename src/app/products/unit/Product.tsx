"use client";

import { useMemo, useState, useEffect } from "react";
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, List, LayoutGrid } from "lucide-react";
import { useProductsList } from "@/hooks/products/useProductsList";
import { useProductsGrouped } from "@/hooks/products/useProductsGrouped";
import { useDebounce } from "@/hooks/useDebounce";
import { useUsersList } from "@/hooks/useUserList";
import { useLoginUser } from "@/context/login";
import {
  ProductSearchFilter,
  ProductTable,
  ProductGroupedTable,
  ProductDocumentModal,
} from "@/components/products/unit";
import Pagination from "@/components/ui/Pagination";

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

  // 뷰 모드 상태 (list: 목록, grouped: 그룹핑) - 기본값: 그룹핑
  const [viewMode, setViewMode] = useState<"list" | "grouped">("grouped");

  // 검색 필터 상태
  const [searchCompany, setSearchCompany] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [searchSpec, setSearchSpec] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [status, setStatus] = useState("all");

  // 문서 모달 상태
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  // 페이징 및 정렬 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // 디바운스
  const debounceSearchCompany = useDebounce(searchCompany, 300);
  const debounceSearchProduct = useDebounce(searchProduct, 300);
  const debounceSearchSpec = useDebounce(searchSpec, 300);
  const debounceMinPrice = useDebounce(minPrice, 300);
  const debounceMaxPrice = useDebounce(maxPrice, 300);

  // SWR hooks
  const { users } = useUsersList();

  // 목록 뷰 데이터
  const { products, total, isLoading } = useProductsList({
    type,
    userId:
      user?.role === "admin" || user?.role === "managementSupport"
        ? selectedUser?.id || ""
        : (user?.id as string),
    companyName: debounceSearchCompany,
    searchProduct: debounceSearchProduct,
    searchSpec: debounceSearchSpec,
    minPrice: debounceMinPrice,
    maxPrice: debounceMaxPrice,
    status,
    page: currentPage,
    limit: productsPerPage,
  });

  // 그룹핑 뷰 데이터
  const {
    products: groupedProducts,
    total: groupedTotal,
    isLoading: isGroupedLoading,
  } = useProductsGrouped({
    type,
    userId:
      user?.role === "admin" || user?.role === "managementSupport"
        ? selectedUser?.id || ""
        : (user?.id as string),
    companyName: debounceSearchCompany,
    searchProduct: debounceSearchProduct,
    searchSpec: debounceSearchSpec,
    minPrice: debounceMinPrice,
    maxPrice: debounceMaxPrice,
    status,
    page: currentPage,
    limit: 5,
  });

  const totalPages = viewMode === "list"
    ? Math.ceil(total / productsPerPage)
    : Math.ceil(groupedTotal / 5);

  // URL 파라미터 관리
  const updateUrlParams = (params: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === "") {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
    if (!url.searchParams.has("type") && type) {
      url.searchParams.set("type", type);
    }
    router.replace(url.pathname + url.search, { scroll: false });
  };

  // URL에서 상태 초기화
  useEffect(() => {
    const searchCompanyParam = searchParams.get("company") || "";
    const searchProductParam = searchParams.get("product") || "";
    const searchSpecParam = searchParams.get("spec") || "";
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const statusParam = searchParams.get("status") || "all";
    const pageParam = searchParams.get("page");
    const perPageParam = searchParams.get("perPage");
    const sortFieldParam = searchParams.get("sortField") || null;
    const sortDirParam = (searchParams.get("sortDir") as "asc" | "desc") || "asc";

    if (searchCompanyParam) setSearchCompany(searchCompanyParam);
    if (searchProductParam) setSearchProduct(searchProductParam);
    if (searchSpecParam) setSearchSpec(searchSpecParam);
    if (minPriceParam) setMinPrice(Number(minPriceParam));
    if (maxPriceParam) setMaxPrice(Number(maxPriceParam));
    if (statusParam) setStatus(statusParam);
    if (pageParam) setCurrentPage(Number(pageParam));
    if (perPageParam) setProductsPerPage(Number(perPageParam));
    if (sortFieldParam) setSortField(sortFieldParam);
    if (sortDirParam) setSortDirection(sortDirParam);
  }, [searchParams]);

  // 사용자 데이터 로드 후 selectedUser 설정
  useEffect(() => {
    const userIdParam = searchParams.get("userId");
    if (userIdParam && users && users.length > 0) {
      const foundUser = users.find((u: User) => u.id === userIdParam);
      if (foundUser) setSelectedUser(foundUser);
    }
  }, [users, searchParams]);

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

  // 핸들러 함수들
  const handleSort = (field: string) => {
    let direction: "asc" | "desc";
    if (sortField === field) {
      direction = sortDirection === "asc" ? "desc" : "asc";
      setSortDirection(direction);
    } else {
      setSortField(field);
      direction = "asc";
      setSortDirection("asc");
    }
    setCurrentPage(1);
    updateUrlParams({ sortField: field, sortDir: direction, page: "1" });
  };

  const resetFilters = () => {
    setSearchCompany("");
    setSearchProduct("");
    setSearchSpec("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedUser(null);
    setStatus("all");
    setCurrentPage(1);
    setSortField(null);
    setSortDirection("asc");

    const url = new URL(window.location.href);
    Array.from(url.searchParams.keys()).forEach((key) => {
      if (key !== "type") url.searchParams.delete(key);
    });
    router.replace(url.pathname + url.search, { scroll: false });
  };

  const handleSearchCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchCompany(e.target.value);
    setCurrentPage(1);
    updateUrlParams({ company: e.target.value || null, page: "1" });
  };

  const handleSearchProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchProduct(e.target.value);
    setCurrentPage(1);
    updateUrlParams({ product: e.target.value || null, page: "1" });
  };

  const handleSearchSpecChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchSpec(e.target.value);
    setCurrentPage(1);
    updateUrlParams({ spec: e.target.value || null, page: "1" });
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value) || "";
    setMinPrice(value);
    setCurrentPage(1);
    updateUrlParams({ minPrice: value ? String(value) : null, page: "1" });
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value) || "";
    setMaxPrice(value);
    setCurrentPage(1);
    updateUrlParams({ maxPrice: value ? String(value) : null, page: "1" });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setCurrentPage(1);
    updateUrlParams({ status: e.target.value === "all" ? null : e.target.value, page: "1" });
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    const foundUser = users.find((u: User) => u.id === userId) || null;
    setSelectedUser(foundUser);
    setCurrentPage(1);
    updateUrlParams({ userId: userId || null, page: "1" });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlParams({ page: String(page) });
  };

  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProductsPerPage(Number(e.target.value));
    setCurrentPage(1);
    updateUrlParams({ perPage: e.target.value, page: "1" });
  };

  return (
    <div className="">
      <ProductSearchFilter
        searchCompany={searchCompany}
        searchProduct={searchProduct}
        searchSpec={searchSpec}
        minPrice={minPrice}
        maxPrice={maxPrice}
        status={status}
        selectedUser={selectedUser}
        users={users || []}
        userRole={user?.role}
        onSearchCompanyChange={handleSearchCompanyChange}
        onSearchProductChange={handleSearchProductChange}
        onSearchSpecChange={handleSearchSpecChange}
        onMinPriceChange={handleMinPriceChange}
        onMaxPriceChange={handleMaxPriceChange}
        onStatusChange={handleStatusChange}
        onUserChange={handleUserChange}
      />

      {/* 테이블 컨트롤 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-slate-600">
          총 <span className="font-semibold text-blue-600">{viewMode === "list" ? total : groupedTotal}</span>
          {viewMode === "list" ? "개의 물품" : "개의 품목 그룹"}
        </div>
        <div className="flex items-center space-x-3">
          {/* 뷰 모드 토글 */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => {
                setViewMode("list");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === "list"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <List size={14} />
              목록
            </button>
            <button
              onClick={() => {
                setViewMode("grouped");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === "grouped"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              title="동일 품목별 단가 비교 및 추이 분석"
            >
              <LayoutGrid size={14} />
              그룹핑
            </button>
          </div>

          <button
            onClick={resetFilters}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm flex items-center transition-colors"
          >
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            필터 초기화
          </button>
          {viewMode === "list" && (
            <div className="flex items-center">
              <label className="mr-2 text-sm text-slate-600">표시 개수:</label>
              <select
                value={productsPerPage}
                onChange={handlePerPageChange}
                className="border border-slate-200 p-1.5 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="10">10개</option>
                <option value="20">20개</option>
                <option value="30">30개</option>
                <option value="50">50개</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 목록 뷰 */}
      {viewMode === "list" && (
        <>
          <ProductTable
            products={sortedProducts}
            isLoading={isLoading}
            type={type}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onDocumentClick={setSelectedDocumentId}
          />

          {!isLoading && sortedProducts.length > 0 && (
            <div className="flex justify-center mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      {/* 그룹핑 뷰 */}
      {viewMode === "grouped" && (
        <>
          <ProductGroupedTable
            products={groupedProducts}
            isLoading={isGroupedLoading}
            type={type}
            onDocumentClick={setSelectedDocumentId}
          />

          {!isGroupedLoading && groupedProducts.length > 0 && (
            <div className="flex justify-center mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      {/* 문서 상세 모달 */}
      <ProductDocumentModal
        documentId={selectedDocumentId}
        type={type}
        onClose={() => setSelectedDocumentId(null)}
      />
    </div>
  );
}
