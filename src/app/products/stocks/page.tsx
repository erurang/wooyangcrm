"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Download, AlertTriangle, Package, PackageX, TrendingDown, DollarSign } from "lucide-react";

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
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        lowStock: lowStockOnly.toString(),
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/products/stocks?${params}`);
      const data = await res.json();

      if (res.ok) {
        setProducts(data.products);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("재고 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lowStockOnly, sortBy, sortOrder]);

  // 검색은 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
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
    if (product.min_stock_alert && product.current_stock < product.min_stock_alert) {
      return { label: "부족", color: "bg-yellow-100 text-yellow-800", icon: TrendingDown };
    }
    return { label: "정상", color: "bg-green-100 text-green-800", icon: Package };
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "finished": return "완제품";
      case "material": return "원자재";
      case "wip": return "반제품";
      default: return type;
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("ko-KR");
  };

  // 타입 필터링
  const filteredProducts = typeFilter === "all"
    ? products
    : products.filter(p => p.type === typeFilter);

  // 엑셀 다운로드
  const handleExportExcel = () => {
    const headers = ["코드", "제품명", "규격", "유형", "단위", "현재재고", "최소재고", "최근매입가", "매입처", "재고가치(원가)", "상태"];
    const rows = filteredProducts.map(product => {
      const stockValue = (product.current_stock || 0) * (product.latest_purchase_price || 0);
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
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `재고현황_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-sm text-[#37352F] p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-700">재고 현황</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-500 bg-white border rounded-md hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            엑셀 다운로드
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Package className="w-4 h-4" />
              전체 제품
            </div>
            <div className="text-2xl font-bold mt-1">{stats.totalProducts}개</div>
          </div>
          <div className="bg-white rounded-lg border p-4 border-yellow-200">
            <div className="flex items-center gap-2 text-yellow-600 text-xs">
              <AlertTriangle className="w-4 h-4" />
              재고 부족
            </div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {stats.lowStockCount}개
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4 border-red-200">
            <div className="flex items-center gap-2 text-red-600 text-xs">
              <PackageX className="w-4 h-4" />
              품절
            </div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {stats.outOfStockCount}개
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4 border-sky-200">
            <div className="flex items-center gap-2 text-sky-600 text-xs">
              <DollarSign className="w-4 h-4" />
              재고 원가 총액
            </div>
            <div className="text-2xl font-bold text-sky-700 mt-1">
              {formatNumber(stats.totalValue)}원
            </div>
          </div>
        </div>
      )}

      {/* 검색 및 필터 영역 */}
      <div className="bg-white rounded-lg border px-4 py-4 mb-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center flex-1 min-w-[200px]">
            <label className="p-2 border border-slate-300 rounded-l min-w-[80px] bg-slate-50 text-center">
              제품검색
            </label>
            <motion.input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="제품명 또는 코드로 검색"
              className="p-2 border-t border-b border-r border-slate-300 rounded-r w-full"
              whileFocus={{
                scale: 1.02,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-2 border border-slate-300 rounded-md"
          >
            <option value="all">전체 유형</option>
            <option value="finished">완제품</option>
            <option value="material">원자재</option>
            <option value="wip">반제품</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-yellow-600"
            />
            <span className="text-yellow-600 font-medium">재고부족만</span>
          </label>

          <button
            onClick={() => {
              setSearchTerm("");
              setLowStockOnly(false);
              setTypeFilter("all");
              setSortBy("name");
              setSortOrder("asc");
            }}
            className="px-4 py-2 bg-slate-500 text-white rounded-md hover:bg-slate-600"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th
                  className="px-4 py-3 border-b text-left cursor-pointer hover:bg-slate-200 whitespace-nowrap"
                  onClick={() => handleSort("code")}
                >
                  코드 {getSortIcon("code")}
                </th>
                <th
                  className="px-4 py-3 border-b text-left cursor-pointer hover:bg-slate-200 whitespace-nowrap"
                  onClick={() => handleSort("name")}
                >
                  제품명 {getSortIcon("name")}
                </th>
                <th className="px-4 py-3 border-b text-left whitespace-nowrap">규격</th>
                <th className="px-4 py-3 border-b text-center whitespace-nowrap">유형</th>
                <th className="px-4 py-3 border-b text-center whitespace-nowrap">단위</th>
                <th
                  className="px-4 py-3 border-b text-right cursor-pointer hover:bg-slate-200 whitespace-nowrap"
                  onClick={() => handleSort("stock")}
                >
                  현재재고 {getSortIcon("stock")}
                </th>
                <th className="px-4 py-3 border-b text-right whitespace-nowrap">최소재고</th>
                <th className="px-4 py-3 border-b text-right whitespace-nowrap">최근매입가</th>
                <th className="px-4 py-3 border-b text-right whitespace-nowrap">재고원가</th>
                <th className="px-4 py-3 border-b text-center whitespace-nowrap">상태</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      로딩 중...
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    등록된 제품이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const status = getStockStatus(product);
                  const stockValue = (product.current_stock || 0) * (product.latest_purchase_price || 0);
                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50 border-b last:border-b-0"
                    >
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                        {product.internal_code || "-"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {product.internal_name}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {product.spec || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                          {getTypeLabel(product.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">
                        {product.unit || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatNumber(product.current_stock)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">
                        {product.min_stock_alert
                          ? formatNumber(product.min_stock_alert)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {product.latest_purchase_price ? (
                          <div>
                            <div className="font-medium">
                              {formatNumber(product.latest_purchase_price)}원
                            </div>
                            {product.latest_purchase_company && (
                              <div className="text-xs text-slate-400">
                                {product.latest_purchase_company}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-sky-600">
                        {stockValue > 0 ? `${formatNumber(stockValue)}원` : "-"}
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

        {/* 테이블 푸터 */}
        {!loading && filteredProducts.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t text-sm text-slate-400">
            총 {filteredProducts.length}개 제품
            {typeFilter !== "all" && ` (${getTypeLabel(typeFilter)})`}
          </div>
        )}
      </div>

      {/* 하단 안내 */}
      <div className="mt-4 text-xs text-slate-400">
        * 최근매입가: product_price_history 테이블의 최신 매입(purchase) 단가 | 재고원가 = 현재재고 × 최근매입가
      </div>
    </div>
  );
}
