"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Link2,
  Search,
  Package,
  FileText,
  Building2,
  CheckCircle,
  X,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  ArrowRight,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import ProductFormModal from "@/components/production/products/ProductFormModal";
import type { ProductCreateRequest } from "@/types/production";

interface DocumentItem {
  id: string;
  document_id: string;
  item_number: number;
  name: string;
  spec: string | null;
  quantity: string;
  unit: string | null;
  unit_price: number;
  amount: number;
  product_id: string | null;
  document?: {
    id: string;
    document_number: string;
    type: string;
    date: string;
    company?: {
      id: string;
      name: string;
    };
  };
}

interface GroupedItem {
  name: string;
  spec: string | null;
  count: number;
  items: DocumentItem[];
  docTypes: string[];
  companies: string[];
}

interface Product {
  id: string;
  internal_code: string;
  internal_name: string;
  spec: string | null;
  type: string;
  current_stock: number;
  unit?: string;
}

interface StatsInfo {
  total: number;
  totalGroups: number;
  totalUnlinkedAll: number;
  order: number;
  estimate: number;
  dateRange: string;
}

export default function ProductMappingPage() {
  const loginUser = useLoginUser();
  const [grouped, setGrouped] = useState<GroupedItem[]>([]);
  const [stats, setStats] = useState<StatsInfo>({
    total: 0,
    totalGroups: 0,
    totalUnlinkedAll: 0,
    order: 0,
    estimate: 0,
    dateRange: "",
  });
  const [loading, setLoading] = useState(true);
  const [docTypeFilter, setDocTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // 제품 검색 모달 상태
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupedItem | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [productPagination, setProductPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [linking, setLinking] = useState(false);

  // 제품 생성 모달
  const [showProductFormModal, setShowProductFormModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // 연결 확인 모달
  const [pendingLinkProduct, setPendingLinkProduct] = useState<Product | null>(null);

  // 확장된 그룹
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const fetchUnlinkedItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (docTypeFilter !== "all") {
        params.set("doc_type", docTypeFilter);
      }
      if (searchTerm) {
        params.set("search", searchTerm);
      }

      const res = await fetch(`/api/document-items/unlinked?${params}`);
      const data = await res.json();

      if (res.ok) {
        setGrouped(data.grouped || []);
        setStats({
          total: data.total || 0,
          totalGroups: data.totalGroups || 0,
          totalUnlinkedAll: data.totalUnlinkedAll || 0,
          order: data.stats?.order || 0,
          estimate: data.stats?.estimate || 0,
          dateRange: data.dateRange || "2018-01-01 ~",
        });
      }
    } catch (error) {
      console.error("미연결 품목 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  }, [docTypeFilter, searchTerm]);

  useEffect(() => {
    fetchUnlinkedItems();
  }, [docTypeFilter]);

  // 검색 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUnlinkedItems();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 제품 검색
  const searchProducts = useCallback(async (query: string, page: number = 1) => {
    setProductLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "15",
      });
      if (query.trim()) {
        params.set("q", query);
      }

      const res = await fetch(`/api/products/search?${params}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        setProductPagination({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          total: data.total || 0,
        });
      }
    } catch (error) {
      console.error("제품 검색 오류:", error);
    } finally {
      setProductLoading(false);
    }
  }, []);

  // 모달 열릴 때 제품 검색
  useEffect(() => {
    if (linkModalOpen && productSearch) {
      const timer = setTimeout(() => {
        searchProducts(productSearch, 1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [productSearch, linkModalOpen, searchProducts]);

  const openLinkModal = (group: GroupedItem) => {
    setSelectedGroup(group);
    setProductSearch(group.name); // 품목명으로 초기 검색
    setProducts([]);
    setLinkModalOpen(true);
    // 초기 검색 실행
    setTimeout(() => searchProducts(group.name, 1), 100);
  };

  const handleProductPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= productPagination.totalPages) {
      searchProducts(productSearch, newPage);
    }
  };

  // 연결 실행
  const handleLink = async (product: Product) => {
    if (!selectedGroup || !loginUser) return;

    setLinking(true);
    try {
      const res = await fetch("/api/document-items/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedGroup.name,
          spec: selectedGroup.spec,
          product_id: product.id,
          user_id: loginUser.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`${data.updated_count}개 품목이 "${product.internal_name}"에 연결되었습니다.`);
        setLinkModalOpen(false);
        setSelectedGroup(null);
        setPendingLinkProduct(null);
        fetchUnlinkedItems();
      } else {
        alert(data.error || "연결 실패");
      }
    } catch (error) {
      console.error("연결 오류:", error);
      alert("연결 중 오류가 발생했습니다.");
    } finally {
      setLinking(false);
    }
  };

  // 새 제품 등록 및 연결
  const handleProductFormSubmit = async (data: ProductCreateRequest) => {
    setIsRegistering(true);
    try {
      // 제품 생성
      const productRes = await fetch("/api/production/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!productRes.ok) {
        const error = await productRes.json();
        throw new Error(error.error || "제품 등록 실패");
      }

      const result = await productRes.json();
      const createdProduct = result.product || result;

      // 생성된 제품과 바로 연결
      if (selectedGroup && loginUser) {
        const linkRes = await fetch("/api/document-items/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: selectedGroup.name,
            spec: selectedGroup.spec,
            product_id: createdProduct.id,
            user_id: loginUser.id,
          }),
        });

        const linkData = await linkRes.json();
        if (linkRes.ok) {
          alert(`제품이 생성되고 ${linkData.updated_count}개 품목이 연결되었습니다.`);
        } else {
          alert(`제품은 생성되었지만 연결에 실패했습니다: ${linkData.error}`);
        }
      }

      setShowProductFormModal(false);
      setLinkModalOpen(false);
      setSelectedGroup(null);
      fetchUnlinkedItems();
    } catch (error) {
      console.error("제품 등록 오류:", error);
      throw error;
    } finally {
      setIsRegistering(false);
    }
  };

  const toggleExpand = (key: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case "order":
        return { label: "발주", color: "bg-sky-100 text-sky-700" };
      case "estimate":
        return { label: "견적", color: "bg-green-100 text-green-700" };
      default:
        return { label: type, color: "bg-slate-100 text-slate-600" };
    }
  };

  const getProductTypeLabel = (type: string) => {
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Link2 className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">품목-제품 매핑</h1>
              <p className="text-sm text-slate-500">
                미연결 품목을 제품에 연결합니다
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchUnlinkedItems()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-6 gap-3 mb-4">
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="text-xs text-slate-500 mb-1">DB 전체 미연결</div>
            <div className="text-xl font-bold text-slate-400">{stats.totalUnlinkedAll.toLocaleString()}개</div>
          </div>
          <div className="rounded-lg border border-orange-300 p-3 bg-orange-50">
            <div className="text-xs text-orange-600 mb-1">2018년 이후 미연결</div>
            <div className="text-xl font-bold text-orange-600">{stats.total.toLocaleString()}개</div>
          </div>
          <div className="rounded-lg border border-sky-200 p-3 bg-sky-50">
            <div className="text-xs text-sky-600 mb-1">발주서 (매입)</div>
            <div className="text-xl font-bold text-sky-700">{stats.order.toLocaleString()}개</div>
          </div>
          <div className="rounded-lg border border-green-200 p-3 bg-green-50">
            <div className="text-xs text-green-600 mb-1">견적서 (매출)</div>
            <div className="text-xl font-bold text-green-700">{stats.estimate.toLocaleString()}개</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="text-xs text-slate-500 mb-1">고유 품명 수</div>
            <div className="text-xl font-bold text-slate-800">{stats.totalGroups.toLocaleString()}개</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="text-xs text-slate-500 mb-1">평균 중복</div>
            <div className="text-xl font-bold text-slate-800">
              {stats.totalGroups > 0
                ? (stats.total / stats.totalGroups).toFixed(1)
                : 0}
              회
            </div>
          </div>
        </div>

        {/* 필터 */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="품목명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">전체 문서유형</option>
            <option value="order">발주서 (매입)</option>
            <option value="estimate">견적서 (매출)</option>
          </select>
        </div>
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-800 mb-1">
            모든 품목이 연결되어 있습니다
          </h3>
          <p className="text-sm text-slate-500">미연결 품목이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map((group) => {
              const key = `${group.name}|||${group.spec || ""}`;
              const isExpanded = expandedGroups.has(key);

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                >
                  {/* 그룹 헤더 */}
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50">
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => toggleExpand(key)}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800 text-base">
                            {group.name}
                          </span>
                          {group.spec && (
                            <span className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {group.spec}
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                            {group.count}건
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs">
                          <div className="flex items-center gap-1">
                            {group.docTypes.map((type) => {
                              const { label, color } = getDocTypeLabel(type);
                              return (
                                <span
                                  key={type}
                                  className={`px-1.5 py-0.5 rounded ${color}`}
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                          <span className="text-slate-300">|</span>
                          <div className="flex items-center gap-1 text-slate-600">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate max-w-[400px]">
                              {group.companies.slice(0, 4).join(", ")}
                              {group.companies.length > 4 &&
                                ` 외 ${group.companies.length - 4}곳`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => openLinkModal(group)}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <Link2 className="h-4 w-4" />
                      연결
                    </button>
                  </div>

                  {/* 확장된 상세 목록 */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs text-slate-500 mb-3">
                        해당 품명이 사용된 문서 목록 ({group.count}건)
                      </div>

                      {/* 테이블 헤더 */}
                      <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-slate-500 bg-slate-100 rounded-t-lg">
                        <div className="col-span-1">유형</div>
                        <div className="col-span-2">문서번호</div>
                        <div className="col-span-1">날짜</div>
                        <div className="col-span-3">거래처</div>
                        <div className="col-span-2">규격</div>
                        <div className="col-span-1 text-right">수량</div>
                        <div className="col-span-1 text-right">단가</div>
                        <div className="col-span-1 text-right">금액</div>
                      </div>

                      <div className="max-h-72 overflow-y-auto bg-white rounded-b-lg border border-slate-200 border-t-0">
                        {group.items.slice(0, 30).map((item) => (
                          <div
                            key={item.id}
                            className="grid grid-cols-12 gap-2 px-3 py-2.5 text-sm border-b border-slate-100 last:border-0 hover:bg-slate-50"
                          >
                            <div className="col-span-1">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                item.document?.type === "order"
                                  ? "bg-sky-100 text-sky-700"
                                  : "bg-green-100 text-green-700"
                              }`}>
                                {item.document?.type === "order" ? "발주" : "견적"}
                              </span>
                            </div>
                            <div className="col-span-2 font-mono text-sky-600 text-xs truncate">
                              {item.document?.document_number || "-"}
                            </div>
                            <div className="col-span-1 text-slate-500 text-xs">
                              {item.document?.date?.slice(5, 10) || "-"}
                            </div>
                            <div className="col-span-3 text-slate-800 truncate font-medium">
                              {item.document?.company?.name || "-"}
                            </div>
                            <div className="col-span-2 text-slate-500 text-xs truncate">
                              {item.spec || "-"}
                            </div>
                            <div className="col-span-1 text-right text-slate-700">
                              {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                            </div>
                            <div className="col-span-1 text-right text-slate-600 text-xs">
                              {item.unit_price?.toLocaleString() || "-"}
                            </div>
                            <div className="col-span-1 text-right text-slate-800 font-medium text-xs">
                              {item.amount?.toLocaleString() || "-"}
                            </div>
                          </div>
                        ))}
                      </div>

                      {group.count > 30 && (
                        <div className="text-xs text-slate-400 text-center py-2 mt-1">
                          ... 외 {group.count - 30}건 더 있음
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
        </div>
      )}

      {/* 제품 선택 모달 */}
      {linkModalOpen && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-50">
              <div>
                <h3 className="font-semibold text-lg text-slate-800">
                  제품 연결
                </h3>
                <p className="text-sm text-slate-500">
                  &quot;{selectedGroup.name}&quot;
                  {selectedGroup.spec && ` (${selectedGroup.spec})`}을(를) 연결할
                  제품 선택
                </p>
              </div>
              <button
                onClick={() => {
                  setLinkModalOpen(false);
                  setSelectedGroup(null);
                }}
                className="p-2 hover:bg-white/50 rounded-lg"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="제품명, 코드로 검색..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {productLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-4">
                    {productSearch
                      ? `"${productSearch}"에 대한 검색 결과가 없습니다`
                      : "제품명을 검색하세요"}
                  </p>
                  <button
                    onClick={() => setShowProductFormModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4" />
                    새 제품 등록
                  </button>
                </div>
              ) : (
                <>
                  {/* 테이블 헤더 */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-slate-600 border-b bg-slate-50 sticky top-0">
                    <div className="col-span-2">코드</div>
                    <div className="col-span-4">제품명</div>
                    <div className="col-span-2">규격</div>
                    <div className="col-span-2 text-right">재고</div>
                    <div className="col-span-2 text-center">선택</div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-orange-50/50"
                      >
                        <div className="col-span-2 text-slate-500 font-mono text-xs">
                          {product.internal_code}
                        </div>
                        <div className="col-span-4">
                          <div className="font-medium text-slate-800">
                            {product.internal_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {getProductTypeLabel(product.type)}
                          </div>
                        </div>
                        <div className="col-span-2 text-slate-600 text-sm">
                          {product.spec || "-"}
                        </div>
                        <div
                          className={`col-span-2 text-right font-medium ${
                            product.current_stock > 0
                              ? "text-green-600"
                              : "text-slate-400"
                          }`}
                        >
                          {product.current_stock}
                          {product.unit || "개"}
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <button
                            onClick={() => setPendingLinkProduct(product)}
                            disabled={linking}
                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs hover:bg-orange-600 disabled:opacity-50"
                          >
                            <Check className="h-3 w-3" />
                            선택
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 제품 페이지네이션 */}
                  {productPagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 py-3 border-t bg-slate-50">
                      <button
                        onClick={() =>
                          handleProductPageChange(productPagination.page - 1)
                        }
                        disabled={productPagination.page <= 1}
                        className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-sm text-slate-600">
                        {productPagination.page} / {productPagination.totalPages}
                      </span>
                      <button
                        onClick={() =>
                          handleProductPageChange(productPagination.page + 1)
                        }
                        disabled={
                          productPagination.page >= productPagination.totalPages
                        }
                        className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 푸터 */}
            <div className="px-6 py-3 border-t bg-slate-50 flex justify-between items-center">
              <button
                onClick={() => setShowProductFormModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50"
              >
                <Plus className="h-4 w-4" />
                새 제품 등록
              </button>
              <button
                onClick={() => {
                  setLinkModalOpen(false);
                  setSelectedGroup(null);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 연결 확인 모달 */}
      {pendingLinkProduct && selectedGroup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b bg-orange-50">
              <h3 className="text-lg font-semibold text-slate-800">
                제품 연결 확인
              </h3>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                {/* 문서 품목 정보 (왼쪽: 거래처 품목명) */}
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-sky-600 font-medium mb-1">
                    📄 문서에 적힌 품목명 ({selectedGroup.count}건)
                  </div>
                  <div className="font-semibold text-slate-900 text-lg">
                    {selectedGroup.name}
                  </div>
                  {selectedGroup.spec && (
                    <div className="text-sm text-slate-600 mt-0.5">
                      규격: {selectedGroup.spec}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 mt-1">
                    {selectedGroup.docTypes.includes("order") && "발주서 "}
                    {selectedGroup.docTypes.includes("estimate") && "견적서"}
                    {" · "}
                    {selectedGroup.companies.slice(0, 2).join(", ")}
                    {selectedGroup.companies.length > 2 && ` 외 ${selectedGroup.companies.length - 2}곳`}
                  </div>
                </div>

                {/* 화살표 + 설명 */}
                <div className="flex flex-col items-center gap-1 py-1">
                  <ArrowRight className="h-6 w-6 text-orange-500 rotate-90" />
                  <span className="text-xs text-orange-600 font-medium">연결</span>
                </div>

                {/* 내부 제품 정보 (오른쪽: 우리 재고 제품) */}
                <div className="bg-white rounded-lg p-3 border-2 border-orange-300">
                  <div className="text-xs text-orange-600 font-medium mb-1">
                    📦 우리 재고 제품 (내부 관리용)
                  </div>
                  <div className="font-semibold text-slate-900 text-lg">
                    {pendingLinkProduct.internal_name}
                  </div>
                  {pendingLinkProduct.spec && (
                    <div className="text-sm text-slate-600 mt-0.5">
                      규격: {pendingLinkProduct.spec}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                      {pendingLinkProduct.internal_code}
                    </span>
                    <span className={`text-xs font-medium ${pendingLinkProduct.current_stock > 0 ? "text-green-600" : "text-slate-400"}`}>
                      현재고: {pendingLinkProduct.current_stock}{pendingLinkProduct.unit || "개"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-sky-50 rounded-lg p-3 text-xs text-sky-700">
                <div className="font-medium mb-1">💡 연결 후 동작</div>
                <ul className="space-y-0.5 text-sky-600">
                  <li>• <strong>발주서</strong> 입고 완료 시 → "{pendingLinkProduct.internal_name}" 재고 <span className="text-green-600 font-medium">증가</span></li>
                  <li>• <strong>견적서</strong> 출고 완료 시 → "{pendingLinkProduct.internal_name}" 재고 <span className="text-red-600 font-medium">감소</span></li>
                </ul>
              </div>
            </div>

            <div className="px-5 py-3 border-t bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setPendingLinkProduct(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                disabled={linking}
              >
                취소
              </button>
              <button
                onClick={() => handleLink(pendingLinkProduct)}
                disabled={linking}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
              >
                {linking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    연결 중...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    연결하기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 제품 등록 모달 */}
      <ProductFormModal
        isOpen={showProductFormModal}
        onClose={() => setShowProductFormModal(false)}
        onSubmit={handleProductFormSubmit}
        defaultType="purchased"
        isLoading={isRegistering}
      />
    </div>
  );
}
