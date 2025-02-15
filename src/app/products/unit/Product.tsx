"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { v4 } from "uuid";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

interface Product {
  id: string;
  estimate_date: string;
  company_name: string;
  name: string;
  spec: string;
  unit_price: number;
  quantity: number;
  status: string;
}

export default function ProductPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") as "estimate" | "order";

  const today = dayjs().format("YYYY-MM-DD");
  const fiveYearsAgo = dayjs().subtract(5, "year").format("YYYY-MM-DD");

  const [products, setProducts] = useState<Product[]>([]);
  const [currentProducts, setCurrentProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchCompany, setSearchCompany] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [searchSpec, setSearchSpec] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  const [startDate, setStartDate] = useState(fiveYearsAgo); // 시작 날짜
  const [endDate, setEndDate] = useState(today); // 종료 날짜

  const [status, setStatus] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, [type]);

  useEffect(() => {
    updateCurrentProducts();
  }, [products, currentPage]);

  const fetchProducts = async () => {
    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        company_name: searchCompany,
        product_name: searchProduct,
        specification: searchSpec,
        type,
        min_price: minPrice?.toString() || "",
        max_price: maxPrice?.toString() || "",
        start_date: startDate,
        end_date: endDate,
        status,
      });

      const response = await fetch(`/api/products?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch orders.");
      }

      setProducts(data.products || []);
      setTotalProducts(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentProducts = () => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    setCurrentProducts(products.slice(startIndex, endIndex));
  };

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  const paginationNumbers = () => {
    const maxButtons = 5;
    const pageNumbers = [];
    const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  const statusToKorean = (status: string) => {
    switch (status) {
      case "pending":
        return "진행 중";
      case "completed":
        return "완료됨";
      case "canceled":
        return "취소됨";
      case "backup":
        return "관리자백업";
      default:
        return status;
    }
  };

  return (
    <div className="text-sm text-[#37352F]">
      <h1 className="font-semibold mb-4">
        {type === "estimate" ? "견적" : "매입"} 단가 관리
      </h1>

      {/* 검색 필터 */}
      <div className="bg-[#FBFBFB] rounded-md border-[1px] px-4 py-4 mb-4">
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* 회사명 */}
          <div className="col-span-3 flex items-center">
            <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
              거래처명
            </label>
            <motion.input
              value={searchCompany}
              onChange={(e) => setSearchCompany(e.target.value)}
              placeholder="거래처명"
              className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>

          {/* 물품명 */}
          <div className="col-span-3 flex items-center">
            <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
              물품명
            </label>
            <motion.input
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              placeholder="물품명"
              className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>

          {/* 규격 */}
          <div className="col-span-3 flex items-center">
            <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
              규격
            </label>
            <motion.input
              value={searchSpec}
              onChange={(e) => setSearchSpec(e.target.value)}
              placeholder="규격"
              className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>

          {/* 단가 */}
          <div className="col-span-3 flex items-center">
            <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
              단가
            </label>
            <div className="w-3/4 flex space-x-2">
              <motion.input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value) || "")}
                placeholder="최소 단가"
                className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
                whileFocus={{
                  scale: 1.05,
                  boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                }}
              />
              <span className="self-center">~</span>
              <motion.input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value) || "")}
                placeholder="최대 단가"
                className="w-3/4 p-2 border border-gray-300 rounded-md"
                whileFocus={{
                  scale: 1.05,
                  boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                }}
              />
            </div>
          </div>

          {/* 기간 */}
          <div className="col-span-3 flex items-center">
            <label className="w-1/5 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
              기간
            </label>
            <div className="w-3/4 flex space-x-2">
              <motion.input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
                whileFocus={{
                  scale: 1.05,
                  boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                }}
              />
              <span className="self-center">~</span>
              <motion.input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-3/4 p-2 border border-gray-300 rounded-md"
                whileFocus={{
                  scale: 1.05,
                  boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                }}
              />
            </div>
          </div>

          {/* 상태 */}
          <div className="col-span-3 flex items-center">
            <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
              상태
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-3/4 p-2 border-r border-b border-t border-gray-300 rounded-r-md"
            >
              <option value="pending">진행 중</option>
              <option value="completed">완료됨</option>
              <option value="canceled">취소됨</option>
              <option value="backup">관리자백업</option>
            </select>
          </div>

          {/* 검색 버튼 */}
          <div className="col-span-3 flex justify-end items-center">
            <button
              onClick={() => {
                setCurrentPage(1);
                fetchProducts();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 물품 목록 */}
      {loading ? (
        <p>로딩 중...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 text-center">
                <th className="px-4 py-2 border-b">
                  {type === "estimate" ? "견적" : "발주"} 날짜
                </th>
                <th className="px-4 py-2 border-b">회사명</th>
                <th className="px-4 py-2 border-b">물품명</th>
                <th className="px-4 py-2 border-b">규격</th>
                <th className="px-4 py-2 border-b">수량</th>
                <th className="px-4 py-2 border-b">단가</th>
                <th className="px-4 py-2 border-b">상태</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts?.map((product) => (
                <tr className="hover:bg-gray-50 text-center" key={v4()}>
                  <td className="px-4 py-2 border-b">
                    {dayjs(product.estimate_date).format("YYYY-MM-DD")}
                  </td>
                  <td className="px-4 py-2 border-b">{product.company_name}</td>
                  <td className="px-4 py-2 border-b">{product.name}</td>
                  <td className="px-4 py-2 border-b">{product.spec}</td>
                  <td className="px-4 py-2 border-b">{product.quantity}</td>
                  <td className="px-4 py-2 border-b">
                    {product.unit_price.toLocaleString()} 원
                  </td>
                  <td className="px-4 py-2 border-b">
                    {statusToKorean(product.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 페이지네이션 */}
          <div className="flex justify-center mt-4 space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-200"
            >
              이전
            </button>

            {paginationNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded ${
                  page === currentPage
                    ? "bg-blue-500 text-white"
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
              className="px-4 py-2 bg-gray-50 text-gray-600 rounded"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
