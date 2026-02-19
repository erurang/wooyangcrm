"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Download,
  AlertTriangle,
  Package,
  PackageX,
  TrendingDown,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

interface Product {
  id: string;
  internal_code: string | null;
  internal_name: string;
  spec: string | null;
  unit: string | null;
  current_stock: number;
  min_stock_alert: number | null;
  category: string | null;
  type: string;
  is_active: boolean;
  latest_purchase_price: number | null;
  latest_purchase_date: string | null;
  latest_purchase_company: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
}

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async (page = pagination.page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        lowStock: lowStockOnly.toString(),
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (typeFilter !== "all") {
        params.set("type", typeFilter);
      }

      const res = await fetch(`/api/products/stocks?${params}`);
      const data = await res.json();

      if (res.ok) {
        setProducts(data.products);
        setStats(data.stats);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error("재고 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [lowStockOnly, sortBy, sortOrder, typeFilter]);

  // 검색은 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return "↕";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  const getStockStatus = (product: Product) => {
    if (product.current_stock <= 0) {
      return { label: "품절", color: "bg-red-100 text-red-800", icon: PackageX };
    }
    if (
      product.min_stock_alert &&
      product.current_stock < product.min_stock_alert
    ) {
      return {
        label: "부족",
        color: "bg-yellow-100 text-yellow-800",
        icon: TrendingDown,
      };
    }
    return { label: "정상", color: "bg-green-100 text-green-800", icon: Package };
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "finished":
        return "완제품";
      case "raw_material":
        return "원자재";
      case "purchased":
        return "구매품";
      default:
        return type;
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("ko-KR");
  };

  // 엑셀 다운로드
  const handleExportExcel = () => {
    const headers = [
      "코드",
      "제품명",
      "규격",
      "유형",
      "단위",
      "현재재고",
      "최소재고",
      "최근매입가",
      "매입처",
      "재고가치(원가)",
      "상태",
    ];
    const rows = products.map((product) => {
      const stockValue =
        (product.current_stock || 0) * (product.latest_purchase_price || 0);
      const status = getStockStatus(product);
      return [
        product.internal_code || "",
        product.internal_name,
        product.spec || "",
        getTypeLabel(product.type),
        product.unit || "",
        product.current_stock,
        product.min_stock_alert || "",
        product.latest_purchase_price || "",
        product.latest_purchase_company || "",
        stockValue,
        status.label,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `재고현황_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchData(newPage);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination((prev) => ({ ...prev, limit: newLimit }));
    setTimeout(() => fetchData(1), 0);
  };

  // 페이지 번호 배열 생성
  const getPageNumbers = () => {
    const { page, totalPages } = pagination;
    const pages: number[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push(-1); // ...

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (page < totalPages - 2) pages.push(-1); // ...
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-sm text-[#37352F] p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-700">재고 현황</h1>
          {pagination.total > 0 && (
            <p className="text-xs text-slate-400 mt-0.5">
              전체 {formatNumber(pagination.total)}개 제품
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-500 bg-white border rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            새로고침
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            엑셀
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Package className="w-4 h-4" />
              전체 제품
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatNumber(stats.totalProducts)}
              <span className="text-sm font-normal text-slate-400 ml-1">
                개
              </span>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 border-yellow-200">
            <div className="flex items-center gap-2 text-yellow-600 text-xs">
              <AlertTriangle className="w-4 h-4" />
              재고 부족
            </div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {stats.lowStockCount}
              <span className="text-sm font-normal ml-1">개</span>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 border-red-200">
            <div className="flex items-center gap-2 text-red-600 text-xs">
              <PackageX className="w-4 h-4" />
              품절
            </div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {formatNumber(stats.outOfStockCount)}
              <span className="text-sm font-normal ml-1">개</span>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 border-sky-200">
            <div className="flex items-center gap-2 text-sky-600 text-xs">
              <DollarSign className="w-4 h-4" />
              재고 원가 총액
            </div>
            <div className="text-2xl font-bold text-sky-700 mt-1">
              {formatNumber(stats.totalValue)}
              <span className="text-sm font-normal ml-1">원</span>
            </div>
          </div>
        </div>
      )}

      {/* 검색 및 필터 영역 */}
      <div className="bg-white rounded-xl border px-4 py-3 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="제품명, 코드, 규격으로 검색"
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="all">전체 유형</option>
            <option value="finished">완제품</option>
            <option value="raw_material">원자재</option>
            <option value="purchased">구매품</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span className="text-yellow-600 font-medium text-xs">
              재고부족만
            </span>
          </label>

          <button
            onClick={() => {
              setSearchTerm("");
              setLowStockOnly(false);
              setTypeFilter("all");
              setSortBy("name");
              setSortOrder("asc");
            }}
            className="px-3 py-2 text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-xs"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th
                  className="px-4 py-3 border-b text-left cursor-pointer hover:bg-slate-100 whitespace-nowrap text-xs font-semibold text-slate-500"
                  onClick={() => handleSort("code")}
                >
                  코드 {getSortIcon("code")}
                </th>
                <th
                  className="px-4 py-3 border-b text-left cursor-pointer hover:bg-slate-100 whitespace-nowrap text-xs font-semibold text-slate-500"
                  onClick={() => handleSort("name")}
                >
                  제품명 {getSortIcon("name")}
                </th>
                <th className="px-4 py-3 border-b text-left whitespace-nowrap text-xs font-semibold text-slate-500">
                  규격
                </th>
                <th className="px-4 py-3 border-b text-center whitespace-nowrap text-xs font-semibold text-slate-500">
                  단위
                </th>
                <th className="px-4 py-3 border-b text-center whitespace-nowrap text-xs font-semibold text-slate-500">
                  유형
                </th>
                <th
                  className="px-4 py-3 border-b text-right cursor-pointer hover:bg-slate-100 whitespace-nowrap text-xs font-semibold text-slate-500"
                  onClick={() => handleSort("stock")}
                >
                  현재재고 {getSortIcon("stock")}
                </th>
                <th className="px-4 py-3 border-b text-right whitespace-nowrap text-xs font-semibold text-slate-500">
                  최소재고
                </th>
                <th className="px-4 py-3 border-b text-right whitespace-nowrap text-xs font-semibold text-slate-500">
                  최근매입가
                </th>
                <th className="px-4 py-3 border-b text-right whitespace-nowrap text-xs font-semibold text-slate-500">
                  재고원가
                </th>
                <th className="px-4 py-3 border-b text-center whitespace-nowrap text-xs font-semibold text-slate-500">
                  상태
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      로딩 중...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    {searchTerm
                      ? `"${searchTerm}" 검색 결과가 없습니다.`
                      : "등록된 제품이 없습니다."}
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const status = getStockStatus(product);
                  const stockValue =
                    (product.current_stock || 0) *
                    (product.latest_purchase_price || 0);
                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 border-b last:border-b-0 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                        {product.internal_code || "-"}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {product.internal_name}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                        {product.spec || (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded text-xs font-medium">
                          {product.unit || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                          {getTypeLabel(product.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {formatNumber(product.current_stock)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 tabular-nums">
                        {product.min_stock_alert
                          ? formatNumber(product.min_stock_alert)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {product.latest_purchase_price ? (
                          <div>
                            <div className="font-medium tabular-nums">
                              {formatNumber(product.latest_purchase_price)}원
                            </div>
                            {product.latest_purchase_company && (
                              <div className="text-xs text-slate-400 truncate max-w-[120px]">
                                {product.latest_purchase_company}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-sky-600 tabular-nums">
                        {stockValue > 0
                          ? `${formatNumber(stockValue)}원`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {!loading && pagination.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-t">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                {formatNumber((pagination.page - 1) * pagination.limit + 1)}-
                {formatNumber(
                  Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )
                )}
                / {formatNumber(pagination.total)}개
              </span>
              <select
                value={pagination.limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="px-2 py-1 border border-slate-200 rounded text-xs bg-white"
              >
                <option value={20}>20개</option>
                <option value={50}>50개</option>
                <option value={100}>100개</option>
                <option value={200}>200개</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers().map((pageNum, i) =>
                pageNum === -1 ? (
                  <span
                    key={`dots-${i}`}
                    className="px-1.5 text-slate-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors ${
                      pageNum === pagination.page
                        ? "bg-sky-600 text-white"
                        : "hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              )}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
