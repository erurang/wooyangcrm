"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
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
        ? ""
        : (user?.id as string), // ✅ 사용자 필터 추가
    companyIds: debounceCompanyIds, // ✅ 회사 필터 추가
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
    let pageNumbers = [];
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

  // --- 추가: 정렬 상태 ---
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  function handleSort(field: string) {
    // 같은 컬럼 클릭 시 asc -> desc -> asc 토글
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      // 다른 컬럼 클릭 시 필드 변경 & 오름차순 초기화
      setSortField(field);
      setSortDirection("asc");
    }
    // 첫 페이지로 이동
    setCurrentPage(1);
  }

  // --- 정렬된 products ---
  const sortedProducts = useMemo(() => {
    if (!products) return [];
    if (!sortField) return products;

    return [...products].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // number/string 구분 or 커스텀 로직
      // 예: 'estimate_date' 는 날짜, 'unit_price' 는 number, 'company_name' 은 string 등
      // 여기선 단순 비교로 처리

      // number 비교
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      // 날짜 (dayjs 파싱)
      if (sortField === "estimate_date") {
        valA = dayjs(a.estimate_date).valueOf();
        valB = dayjs(b.estimate_date).valueOf();
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      // 기본 string 비교
      valA = valA?.toString() || "";
      valB = valB?.toString() || "";
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, sortField, sortDirection]);

  function renderSortIcon(field: string) {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? "▲" : "▼";
  }

  return (
    <div className="text-sm text-[#37352F]">
      {/* 검색 필터 */}
      <div className="bg-[#FBFBFB] rounded-md border px-4 py-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-center">
          {/* 회사명 */}
          <div className="flex items-center justify-center">
            <label className="p-2 border border-gray-300 rounded-l min-w-[60px]">
              거래처
            </label>
            <motion.input
              value={searchCompany}
              onChange={(e) => setSearchCompany(e.target.value)}
              placeholder="거래처명"
              className="p-2 border-r border-t border-b border-gray-300 rounded-r w-full"
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>

          {/* 물품명 */}
          <div className="flex items-center justify-center">
            <label className="p-2 border border-gray-300 rounded-l min-w-[60px]">
              물품명
            </label>
            <motion.input
              value={searchProduct}
              onChange={(e) => {
                setSearchProduct(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="물품명"
              className="p-2 border-r border-t border-b border-gray-300 rounded-r w-full"
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>

          {/* 규격 */}
          <div className="flex items-center justify-center">
            <label className="p-2 border border-gray-300 rounded-l min-w-[60px]">
              규격
            </label>
            <motion.input
              value={searchSpec}
              onChange={(e) => {
                setSearchSpec(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="규격"
              className="p-2 border-r border-t border-b border-gray-300 rounded-r w-full"
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>

          {/* 단가 */}
          <div className="flex items-center justify-center">
            <label className="p-2 border border-gray-300 rounded-l min-w-[60px]">
              단가
            </label>
            <div className="flex space-x-2">
              <motion.input
                type="number"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(Number(e.target.value) || "");
                  setCurrentPage(1);
                }}
                placeholder="최소 단가"
                className="p-2 border-r border-t border-b border-gray-300 rounded-r w-full"
                whileFocus={{
                  scale: 1.05,
                  boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                }}
              />
              <span className="self-center">~</span>
              <motion.input
                type="number"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(Number(e.target.value) || "");
                  setCurrentPage(1);
                }}
                placeholder="최대 단가"
                className="p-2 border border-gray-300 rounded-md w-full"
                whileFocus={{
                  scale: 1.05,
                  boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                }}
              />
            </div>
          </div>
          {/* 상담자 */}
          {(user?.role === "admin" || user?.role === "managementSupport") && (
            <div className="flex items-center justify-center">
              <label className="p-2 border border-gray-300 rounded-l min-w-[60px]">
                상담자
              </label>
              <motion.select
                className="p-2 border-r border-t border-b border-gray-300 rounded-r w-full h-full"
                value={selectedUser?.id || ""}
                onChange={(e) => {
                  const user =
                    users.find((user: User) => user.id === e.target.value) ||
                    null;
                  setSelectedUser(user);
                  setCurrentPage(1);
                }}
              >
                <option value="">전체</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.level}
                  </option>
                ))}
              </motion.select>
            </div>
          )}

          {/* 상태 */}
          <div className="flex items-center justify-center">
            <label className="p-2 border border-gray-300 rounded-l min-w-[60px]">
              상태
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="p-2 border-t border-b border-r border-gray-300 rounded-r w-full h-full"
            >
              <option value="all">전체</option>
              <option value="pending">진행 중</option>
              <option value="completed">완료됨</option>
              <option value="canceled">취소됨</option>
            </select>
          </div>
        </div>
      </div>

      {/* 물품 목록 */}
      <div className="flex justify-end items-center mb-4">
        <div className="flex items-center">
          <label className="mr-2 text-sm text-gray-600">표시 개수:</label>
          <select
            value={productsPerPage}
            onChange={(e) => {
              setProductsPerPage(Number(e.target.value));
              setCurrentPage(1); // ✅ 페이지 변경 시 첫 페이지로 이동
            }}
            className="border border-gray-300 p-2 rounded-md text-sm"
          >
            <option value="10">10개</option>
            <option value="20">20개</option>
            <option value="30">30개</option>
            <option value="50">50개</option>
          </select>
        </div>
      </div>
      <div className="bg-[#FBFBFB] rounded-md border">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-center">
              {/* 정렬 가능한 컬럼에 onClick 추가 */}
              {/* 예: 견적/발주 날짜 (estimate_date) */}
              <th
                onClick={() => handleSort("estimate_date")}
                className="px-4 py-2 border-b border-r hidden md:table-cell cursor-pointer select-none"
              >
                {type === "estimate" ? "견적" : "발주"} 날짜
                {/* 정렬 아이콘 표시 */}
                <span className="ml-1 text-xs">
                  {renderSortIcon("estimate_date")}
                </span>
              </th>

              {/* 거래처명 (company_name) */}
              <th
                onClick={() => handleSort("company_name")}
                className="px-4 py-2 border-b border-r hidden md:table-cell cursor-pointer select-none"
              >
                거래처명
                <span className="ml-1 text-xs">
                  {renderSortIcon("company_name")}
                </span>
              </th>

              {/* 물품명 (name) */}
              <th
                onClick={() => handleSort("name")}
                className="px-4 py-2 border-b border-r cursor-pointer select-none"
              >
                물품명
                <span className="ml-1 text-xs">{renderSortIcon("name")}</span>
              </th>

              {/* 규격 (spec) */}
              <th
                onClick={() => handleSort("spec")}
                className="px-4 py-2 border-b border-r cursor-pointer select-none"
              >
                규격
                <span className="ml-1 text-xs">{renderSortIcon("spec")}</span>
              </th>

              {/* 수량 (quantity) */}
              <th
                onClick={() => handleSort("quantity")}
                className="px-4 py-2 border-b border-r cursor-pointer select-none"
              >
                수량
                <span className="ml-1 text-xs">
                  {renderSortIcon("quantity")}
                </span>
              </th>

              {/* 단가 (unit_price) */}
              <th
                onClick={() => handleSort("unit_price")}
                className="px-4 py-2 border-b border-r cursor-pointer select-none"
              >
                단가
                <span className="ml-1 text-xs">
                  {renderSortIcon("unit_price")}
                </span>
              </th>

              {/* 담당자 (user_name) */}
              <th
                onClick={() => handleSort("user_name")}
                className="px-4 py-2 border-b border-r hidden md:table-cell cursor-pointer select-none"
              >
                담당
                <span className="ml-1 text-xs">
                  {renderSortIcon("user_name")}
                </span>
              </th>

              {/* 상태 (status) */}
              <th
                onClick={() => handleSort("status")}
                className="px-4 py-2 border-b border-r hidden md:table-cell cursor-pointer select-none"
              >
                상태
                <span className="ml-1 text-xs">{renderSortIcon("status")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* sortedProducts 를 사용 */}
            {sortedProducts?.map((product: any, index: any) => (
              <tr className="hover:bg-gray-50 text-center" key={index}>
                {/* 날짜 */}
                <td className="px-4 py-2 border-b border-r hidden md:table-cell">
                  {dayjs(product.estimate_date).format("YYYY-MM-DD")}
                </td>

                {/* 거래처명 */}
                <td
                  className="px-4 py-2 border-b border-r text-blue-500 cursor-pointer hidden md:table-cell"
                  onClick={() =>
                    router.push(`/consultations/${product.company_id}`)
                  }
                >
                  {product.company_name}
                </td>

                {/* 물품명 */}
                <td className="px-4 py-2 border-b border-r">{product.name}</td>

                {/* 규격 */}
                <td className="px-4 py-2 border-b border-r">{product.spec}</td>

                {/* 수량 */}
                <td className="px-4 py-2 border-b border-r">
                  {product.quantity}
                </td>

                {/* 단가 */}
                <td className="px-4 py-2 border-b border-r">
                  {product.unit_price.toLocaleString()} 원
                </td>

                {/* 담당자 */}
                <td className="px-4 py-2 border-b border-r hidden md:table-cell">
                  {product.user_name} {product.user_level}
                </td>

                {/* 상태 */}
                <td className="px-4 py-2 border-b cursor-pointer hidden md:table-cell">
                  {product.status === "pending" && "진행중"}
                  {product.status === "canceled" && "취소"}
                  {product.status === "completed" && "완료"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 페이지네이션 */}
      </div>
      <div className="flex justify-center mt-4 overflow-x-auto space-x-1 md:space-x-2">
        <div className="flex justify-center mt-4 space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
          >
            이전
          </button>

          {paginationNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(+page)}
              className={`px-3 py-1 border rounded ${
                currentPage === page
                  ? "bg-blue-500 text-white font-bold"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
