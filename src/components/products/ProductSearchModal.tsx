"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { X, Search, Package, Plus, Loader2, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, Check, Link2, TrendingUp } from "lucide-react";
import ProductFormModal from "@/components/production/products/ProductFormModal";
import PriceHistoryModal from "@/components/documents/PriceHistoryModal";
import type { ProductCreateRequest } from "@/types/production";

// 거래처별 입고제품 (별칭)
interface CompanyAlias {
  id: string;
  product_id: string;
  company_id: string;
  alias_type: string;
  external_code: string | null;
  external_name: string;
  external_spec: string | null;
  external_unit: string | null;
  external_unit_price: number | null;
  use_count: number;
  is_default: boolean;
  product?: {
    id: string;
    internal_code: string;
    internal_name: string;
    type: string;
    unit: string;
    current_stock?: number;
    spec?: string;
  };
}

interface ProductAlias {
  id: string;
  company_id?: string;
  external_name: string;
  external_spec: string | null;
  external_unit_price: number | null;
  use_count: number;
  is_default: boolean;
}

interface ProductSearchResult {
  id: string;
  internal_code: string;
  internal_name: string;
  spec: string | null;
  unit: string;
  current_stock: number;
  unit_price: number | null;
  aliases: ProductAlias[];
  recommended_alias: ProductAlias | null;
}

interface SelectedProduct {
  product_id: string;
  name: string;
  spec: string;
  unit_price: number;
  internal_name: string;
  internal_spec: string;
}

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: SelectedProduct) => void;
  companyId?: string;
  companyName?: string;
  documentType: "order" | "estimate";
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ExternalProductInfo {
  externalName: string;
  externalSpec: string;
  externalUnitPrice: number;
}

// 발주 모드 단계: list(기존목록), add_step1(외부정보입력), add_step2(내부제품연결)
type OrderModeStep = "list" | "add_step1" | "add_step2";

export default function ProductSearchModal({
  isOpen,
  onClose,
  onSelect,
  companyId,
  companyName,
  documentType,
}: ProductSearchModalProps) {
  // 공통 상태
  const [loading, setLoading] = useState(false);
  const [showProductFormModal, setShowProductFormModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // 연결 확인 모달 상태
  const [pendingLinkProduct, setPendingLinkProduct] = useState<ProductSearchResult | null>(null);

  // 단가 추이 모달 상태
  const [priceHistoryOpen, setPriceHistoryOpen] = useState(false);
  const [priceHistoryProduct, setPriceHistoryProduct] = useState<{
    productId: string;
    productName: string;
    companyId?: string;
    companyName?: string;
    priceType: "purchase" | "sales";
  } | null>(null);

  // 체크박스 선택 상태 (입고: alias id, 출고: product id + alias id 조합)
  const [selectedAliasIds, setSelectedAliasIds] = useState<Set<string>>(new Set());
  const [selectedProducts, setSelectedProducts] = useState<Map<string, { product: ProductSearchResult; alias?: ProductAlias }>>(new Map());

  // 발주 모드: 거래처 입고제품 목록
  const [companyAliases, setCompanyAliases] = useState<CompanyAlias[]>([]);
  const [aliasSearchQuery, setAliasSearchQuery] = useState("");
  const [orderStep, setOrderStep] = useState<OrderModeStep>("list");
  const [externalInfo, setExternalInfo] = useState<ExternalProductInfo>({
    externalName: "",
    externalSpec: "",
    externalUnitPrice: 0,
  });

  // 견적 모드 & 내부 제품 검색
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 15,
    total: 0,
    totalPages: 0,
  });

  // 이미 연결된 내부 제품 ID 목록 (발주 모드에서 중복 연결 방지)
  const linkedProductIds = useMemo(() => {
    return new Set(companyAliases.map(alias => alias.product_id));
  }, [companyAliases]);

  // 거래처 입고제품(별칭) 로드
  const loadCompanyAliases = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/production/products/aliases?company_id=${companyId}`);
      const data = await res.json();

      if (data.aliases) {
        // purchase 타입 또는 타입 미지정(null) 포함
        const purchaseAliases = data.aliases.filter((a: CompanyAlias) =>
          a.alias_type === "purchase" || a.alias_type === null || !a.alias_type
        );
        setCompanyAliases(purchaseAliases);
      }
    } catch (error) {
      console.error("Failed to load company aliases:", error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // 내부 제품 검색
  const searchProducts = useCallback(async (query: string = "", page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: documentType,
        page: String(page),
        pageSize: "15",
      });
      if (query.trim()) {
        params.append("q", query);
      }
      if (companyId && documentType === "estimate") {
        params.append("company_id", companyId);
      }

      const res = await fetch(`/api/products/search?${params}`);
      const data = await res.json();

      if (data.products) {
        setResults(data.products);
        setPagination({
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          totalPages: data.totalPages,
        });
      }
    } catch (error) {
      console.error("Product search error:", error);
    } finally {
      setLoading(false);
    }
  }, [companyId, documentType]);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setAliasSearchQuery("");
      setShowProductFormModal(false);
      setOrderStep("list");
      setExternalInfo({ externalName: "", externalSpec: "", externalUnitPrice: 0 });
      setPagination({ page: 1, pageSize: 15, total: 0, totalPages: 0 });
      setPendingLinkProduct(null);
      setCompanyAliases([]);
      setResults([]);
      setSelectedAliasIds(new Set());
      setSelectedProducts(new Map());

      if (documentType === "order" && companyId) {
        loadCompanyAliases();
      } else if (documentType === "estimate") {
        searchProducts("", 1);
      }
    }
  }, [isOpen, documentType, companyId, loadCompanyAliases, searchProducts]);

  // 검색어 변경 시 디바운스 검색 (견적 모드 또는 발주 Step2)
  useEffect(() => {
    if (documentType === "estimate" || orderStep === "add_step2") {
      const timer = setTimeout(() => {
        searchProducts(searchQuery, 1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, searchProducts, documentType, orderStep]);

  // Step 2로 이동 시 제품 목록 로드
  useEffect(() => {
    if (documentType === "order" && orderStep === "add_step2") {
      searchProducts(searchQuery, 1);
    }
  }, [orderStep, documentType, searchProducts, searchQuery]);

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    searchProducts(searchQuery, newPage);
  };

  // 필터링된 거래처 입고제품
  const filteredAliases = companyAliases.filter((alias) => {
    if (!aliasSearchQuery.trim()) return true;
    const query = aliasSearchQuery.toLowerCase();
    return (
      alias.external_name?.toLowerCase().includes(query) ||
      alias.external_code?.toLowerCase().includes(query) ||
      alias.external_spec?.toLowerCase().includes(query) ||
      alias.product?.internal_name?.toLowerCase().includes(query)
    );
  });

  // 입고 모드: 체크박스 토글
  const toggleAliasSelection = (alias: CompanyAlias) => {
    setSelectedAliasIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alias.id)) {
        newSet.delete(alias.id);
      } else {
        newSet.add(alias.id);
      }
      return newSet;
    });
  };

  // 출고 모드: 체크박스 토글
  const toggleProductSelection = (product: ProductSearchResult, alias?: ProductAlias) => {
    const key = alias ? `${product.id}-${alias.id}` : product.id;
    setSelectedProducts(prev => {
      const newMap = new Map(prev);
      if (newMap.has(key)) {
        newMap.delete(key);
      } else {
        newMap.set(key, { product, alias });
      }
      return newMap;
    });
  };

  // 입고 모드: 선택 확인
  const handleConfirmAliasSelection = () => {
    const selectedAliases = companyAliases.filter(a => selectedAliasIds.has(a.id));
    selectedAliases.forEach(alias => {
      const selected: SelectedProduct = {
        product_id: alias.product_id,
        name: alias.external_name,
        spec: alias.external_spec || "",
        unit_price: alias.external_unit_price || 0,
        internal_name: alias.product?.internal_name || "",
        internal_spec: alias.product?.spec || "",
      };
      onSelect(selected);
    });
    setSelectedAliasIds(new Set());
    onClose(); // 모달 닫기
  };

  // 출고 모드: 선택 확인
  const handleConfirmProductSelection = () => {
    selectedProducts.forEach(({ product, alias }) => {
      const selected: SelectedProduct = {
        product_id: product.id,
        name: alias?.external_name || product.internal_name,
        spec: alias?.external_spec || product.spec || "",
        unit_price: alias?.external_unit_price || product.unit_price || 0,
        internal_name: product.internal_name,
        internal_spec: product.spec || "",
      };
      onSelect(selected);
    });
    setSelectedProducts(new Map());
    onClose(); // 모달 닫기
  };

  // 단가 추이 모달 열기
  const handleOpenPriceHistory = (
    productId: string,
    productName: string,
    targetCompanyId?: string,
    targetCompanyName?: string
  ) => {
    setPriceHistoryProduct({
      productId,
      productName,
      companyId: targetCompanyId,
      companyName: targetCompanyName,
      priceType: documentType === "order" ? "purchase" : "sales",
    });
    setPriceHistoryOpen(true);
  };

  // 기존 입고제품 선택 (발주 모드)
  const handleSelectExistingAlias = (alias: CompanyAlias) => {
    const selected: SelectedProduct = {
      product_id: alias.product_id,
      name: alias.external_name,
      spec: alias.external_spec || "",
      unit_price: alias.external_unit_price || 0,
      internal_name: alias.product?.internal_name || "",
      internal_spec: alias.product?.spec || "",
    };
    onSelect(selected);
    // 모달은 닫지 않음 (여러 개 계속 추가 가능)
  };

  // 새 입고제품 추가 시작
  const startAddNewProduct = () => {
    setOrderStep("add_step1");
  };

  // Step 1 → Step 2 이동
  const goToStep2 = () => {
    if (!externalInfo.externalName.trim()) {
      alert("외부 품명을 입력해주세요.");
      return;
    }
    setOrderStep("add_step2");
  };

  // 새 입고제품: 내부 제품 연결 완료
  const handleLinkInternalProduct = async (product: ProductSearchResult) => {
    console.log("[handleLinkInternalProduct] Called with:", {
      productId: product.id,
      productName: product.internal_name,
      companyId,
      externalInfo,
    });

    if (!companyId) {
      console.log("[handleLinkInternalProduct] No companyId, selecting without alias");
      const selected: SelectedProduct = {
        product_id: product.id,
        name: externalInfo.externalName || product.internal_name,
        spec: externalInfo.externalSpec || product.spec || "",
        unit_price: externalInfo.externalUnitPrice || product.unit_price || 0,
        internal_name: product.internal_name,
        internal_spec: product.spec || "",
      };
      onSelect(selected);
      onClose();
      return;
    }

    setIsRegistering(true);
    try {
      // 별칭 등록
      const aliasPayload = {
        product_id: product.id,
        company_id: companyId,
        alias_type: "purchase",
        external_name: externalInfo.externalName,
        external_spec: externalInfo.externalSpec,
        external_unit_price: externalInfo.externalUnitPrice,
      };

      console.log("[handleLinkInternalProduct] Creating alias with payload:", aliasPayload);

      const res = await fetch("/api/production/products/aliases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aliasPayload),
      });

      const responseData = await res.json();

      if (!res.ok) {
        console.error("[handleLinkInternalProduct] Alias creation failed:", responseData);
        alert(`입고제품 연결 실패: ${responseData.error || "알 수 없는 오류"}`);
        setPendingLinkProduct(null);
        return;
      }

      console.log("[handleLinkInternalProduct] Alias created successfully:", responseData);

      const selected: SelectedProduct = {
        product_id: product.id,
        name: externalInfo.externalName,
        spec: externalInfo.externalSpec,
        unit_price: externalInfo.externalUnitPrice,
        internal_name: product.internal_name,
        internal_spec: product.spec || "",
      };

      console.log("[handleLinkInternalProduct] Selecting product:", selected);
      onSelect(selected);

      // 목록으로 돌아가고 별칭 목록 새로고침 (여러 개 계속 추가 가능)
      setOrderStep("list");
      setExternalInfo({ externalName: "", externalSpec: "", externalUnitPrice: 0 });
      loadCompanyAliases();
    } catch (error) {
      console.error("[handleLinkInternalProduct] Error:", error);
      alert("입고제품 등록 중 오류가 발생했습니다.");
      setPendingLinkProduct(null);
    } finally {
      setIsRegistering(false);
    }
  };

  // 견적 모드: 제품 선택
  const handleSelectProduct = (product: ProductSearchResult, alias?: ProductAlias) => {
    const selected: SelectedProduct = {
      product_id: product.id,
      name: alias?.external_name || product.internal_name,
      spec: alias?.external_spec || product.spec || "",
      unit_price: alias?.external_unit_price || product.unit_price || 0,
      internal_name: product.internal_name,
      internal_spec: product.spec || "",
    };
    onSelect(selected);
    // 모달은 닫지 않음 (여러 개 계속 추가 가능)
  };

  // 새 제품 등록 완료
  const handleProductFormSubmit = async (data: ProductCreateRequest) => {
    setIsRegistering(true);

    console.log("[ProductSearch] handleProductFormSubmit called:", {
      documentType,
      companyId,
      companyName,
      externalInfo,
      productData: data,
    });

    try {
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
      console.log("[ProductSearch] Product created:", createdProduct);

      // 거래처 있으면 별칭 등록
      if (companyId && documentType === "order") {
        const aliasPayload = {
          product_id: createdProduct.id,
          company_id: companyId,
          alias_type: "purchase",
          external_name: externalInfo.externalName || data.internal_name,
          external_spec: externalInfo.externalSpec || data.spec || null,
          external_unit_price: externalInfo.externalUnitPrice || data.unit_price || null,
        };

        console.log("[ProductSearch] Creating alias with payload:", aliasPayload);

        const aliasRes = await fetch("/api/production/products/aliases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aliasPayload),
        });

        const aliasResponseData = await aliasRes.json();

        if (!aliasRes.ok) {
          console.error("[ProductSearch] Alias creation failed:", aliasResponseData);
          // 별칭 생성 실패해도 제품은 이미 생성됨, 경고만 표시
          alert(`입고제품 연결 실패: ${aliasResponseData.error || "알 수 없는 오류"}\n제품은 생성되었으니 별칭 관리에서 수동으로 연결해주세요.`);
        } else {
          console.log("[ProductSearch] Alias created successfully:", aliasResponseData);
        }
      } else {
        console.log("[ProductSearch] Skipping alias creation - companyId:", companyId, "documentType:", documentType);
      }

      const selected: SelectedProduct = {
        product_id: createdProduct.id,
        name: documentType === "order" ? (externalInfo.externalName || data.internal_name) : data.internal_name,
        spec: documentType === "order" ? (externalInfo.externalSpec || data.spec || "") : (data.spec || ""),
        unit_price: documentType === "order" ? (externalInfo.externalUnitPrice || data.unit_price || 0) : (data.unit_price || 0),
        internal_name: data.internal_name,
        internal_spec: data.spec || "",
      };
      onSelect(selected);
      setShowProductFormModal(false);
      onClose();
    } catch (error) {
      console.error("Product registration error:", error);
      throw error;
    } finally {
      setIsRegistering(false);
    }
  };

  // 페이지네이션 컴포넌트
  const PaginationControls = ({ info, onChange }: { info: PaginationInfo; onChange: (page: number) => void }) => {
    if (info.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50 text-sm">
        <span className="text-gray-500">
          총 {info.total}개 중 {(info.page - 1) * info.pageSize + 1}-{Math.min(info.page * info.pageSize, info.total)}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange(info.page - 1)}
            disabled={info.page <= 1}
            className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: Math.min(5, info.totalPages) }, (_, i) => {
            let pageNum: number;
            if (info.totalPages <= 5) pageNum = i + 1;
            else if (info.page <= 3) pageNum = i + 1;
            else if (info.page >= info.totalPages - 2) pageNum = info.totalPages - 4 + i;
            else pageNum = info.page - 2 + i;

            return (
              <button
                key={pageNum}
                onClick={() => onChange(pageNum)}
                className={`w-8 h-8 rounded text-sm ${pageNum === info.page ? "bg-indigo-600 text-white" : "hover:bg-gray-200"}`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => onChange(info.page + 1)}
            disabled={info.page >= info.totalPages}
            className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  // ========== 발주 모드 ==========
  if (documentType === "order") {
    return (
      <>
        {/* 단가 추이 모달 */}
        <PriceHistoryModal
          isOpen={priceHistoryOpen}
          onClose={() => {
            setPriceHistoryOpen(false);
            setPriceHistoryProduct(null);
          }}
          productId={priceHistoryProduct?.productId}
          productName={priceHistoryProduct?.productName}
          companyId={priceHistoryProduct?.companyId}
          companyName={priceHistoryProduct?.companyName}
          priceType={priceHistoryProduct?.priceType || "purchase"}
        />

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
            {/* 헤더 */}
            <div className="px-5 py-4 border-b bg-indigo-50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {orderStep === "list" && "입고 제품 선택"}
                  {orderStep === "add_step1" && "새 입고제품 등록 (1/2)"}
                  {orderStep === "add_step2" && "새 입고제품 등록 (2/2)"}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {orderStep === "list" && `${companyName || "매입처"}의 제품 목록`}
                  {orderStep === "add_step1" && "매입처에서 사용하는 제품 정보를 입력하세요"}
                  {orderStep === "add_step2" && "내부 재고와 연결할 제품을 선택하세요"}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Step: list - 기존 입고제품 목록 */}
            {orderStep === "list" && (
              <>
                {/* 검색 */}
                <div className="px-5 py-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="입고제품명, 규격으로 검색..."
                      value={aliasSearchQuery}
                      onChange={(e) => setAliasSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>
                </div>

                {/* 목록 */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                    </div>
                  ) : filteredAliases.length > 0 ? (
                    <>
                      {/* 테이블 헤더: 체크박스 | 입고제품명 | 연결된 내부제품 | 규격 | 단가 | 추이 */}
                      <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-gray-600 border-b bg-indigo-50/50">
                        <div className="col-span-1 text-center">
                          <input
                            type="checkbox"
                            checked={filteredAliases.length > 0 && filteredAliases.every(a => selectedAliasIds.has(a.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAliasIds(new Set(filteredAliases.map(a => a.id)));
                              } else {
                                setSelectedAliasIds(new Set());
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="col-span-3">입고제품명</div>
                        <div className="col-span-3">연결된 내부제품</div>
                        <div className="col-span-2">규격</div>
                        <div className="col-span-2 text-right">단가</div>
                        <div className="col-span-1 text-center">추이</div>
                      </div>

                      <div className="flex-1 overflow-y-auto">
                        {filteredAliases.map((alias) => (
                          <label
                            key={alias.id}
                            className={`w-full grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 hover:bg-indigo-50/50 items-center text-sm cursor-pointer ${
                              selectedAliasIds.has(alias.id) ? "bg-indigo-50" : ""
                            }`}
                          >
                            <div className="col-span-1 flex justify-center">
                              <input
                                type="checkbox"
                                checked={selectedAliasIds.has(alias.id)}
                                onChange={() => toggleAliasSelection(alias)}
                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="col-span-3">
                              <div className="font-medium text-gray-900">{alias.external_name}</div>
                              {alias.external_code && (
                                <div className="text-xs text-gray-500">{alias.external_code}</div>
                              )}
                            </div>
                            <div className="col-span-3">
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <Link2 className="h-3 w-3" />
                                <span className="truncate">{alias.product?.internal_name || "-"}</span>
                              </div>
                            </div>
                            <div className="col-span-2 text-gray-600">{alias.external_spec || "-"}</div>
                            <div className="col-span-2 text-right text-gray-700">
                              {alias.external_unit_price?.toLocaleString() || "-"}원
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOpenPriceHistory(
                                    alias.product_id,
                                    alias.external_name,
                                    companyId,
                                    companyName
                                  );
                                }}
                                className="p-1.5 text-indigo-500 hover:bg-indigo-100 rounded-lg transition-colors"
                                title="단가 추이"
                              >
                                <TrendingUp className="h-4 w-4" />
                              </button>
                            </div>
                          </label>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center p-8">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-2">
                          {aliasSearchQuery
                            ? `"${aliasSearchQuery}"에 대한 검색 결과가 없습니다.`
                            : `${companyName || "이 매입처"}에 등록된 입고제품이 없습니다.`}
                        </p>
                        <p className="text-sm text-gray-400">
                          아래 버튼으로 새 입고제품을 추가하세요.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 푸터 */}
                <div className="px-5 py-3 border-t bg-gray-50 flex justify-between items-center">
                  <button
                    onClick={startAddNewProduct}
                    className="flex items-center gap-2 px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50"
                  >
                    <Plus className="h-4 w-4" />
                    새 입고제품 추가
                  </button>
                  <div className="flex items-center gap-3">
                    {selectedAliasIds.size > 0 && (
                      <span className="text-sm text-gray-600">
                        {selectedAliasIds.size}개 선택됨
                      </span>
                    )}
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">
                      닫기
                    </button>
                    <button
                      onClick={handleConfirmAliasSelection}
                      disabled={selectedAliasIds.size === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="h-4 w-4" />
                      확인
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Step: add_step1 - 외부 제품 정보 입력 */}
            {orderStep === "add_step1" && (
              <>
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="max-w-lg mx-auto space-y-6">
                    <div className="text-center mb-6">
                      <Package className="h-12 w-12 text-indigo-500 mx-auto mb-2" />
                      <h3 className="text-lg font-medium text-gray-900">매입처 제품 정보 입력</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {companyName || "매입처"}에서 사용하는 품명, 규격, 단가를 입력하세요
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        외부 품명 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={externalInfo.externalName}
                        onChange={(e) => setExternalInfo(prev => ({ ...prev, externalName: e.target.value }))}
                        placeholder="매입처에서 사용하는 제품명"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        외부 규격
                      </label>
                      <input
                        type="text"
                        value={externalInfo.externalSpec}
                        onChange={(e) => setExternalInfo(prev => ({ ...prev, externalSpec: e.target.value }))}
                        placeholder="예: ID38*5M, 100mm x 50mm"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        매입 단가
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={externalInfo.externalUnitPrice ? externalInfo.externalUnitPrice.toLocaleString() : ""}
                          onChange={(e) => {
                            const value = e.target.value.replace(/,/g, "");
                            setExternalInfo(prev => ({ ...prev, externalUnitPrice: parseInt(value) || 0 }));
                          }}
                          placeholder="0"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-right pr-12"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 border-t bg-gray-50 flex justify-between items-center">
                  <button
                    onClick={() => setOrderStep("list")}
                    className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    이전
                  </button>
                  <button
                    onClick={goToStep2}
                    className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    다음: 내부 제품 연결
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {/* Step: add_step2 - 내부 제품 선택 */}
            {orderStep === "add_step2" && (
              <>
                {/* 선택된 외부 정보 표시 */}
                <div className="px-5 py-3 bg-indigo-100 border-b">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-indigo-900">입고제품:</span>
                    <span className="text-indigo-700">{externalInfo.externalName}</span>
                    {externalInfo.externalSpec && (
                      <>
                        <span className="text-indigo-400">|</span>
                        <span className="text-indigo-700">{externalInfo.externalSpec}</span>
                      </>
                    )}
                    {externalInfo.externalUnitPrice > 0 && (
                      <>
                        <span className="text-indigo-400">|</span>
                        <span className="text-indigo-700">{externalInfo.externalUnitPrice.toLocaleString()}원</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 내부 제품 검색 */}
                <div className="px-5 py-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="내부 제품명, 코드로 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>
                </div>

                {/* 내부 제품 목록 */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                    </div>
                  ) : results.length > 0 ? (
                    <>
                      <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-gray-600 border-b bg-gray-50">
                        <div className="col-span-2">코드</div>
                        <div className="col-span-3">내부 제품명</div>
                        <div className="col-span-2">규격</div>
                        <div className="col-span-2 text-right">현재 재고</div>
                        <div className="col-span-1 text-center">추이</div>
                        <div className="col-span-2 text-center">연결</div>
                      </div>

                      <div className="flex-1 overflow-y-auto">
                        {results.map((product) => {
                          const isAlreadyLinked = linkedProductIds.has(product.id);
                          return (
                            <div
                              key={product.id}
                              className={`w-full grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 items-center text-sm ${
                                isAlreadyLinked
                                  ? "bg-gray-50 opacity-60"
                                  : "hover:bg-indigo-50/50"
                              }`}
                            >
                              <div className="col-span-2 text-gray-500 font-mono text-xs">
                                {product.internal_code}
                              </div>
                              <div className="col-span-3">
                                <div className="font-medium text-gray-900">{product.internal_name}</div>
                                {isAlreadyLinked && (
                                  <div className="text-xs text-orange-600">이미 이 회사에 연결됨</div>
                                )}
                              </div>
                              <div className="col-span-2 text-gray-600">{product.spec || "-"}</div>
                              <div className={`col-span-2 text-right font-medium ${product.current_stock > 0 ? "text-green-600" : "text-gray-400"}`}>
                                {product.current_stock}{product.unit}
                              </div>
                              <div className="col-span-1 flex justify-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPriceHistory(
                                      product.id,
                                      product.internal_name,
                                      companyId,
                                      companyName
                                    );
                                  }}
                                  className="p-1.5 text-indigo-500 hover:bg-indigo-100 rounded-lg transition-colors"
                                  title="단가 추이"
                                >
                                  <TrendingUp className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="col-span-2 flex justify-center">
                                {isAlreadyLinked ? (
                                  <span className="flex items-center gap-1 px-3 py-1.5 bg-gray-400 text-white rounded-lg text-xs">
                                    <Link2 className="h-3 w-3" />
                                    연결됨
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setPendingLinkProduct(product)}
                                    disabled={isRegistering}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 disabled:opacity-50"
                                  >
                                    <Check className="h-3 w-3" />
                                    연결
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <PaginationControls info={pagination} onChange={handlePageChange} />
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-8">
                      <div className="text-center">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">
                          {searchQuery ? `"${searchQuery}"에 대한 검색 결과가 없습니다.` : "등록된 내부 제품이 없습니다."}
                        </p>
                        <button
                          onClick={() => setShowProductFormModal(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          <Plus className="h-4 w-4" />
                          새 내부제품 등록
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-5 py-3 border-t bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOrderStep("add_step1")}
                      className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      이전
                    </button>
                    <button
                      onClick={() => setShowProductFormModal(true)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      새 내부제품 등록
                    </button>
                  </div>
                  <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">
                    닫기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <ProductFormModal
          isOpen={showProductFormModal}
          onClose={() => setShowProductFormModal(false)}
          onSubmit={handleProductFormSubmit}
          defaultType="purchased"
          isLoading={isRegistering}
        />

        {/* 연결 확인 모달 */}
        {pendingLinkProduct && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-5 py-4 border-b bg-indigo-50">
                <h3 className="text-lg font-semibold text-gray-900">제품 연결 확인</h3>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-gray-600 text-center">
                  아래 제품을 연결하시겠습니까?
                </p>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {/* 외부 제품 정보 */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">매입처 제품 (외부)</div>
                    <div className="font-medium text-gray-900">{externalInfo.externalName}</div>
                    {externalInfo.externalSpec && (
                      <div className="text-sm text-gray-600">{externalInfo.externalSpec}</div>
                    )}
                    {externalInfo.externalUnitPrice > 0 && (
                      <div className="text-sm text-indigo-600">{externalInfo.externalUnitPrice.toLocaleString()}원</div>
                    )}
                  </div>

                  {/* 화살표 */}
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 text-indigo-500">
                      <div className="h-px w-8 bg-indigo-300"></div>
                      <Link2 className="h-5 w-5" />
                      <div className="h-px w-8 bg-indigo-300"></div>
                    </div>
                  </div>

                  {/* 내부 제품 정보 */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">내부 재고 제품</div>
                    <div className="font-medium text-gray-900">{pendingLinkProduct.internal_name}</div>
                    {pendingLinkProduct.spec && (
                      <div className="text-sm text-gray-600">{pendingLinkProduct.spec}</div>
                    )}
                    <div className="text-sm text-gray-500 font-mono">{pendingLinkProduct.internal_code}</div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  연결하면 다음부터 "{externalInfo.externalName}"을(를) 입력하면
                  <br />자동으로 내부 재고와 연동됩니다.
                </p>
              </div>

              <div className="px-5 py-3 border-t bg-gray-50 flex justify-end gap-2">
                <button
                  onClick={() => setPendingLinkProduct(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                  disabled={isRegistering}
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    await handleLinkInternalProduct(pendingLinkProduct);
                    setPendingLinkProduct(null);
                  }}
                  disabled={isRegistering}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isRegistering ? (
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
      </>
    );
  }

  // ========== 견적 모드: 기존 1단계 흐름 ==========
  return (
    <>
      {/* 단가 추이 모달 */}
      <PriceHistoryModal
        isOpen={priceHistoryOpen}
        onClose={() => {
          setPriceHistoryOpen(false);
          setPriceHistoryProduct(null);
        }}
        productId={priceHistoryProduct?.productId}
        productName={priceHistoryProduct?.productName}
        companyId={priceHistoryProduct?.companyId}
        companyName={priceHistoryProduct?.companyName}
        priceType={priceHistoryProduct?.priceType || "sales"}
      />

      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
          {/* 헤더 */}
          <div className="px-5 py-4 border-b bg-blue-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">출고 제품 선택</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                내부 재고에서 선택{companyName ? ` (거래처: ${companyName})` : ""}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* 검색 영역 */}
          <div className="px-5 py-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="내부 제품명, 제품코드, 규격으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* 결과 영역 */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            ) : results.length > 0 ? (
              <>
                {/* 테이블 헤더: 선택 | 코드 | 내부제품명 | 규격 | 재고 | 단가 | 추이 */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-gray-600 border-b bg-blue-50/50">
                  <div className="col-span-1 text-center">선택</div>
                  <div className="col-span-2">코드</div>
                  <div className="col-span-3">내부제품명</div>
                  <div className="col-span-2">규격</div>
                  <div className="col-span-1 text-right">재고</div>
                  <div className="col-span-2 text-right">단가</div>
                  <div className="col-span-1 text-center">추이</div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {results.map((product) => (
                    <div
                      key={product.id}
                      className="border-b border-gray-100"
                    >
                      {/* 내부 제품명 행 */}
                      <label
                        className={`grid grid-cols-12 gap-2 px-4 py-2.5 hover:bg-gray-50 items-center text-sm cursor-pointer ${
                          selectedProducts.has(product.id) ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="col-span-1 flex justify-center">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={() => toggleProductSelection(product)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2 text-gray-500 font-mono text-xs">{product.internal_code}</div>
                        <div className="col-span-3">
                          <div className="flex items-center gap-1">
                            <Link2 className="h-3 w-3 text-green-500 shrink-0" />
                            <span className="font-medium text-gray-900 truncate">{product.internal_name}</span>
                          </div>
                        </div>
                        <div className="col-span-2 text-gray-600 truncate">{product.spec || "-"}</div>
                        <div className={`col-span-1 text-right font-medium ${product.current_stock > 0 ? "text-green-600" : "text-gray-400"}`}>
                          {product.current_stock}
                        </div>
                        <div className="col-span-2 text-right text-gray-700">
                          {product.unit_price?.toLocaleString() || "-"}원
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleOpenPriceHistory(product.id, product.internal_name, companyId, companyName);
                            }}
                            className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                            title="단가 추이"
                          >
                            <TrendingUp className="h-4 w-4" />
                          </button>
                        </div>
                      </label>

                      {/* 별칭 행들 */}
                      {product.aliases.map((alias) => {
                        const aliasKey = `${product.id}-${alias.id}`;
                        return (
                          <label
                            key={alias.id}
                            className={`grid grid-cols-12 gap-2 px-4 py-2 hover:bg-blue-50/50 items-center text-sm cursor-pointer border-t border-gray-50 ${
                              selectedProducts.has(aliasKey) ? "bg-blue-50" : "bg-gray-50/30"
                            }`}
                          >
                            <div className="col-span-1 flex justify-center">
                              <input
                                type="checkbox"
                                checked={selectedProducts.has(aliasKey)}
                                onChange={() => toggleProductSelection(product, alias)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                            </div>
                            <div className="col-span-2"></div>
                            <div className="col-span-3">
                              <div className="flex items-center gap-1 text-blue-600">
                                <span className="text-gray-400 ml-2">→</span>
                                <span className="truncate">{alias.external_name}</span>
                              </div>
                            </div>
                            <div className="col-span-2 text-gray-500 truncate text-xs">
                              {alias.external_spec || product.spec || "-"}
                            </div>
                            <div className="col-span-1"></div>
                            <div className="col-span-2 text-right text-gray-600">
                              {alias.external_unit_price?.toLocaleString() || product.unit_price?.toLocaleString() || "-"}원
                            </div>
                            <div className="col-span-1"></div>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <PaginationControls info={pagination} onChange={handlePageChange} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {searchQuery ? `"${searchQuery}"에 대한 검색 결과가 없습니다.` : "등록된 제품이 없습니다."}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    제품 관리에서 먼저 제품을 등록해주세요.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="px-5 py-3 border-t bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {selectedProducts.size > 0 && (
                <span className="font-medium text-blue-600">{selectedProducts.size}개 선택됨</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">
                닫기
              </button>
              <button
                onClick={handleConfirmProductSelection}
                disabled={selectedProducts.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4" />
                확인
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
