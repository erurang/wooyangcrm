"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Package,
  Search,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { CreateLotRequest } from "@/types/inventory";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useLotMutations } from "@/hooks/inventory/useLots";
import { useLoginUser } from "@/context/login";

interface LotCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Product {
  id: string;
  internal_code: string | null;
  internal_name: string;
  unit: string | null;
}

export default function LotCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: LotCreateModalProps) {
  const loginUser = useLoginUser();
  const { createLot, isCreating } = useLotMutations();

  // 제품 검색
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // 폼 상태
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [location, setLocation] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [receivedAt, setReceivedAt] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);

  // 제품 검색
  useEffect(() => {
    const search = async () => {
      if (!productSearch || productSearch.length < 2) {
        setProducts([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(productSearch)}&limit=10`
        );
        const data = await res.json();
        setProducts(data.products || []);
        setShowProductDropdown(true);
      } catch (e) {
        console.error("Product search error:", e);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // 제품 선택 시 단위 자동 설정
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductSearch(product.internal_name);
    setShowProductDropdown(false);
    if (product.unit) {
      setUnit(product.unit);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedProduct) {
      setError("제품을 선택해주세요.");
      return;
    }

    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      setError("수량을 올바르게 입력해주세요.");
      return;
    }

    const lotData: CreateLotRequest & { user_id?: string } = {
      product_id: selectedProduct.id,
      initial_quantity: qty,
      unit: unit || undefined,
      spec_value: specValue || undefined,
      location: location || undefined,
      unit_cost: unitCost ? parseFloat(unitCost) : undefined,
      received_at: receivedAt || undefined,
      notes: notes || undefined,
      user_id: loginUser?.id,
    };

    const result = await createLot(lotData);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "LOT 생성 중 오류가 발생했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-sky-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-100">
              <Plus className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800">새 LOT 등록</h3>
              <p className="text-sm text-slate-400">수동 입고 LOT 생성</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="p-2 hover:bg-sky-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* 본문 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-4">
          {/* 제품 검색 */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-600 mb-1">
              제품 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setSelectedProduct(null);
                }}
                onFocus={() => products.length > 0 && setShowProductDropdown(true)}
                placeholder="제품명 또는 코드로 검색..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                disabled={isCreating}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
              )}
            </div>

            {/* 제품 드롭다운 */}
            {showProductDropdown && products.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelectProduct(product)}
                    className="w-full text-left px-4 py-3 hover:bg-sky-50 border-b border-slate-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-800">
                        {product.internal_name}
                      </span>
                    </div>
                    {product.internal_code && (
                      <div className="text-sm text-slate-400 ml-6">
                        {product.internal_code}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* 선택된 제품 표시 */}
            {selectedProduct && (
              <div className="mt-2 p-2 bg-sky-50 rounded-lg flex items-center gap-2">
                <Package className="h-4 w-4 text-sky-600" />
                <span className="text-sm font-medium text-sky-800">
                  {selectedProduct.internal_name}
                </span>
                {selectedProduct.internal_code && (
                  <span className="text-sm text-sky-600">
                    ({selectedProduct.internal_code})
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setProductSearch("");
                  }}
                  className="ml-auto text-sky-600 hover:text-sky-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* 수량 & 단위 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                수량 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                step="any"
                min="0"
                placeholder="0"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                disabled={isCreating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                단위
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="m, 개, 롤..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                disabled={isCreating}
              />
            </div>
          </div>

          {/* 규격 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              규격
            </label>
            <input
              type="text"
              value={specValue}
              onChange={(e) => setSpecValue(e.target.value)}
              placeholder="10m, 1000x1000mm..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              disabled={isCreating}
            />
          </div>

          {/* 위치 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              보관 위치
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="창고A-선반1..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              disabled={isCreating}
            />
          </div>

          {/* 단가 & 입고일 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                단가 (원)
              </label>
              <input
                type="number"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                step="any"
                min="0"
                placeholder="0"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                disabled={isCreating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                입고일
              </label>
              <input
                type="date"
                value={receivedAt}
                onChange={(e) => setReceivedAt(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                disabled={isCreating}
              />
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              메모
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="메모..."
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
              disabled={isCreating}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </form>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!selectedProduct || !quantity || isCreating}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                등록 중...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                LOT 등록
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
