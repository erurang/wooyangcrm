"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Search,
  X,
  Plus,
  Scissors,
  Eye,
  Trash2,
  MapPin,
  Calendar,
  Building2,
  Hash,
  Loader2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Download,
  AlertTriangle,
  PackageX,
  TrendingDown,
  DollarSign,
  List,
  LayoutGrid,
} from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { useLots, useLotMutations } from "@/hooks/inventory/useLots";
import { useLoginUser } from "@/context/login";
import type {
  InventoryLotWithDetails,
  LotStatus,
  LotSourceType,
} from "@/types/inventory";
import {
  LOT_STATUS_LABELS,
  LOT_STATUS_COLORS,
  LOT_SOURCE_LABELS,
} from "@/types/inventory";
import LotSplitModal from "@/components/inventory/LotSplitModal";
import LotDetailModal from "@/components/inventory/LotDetailModal";
import LotCreateModal from "@/components/inventory/LotCreateModal";
import ErrorState from "@/components/ui/ErrorState";
import dayjs from "dayjs";

type ViewMode = "products" | "lots";

interface ProductSummary {
  id: string;
  internal_code: string | null;
  internal_name: string;
  unit: string | null;
  type: string;
  current_stock: number;
  min_stock_alert: number | null;
  latest_purchase_price: number | null;
  lots: InventoryLotWithDetails[];
  lot_count: number;
  available_quantity: number;
}

interface Stats {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
  totalLots: number;
  availableLots: number;
}

export default function InventoryLotsPage() {
  const loginUser = useLoginUser();

  // 뷰 모드: products (제품별 요약) | lots (LOT 상세)
  const [viewMode, setViewMode] = useState<ViewMode>("products");

  // 필터 상태
  const [statusFilter, setStatusFilter] = useState<LotStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  // 제품별 펼침 상태
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  // 모달 상태
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<InventoryLotWithDetails | null>(null);

  // 제품별 요약 데이터
  const [productSummaries, setProductSummaries] = useState<ProductSummary[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);

  // LOT 데이터 조회 (LOT 뷰용)
  const {
    lots,
    total,
    totalPages,
    isLoading: lotsLoading,
    isError,
    mutate: refreshLots,
  } = useLots({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery || undefined,
    page,
    limit: 20,
  });

  // 뮤테이션
  const { deleteLot, isDeleting } = useLotMutations();

  // 제품별 요약 데이터 조회
  const fetchProductSummaries = async () => {
    setProductsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (lowStockOnly) params.set("lowStock", "true");

      const res = await fetch(`/api/inventory/lots/summary?${params}`);
      const data = await res.json();

      if (res.ok) {
        setProductSummaries(data.products || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error("제품 요약 조회 오류:", error);
    } finally {
      setProductsLoading(false);
    }
  };

  // 검색 디바운스
  useEffect(() => {
    if (viewMode === "products") {
      const timer = setTimeout(() => {
        fetchProductSummaries();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, lowStockOnly, viewMode]);

  // 초기 로드
  useEffect(() => {
    if (viewMode === "products") {
      fetchProductSummaries();
    }
  }, [viewMode]);

  // 제품 펼치기/접기
  const toggleProduct = (productId: string) => {
    setExpandedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // 분할 모달 열기
  const handleOpenSplitModal = (lot: InventoryLotWithDetails) => {
    setSelectedLot(lot);
    setSplitModalOpen(true);
  };

  // 상세 모달 열기
  const handleOpenDetailModal = (lot: InventoryLotWithDetails) => {
    setSelectedLot(lot);
    setDetailModalOpen(true);
  };

  // LOT 폐기
  const handleDelete = async (lot: InventoryLotWithDetails) => {
    if (!confirm(`LOT ${lot.lot_number}을(를) 폐기하시겠습니까?`)) return;

    const result = await deleteLot(lot.id, loginUser?.id);
    if (result.success) {
      refreshLots();
      if (viewMode === "products") {
        fetchProductSummaries();
      }
    } else {
      alert(result.error || "폐기 처리 중 오류가 발생했습니다.");
    }
  };

  // 재고 상태
  const getStockStatus = (product: ProductSummary) => {
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

  const formatNumber = (num: number) => num.toLocaleString("ko-KR");

  // 필터링된 제품
  const filteredProducts = productSummaries.filter((p) => {
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    if (lowStockOnly) {
      if (p.min_stock_alert && p.current_stock >= p.min_stock_alert) return false;
      if (!p.min_stock_alert && p.current_stock > 0) return false;
    }
    return true;
  });

  // 엑셀 다운로드
  const handleExportExcel = () => {
    const headers = ["코드", "제품명", "유형", "단위", "현재재고", "LOT수", "최소재고", "상태"];
    const rows = filteredProducts.map((product) => {
      const status = getStockStatus(product);
      return [
        product.internal_code || "",
        product.internal_name,
        getTypeLabel(product.type),
        product.unit || "",
        product.current_stock,
        product.lot_count,
        product.min_stock_alert || "",
        status.label,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `재고현황_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // 로딩 상태
  const isLoading = viewMode === "products" ? productsLoading : lotsLoading;

  if (isLoading && (viewMode === "products" ? productSummaries.length === 0 : lots.length === 0)) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
        </div>
      </div>
    );
  }

  if (isError && viewMode === "lots") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <ErrorState
          type="server"
          title="재고 데이터를 불러올 수 없습니다"
          message="서버와의 연결에 문제가 발생했습니다."
          onRetry={refreshLots}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          {/* 통계 카드 */}
          {stats && viewMode === "products" && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <div className="bg-white rounded-lg border p-3">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Package className="w-4 h-4" />
                  전체 제품
                </div>
                <div className="text-2xl font-bold mt-1">{stats.totalProducts}개</div>
              </div>
              <div className="bg-white rounded-lg border p-3 border-sky-200">
                <div className="flex items-center gap-2 text-sky-600 text-xs">
                  <Hash className="w-4 h-4" />
                  전체 LOT
                </div>
                <div className="text-2xl font-bold text-sky-600 mt-1">{stats.totalLots}개</div>
              </div>
              <div className="bg-white rounded-lg border p-3 border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-600 text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  재고 부족
                </div>
                <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.lowStockCount}개</div>
              </div>
              <div className="bg-white rounded-lg border p-3 border-red-200">
                <div className="flex items-center gap-2 text-red-600 text-xs">
                  <PackageX className="w-4 h-4" />
                  품절
                </div>
                <div className="text-2xl font-bold text-red-600 mt-1">{stats.outOfStockCount}개</div>
              </div>
              <div className="bg-white rounded-lg border p-3 border-green-200">
                <div className="flex items-center gap-2 text-green-600 text-xs">
                  <DollarSign className="w-4 h-4" />
                  재고 원가
                </div>
                <div className="text-xl font-bold text-green-700 mt-1">
                  {formatNumber(stats.totalValue)}원
                </div>
              </div>
            </div>
          )}

          {/* LOT 뷰 상태 필터 */}
          {viewMode === "lots" && (
            <div className="grid grid-cols-6 gap-2 mb-4">
              <button
                onClick={() => { setStatusFilter("all"); setPage(1); }}
                className={`p-3 rounded-lg border transition-all text-left ${
                  statusFilter === "all"
                    ? "bg-slate-100 border-slate-300 ring-2 ring-slate-400"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="text-xs text-slate-500 font-medium mb-1">전체</div>
                <div className="text-2xl font-bold text-slate-800">{total}</div>
              </button>
              {(["available", "reserved", "split", "depleted", "scrapped"] as LotStatus[]).map((status) => {
                const colors: Record<LotStatus, string> = {
                  available: "green",
                  reserved: "yellow",
                  split: "blue",
                  depleted: "gray",
                  scrapped: "red",
                };
                const color = colors[status];
                return (
                  <button
                    key={status}
                    onClick={() => { setStatusFilter(status); setPage(1); }}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      statusFilter === status
                        ? `bg-${color}-50 border-${color}-300 ring-2 ring-${color}-400`
                        : `bg-${color}-50/50 border-${color}-100 hover:bg-${color}-50`
                    }`}
                  >
                    <div className={`text-xs text-${color}-600 font-medium mb-1`}>
                      {LOT_STATUS_LABELS[status]}
                    </div>
                    <div className={`text-2xl font-bold text-${color}-600`}>
                      {lots.filter((l) => l.status === status).length}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 검색 및 액션 */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-sky-600" />
              <h1 className="text-lg font-bold text-slate-800">재고 관리</h1>

              {/* 뷰 모드 토글 */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1 ml-4">
                <button
                  onClick={() => setViewMode("products")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === "products"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  제품별
                </button>
                <button
                  onClick={() => setViewMode("lots")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === "lots"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <List className="h-4 w-4" />
                  LOT별
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* 검색 */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={viewMode === "products" ? "제품명, 코드..." : "LOT번호, 제품명..."}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* 제품뷰 필터 */}
              {viewMode === "products" && (
                <>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="all">전체 유형</option>
                    <option value="finished">완제품</option>
                    <option value="material">원자재</option>
                    <option value="wip">반제품</option>
                  </select>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={lowStockOnly}
                      onChange={(e) => setLowStockOnly(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-yellow-600"
                    />
                    <span className="text-yellow-600 font-medium">부족만</span>
                  </label>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-white bg-green-600 rounded-lg hover:bg-green-700 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    엑셀
                  </button>
                </>
              )}

              {/* 새로고침 */}
              <button
                onClick={() => viewMode === "products" ? fetchProductSummaries() : refreshLots()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 bg-white border rounded-lg hover:bg-slate-50 text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>

              {/* 새 LOT */}
              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                새 LOT
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* 제품별 요약 뷰 */}
        {viewMode === "products" && (
          <>
            {filteredProducts.length === 0 && !productsLoading ? (
              <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-medium text-slate-800 mb-1">
                  제품이 없습니다
                </h3>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-8"></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">코드</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">제품명</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">유형</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">현재재고</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">LOT수</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">최소재고</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((product) => {
                      const status = getStockStatus(product);
                      const StatusIcon = status.icon;
                      const isExpanded = expandedProducts.has(product.id);

                      return (
                        <>
                          <tr key={product.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              {product.lot_count > 0 && (
                                <button
                                  onClick={() => toggleProduct(product.id)}
                                  className="p-1 hover:bg-slate-100 rounded"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-slate-400" />
                                  )}
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                              {product.internal_code || "-"}
                            </td>
                            <td className="px-4 py-3 font-medium">{product.internal_name}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                                {getTypeLabel(product.type)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-lg">
                              {formatNumber(product.current_stock)}
                              <span className="text-sm font-normal text-slate-400 ml-1">
                                {product.unit || "개"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-medium">
                                {product.lot_count}개
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-400">
                              {product.min_stock_alert ? formatNumber(product.min_stock_alert) : "-"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </span>
                            </td>
                          </tr>

                          {/* 펼쳐진 LOT 목록 */}
                          {isExpanded && product.lots && product.lots.length > 0 && (
                            <tr key={`${product.id}-lots`}>
                              <td colSpan={8} className="px-4 py-0 bg-slate-50">
                                <div className="py-3 pl-8 space-y-2">
                                  {product.lots.map((lot) => (
                                    <div
                                      key={lot.id}
                                      className="flex items-center justify-between p-3 bg-white rounded-lg border"
                                    >
                                      <div className="flex items-center gap-4">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <Hash className="h-3.5 w-3.5 text-slate-400" />
                                            <span className="font-medium text-sky-600">
                                              {lot.lot_number}
                                            </span>
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${LOT_STATUS_COLORS[lot.status as LotStatus]}`}>
                                              {LOT_STATUS_LABELS[lot.status as LotStatus]}
                                            </span>
                                          </div>
                                          <div className="text-xs text-slate-400 mt-1">
                                            {lot.spec_value || "-"} | {lot.location || "위치 미지정"}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <div className="text-right">
                                          <div className="font-bold">
                                            {lot.current_quantity} {lot.unit || product.unit || "개"}
                                          </div>
                                          <div className="text-xs text-slate-400">
                                            {lot.received_at ? dayjs(lot.received_at).format("YYYY-MM-DD") : "-"}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => handleOpenDetailModal(lot)}
                                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded"
                                            title="상세"
                                          >
                                            <Eye className="h-4 w-4" />
                                          </button>
                                          {lot.status === "available" && lot.current_quantity > 0 && (
                                            <button
                                              onClick={() => handleOpenSplitModal(lot)}
                                              className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                                              title="분할"
                                            >
                                              <Scissors className="h-4 w-4" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
                {filteredProducts.length > 0 && (
                  <div className="px-4 py-3 bg-slate-50 border-t text-sm text-slate-400">
                    총 {filteredProducts.length}개 제품
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* LOT 상세 뷰 */}
        {viewMode === "lots" && (
          <>
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="text-sm text-slate-600">
                  전체 {total}건 중 {(page - 1) * 20 + 1}-{Math.min(page * 20, total)}건
                </div>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}

            {lots.length === 0 && !lotsLoading ? (
              <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-medium text-slate-800 mb-1">LOT가 없습니다</h3>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium rounded-lg bg-sky-600 text-white hover:bg-sky-700"
                >
                  <Plus className="h-4 w-4" />
                  새 LOT 등록
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">LOT 번호</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">제품</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">수량</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">규격</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">출처</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">위치</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">상태</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">입고일</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lots.map((lot) => {
                      const canSplit = lot.status === "available" && lot.current_quantity > 0;
                      const canDelete = lot.status !== "split" && lot.status !== "scrapped";
                      const unit = lot.unit || lot.product?.unit || "개";

                      return (
                        <tr key={lot.id} className="hover:bg-slate-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm font-medium text-sky-600">
                              <Hash className="h-3.5 w-3.5" />
                              {lot.lot_number}
                            </div>
                            {lot.source_lot && (
                              <div className="text-xs text-slate-400 mt-0.5">
                                원본: {lot.source_lot.lot_number}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-800">
                              {lot.product?.internal_name || "-"}
                            </div>
                            {lot.product?.internal_code && (
                              <div className="text-xs text-slate-400">{lot.product.internal_code}</div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-bold text-slate-800">{lot.current_quantity}</span>
                              <span className="text-sm text-slate-400">{unit}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-slate-600">{lot.spec_value || "-"}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">
                              {LOT_SOURCE_LABELS[lot.source_type as LotSourceType] || lot.source_type}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {lot.location ? (
                              <div className="flex items-center gap-1 text-sm text-slate-600">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                {lot.location}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${LOT_STATUS_COLORS[lot.status as LotStatus]}`}>
                              {LOT_STATUS_LABELS[lot.status as LotStatus]}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm text-slate-500">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {lot.received_at ? dayjs(lot.received_at).format("YYYY-MM-DD") : "-"}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenDetailModal(lot)}
                                className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded"
                                title="상세"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {canSplit && (
                                <button
                                  onClick={() => handleOpenSplitModal(lot)}
                                  className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                                  title="분할"
                                >
                                  <Scissors className="h-4 w-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(lot)}
                                  disabled={isDeleting}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                  title="폐기"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* 모달들 */}
      {splitModalOpen && selectedLot && (
        <LotSplitModal
          lot={selectedLot}
          isOpen={splitModalOpen}
          onClose={() => { setSplitModalOpen(false); setSelectedLot(null); }}
          onSuccess={() => {
            refreshLots();
            if (viewMode === "products") fetchProductSummaries();
            setSplitModalOpen(false);
            setSelectedLot(null);
          }}
        />
      )}

      {detailModalOpen && selectedLot && (
        <LotDetailModal
          lot={selectedLot}
          isOpen={detailModalOpen}
          onClose={() => { setDetailModalOpen(false); setSelectedLot(null); }}
          onUpdate={() => {
            refreshLots();
            if (viewMode === "products") fetchProductSummaries();
          }}
        />
      )}

      {createModalOpen && (
        <LotCreateModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            refreshLots();
            if (viewMode === "products") fetchProductSummaries();
            setCreateModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
