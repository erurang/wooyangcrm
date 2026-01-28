"use client";

import { useState } from "react";
import { Plus, Package, Trash2, Link2, TrendingUp } from "lucide-react";
import ProductSearchModal from "@/components/products/ProductSearchModal";
import PriceHistoryModal from "@/components/documents/PriceHistoryModal";

interface Items {
  name: string;
  spec?: string;
  quantity: string | number;
  unit_price: number;
  amount: number;
  product_id?: string;
  internal_name?: string;
  internal_spec?: string;
  original_unit_price?: number; // 선택 시점의 원래 단가 (변동 비교용)
}

interface DocumentItemsGridProps {
  items: Items[];
  setItems: React.Dispatch<React.SetStateAction<Items[]>>;
  addItem: () => void;
  removeItem: (index: number) => void;
  handleQuantityChange: (index: number, value: string) => void;
  handleUnitPriceChange: (index: number, value: string) => void;
  accentColor?: "blue" | "indigo";
  companyId?: string;
  companyName?: string;
  documentType?: "order" | "estimate";
  useProductSearch?: boolean; // true면 제품검색모달 사용, false면 기존 addItem 사용
}

export default function DocumentItemsGrid({
  items,
  setItems,
  addItem,
  removeItem,
  handleQuantityChange,
  handleUnitPriceChange,
  accentColor = "blue",
  companyId,
  companyName,
  documentType = "estimate",
  useProductSearch = false,
}: DocumentItemsGridProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [priceHistoryItem, setPriceHistoryItem] = useState<Items | null>(null);

  // 추가 버튼 클릭 시 핸들러
  const handleAddClick = () => {
    if (useProductSearch) {
      setSearchModalOpen(true);
    } else {
      addItem();
    }
  };

  // 단가 추이 모달 열기
  const openPriceHistory = (item: Items) => {
    if (item.product_id) {
      setPriceHistoryItem(item);
    }
  };

  const handleProductSelect = (product: {
    product_id: string;
    name: string;
    spec: string;
    unit_price: number;
    internal_name: string;
    internal_spec: string;
  }) => {
    // 새 항목 추가
    const newItem: Items = {
      name: product.name,
      spec: product.spec,
      quantity: "1",
      unit_price: product.unit_price,
      amount: product.unit_price,
      product_id: product.product_id,
      internal_name: product.internal_name,
      internal_spec: product.internal_spec,
      original_unit_price: product.unit_price, // 원래 단가 저장
    };
    setItems((prev: Items[]): Items[] => [...prev, newItem]);
    // 모달은 계속 열어둠 (여러 개 추가 가능)
  };

  const colorClasses = {
    blue: {
      headerBg: "bg-blue-50",
      button: "bg-blue-600 hover:bg-blue-700",
      focus: "focus:ring-blue-500",
      text: "text-blue-600 hover:text-blue-800",
      icon: "text-blue-600",
    },
    indigo: {
      headerBg: "bg-indigo-50",
      button: "bg-indigo-600 hover:bg-indigo-700",
      focus: "focus:ring-indigo-500",
      text: "text-indigo-600 hover:text-indigo-800",
      icon: "text-indigo-600",
    },
  };

  const colors = colorClasses[accentColor];

  return (
    <div className="bg-gray-50 p-4 sm:p-5 rounded-xl">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <div className="flex items-center gap-2 text-gray-800">
          <Package className={`h-5 w-5 ${colors.icon}`} />
          <h4 className="text-base sm:text-lg font-semibold">항목</h4>
        </div>
        <button
          onClick={handleAddClick}
          className={`flex items-center text-white ${colors.button} px-3 py-2 sm:py-1.5 rounded-lg text-sm font-medium transition-colors active:opacity-90`}
        >
          <Plus className="h-4 w-4 mr-1" />
          추가
        </button>
      </div>

      <div className="space-y-2 sm:space-y-0 sm:border sm:border-gray-200 sm:rounded-lg sm:overflow-hidden sm:bg-white sm:shadow-sm">
        <div className="max-h-80 sm:max-h-[400px] overflow-y-auto sm:divide-y sm:divide-gray-200">
          {items.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-gray-500">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-300" />
              <p className="mb-2 text-sm">등록된 항목이 없습니다.</p>
              <button
                onClick={handleAddClick}
                className={`inline-flex items-center ${colors.text} text-sm font-medium py-2`}
              >
                <Plus className="h-4 w-4 mr-1" />
                {useProductSearch ? "제품 선택하여 추가" : "항목 추가"}
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={index}>
                {/* 모바일: 카드 레이아웃 */}
                <div className="sm:hidden p-3 border-b last:border-b-0 border-gray-200 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        #{index + 1}
                      </span>
                      {item.product_id && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded" title="제품 연동됨">
                          <Link2 className="h-3 w-3" />
                          연동
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 bg-red-50 text-red-500 hover:bg-red-100 active:bg-red-200 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">제품명 / 규격</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="제품명"
                        value={item.name}
                        onChange={(e) =>
                          setItems((prev: Items[]): Items[] =>
                            prev.map((item, i) =>
                              i === index ? { ...item, name: e.target.value } : item
                            )
                          )
                        }
                        className={`flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 ${colors.focus} focus:border-transparent`}
                      />
                      <input
                        type="text"
                        placeholder="규격"
                        value={item.spec}
                        onChange={(e) =>
                          setItems((prev: Items[]): Items[] =>
                            prev.map((item, i) =>
                              i === index ? { ...item, spec: e.target.value } : item
                            )
                          )
                        }
                        className={`w-24 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 ${colors.focus} focus:border-transparent`}
                      />
                    </div>
                    {/* 연동된 제품 정보 + 단가 변동 표시 (한 줄) */}
                    {item.product_id && item.internal_name && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] truncate">
                        <Link2 className="h-3 w-3 text-green-600 shrink-0" />
                        <span className="text-green-600">연결제품: {item.internal_name}</span>
                        {item.internal_spec && <span className="text-green-600">| 규격: {item.internal_spec}</span>}
                        {item.original_unit_price !== undefined && item.unit_price !== item.original_unit_price && (
                          <span className={item.unit_price > item.original_unit_price ? "text-red-500" : "text-blue-500"}>
                            | 단가: {item.original_unit_price.toLocaleString()}→{item.unit_price.toLocaleString()} ({item.unit_price > item.original_unit_price ? "+" : ""}{((item.unit_price - item.original_unit_price) / item.original_unit_price * 100).toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">수량</label>
                      <input
                        type="text"
                        placeholder="수량"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className={`w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 ${colors.focus} focus:border-transparent text-center`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">단가</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="단가"
                          value={item.unit_price?.toLocaleString()}
                          onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                          className={`flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 ${colors.focus} focus:border-transparent text-right`}
                        />
                        {useProductSearch && item.product_id && (
                          <button
                            type="button"
                            onClick={() => openPriceHistory(item)}
                            className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors shrink-0"
                            title="단가 추이 보기"
                          >
                            <TrendingUp className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">금액</label>
                      <input
                        type="text"
                        placeholder="금액"
                        value={item.amount?.toLocaleString()}
                        readOnly
                        className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm text-right font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 데스크탑: 카드 레이아웃 */}
                <div className="hidden sm:block p-3 hover:bg-gray-50 transition-colors">
                  {/* 상단: 번호 + 연동정보 + 삭제 버튼 */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        #{index + 1}
                      </span>
                      {item.product_id && item.internal_name && (
                        <>
                          <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            <Link2 className="h-3 w-3" />
                            연결제품: {item.internal_name}
                          </span>
                          {item.internal_spec && (
                            <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded">
                              규격: {item.internal_spec}
                            </span>
                          )}
                          {item.original_unit_price !== undefined && (
                            item.unit_price !== item.original_unit_price ? (
                              <span className={`px-2 py-0.5 rounded ${item.unit_price > item.original_unit_price ? "text-red-600 bg-red-50" : "text-blue-600 bg-blue-50"}`}>
                                단가: {item.original_unit_price.toLocaleString()}→{item.unit_price.toLocaleString()} ({item.unit_price > item.original_unit_price ? "+" : ""}{((item.unit_price - item.original_unit_price) / item.original_unit_price * 100).toFixed(1)}%)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-gray-500 bg-gray-100">
                                단가 변동없음
                              </span>
                            )
                          )}
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* 1행: 품명 (60%) | 규격 (40%) */}
                  <div className="grid grid-cols-10 gap-2 mb-2">
                    <div className="col-span-6">
                      <label className="block text-xs text-gray-500 mb-1">품명</label>
                      <input
                        type="text"
                        placeholder="제품명"
                        value={item.name}
                        onChange={(e) =>
                          setItems((prev: Items[]): Items[] =>
                            prev.map((item, i) =>
                              i === index ? { ...item, name: e.target.value } : item
                            )
                          )
                        }
                        className={`w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 ${colors.focus} focus:border-transparent`}
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-xs text-gray-500 mb-1">규격</label>
                      <input
                        type="text"
                        placeholder="규격"
                        value={item.spec}
                        onChange={(e) =>
                          setItems((prev: Items[]): Items[] =>
                            prev.map((item, i) =>
                              i === index ? { ...item, spec: e.target.value } : item
                            )
                          )
                        }
                        className={`w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 ${colors.focus} focus:border-transparent`}
                      />
                    </div>
                  </div>

                  {/* 2행: 수량 (30%) | 단가 (30%) | 금액 (40%) */}
                  <div className="grid grid-cols-10 gap-2">
                    <div className="col-span-3">
                      <label className="block text-xs text-gray-500 mb-1">수량</label>
                      <input
                        type="text"
                        placeholder="수량"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className={`w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 ${colors.focus} focus:border-transparent text-center`}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs text-gray-500 mb-1">단가</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="단가"
                          value={item.unit_price?.toLocaleString()}
                          onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                          className={`flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 ${colors.focus} focus:border-transparent text-right`}
                        />
                        {useProductSearch && item.product_id && (
                          <button
                            type="button"
                            onClick={() => openPriceHistory(item)}
                            className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 rounded transition-colors shrink-0"
                            title="단가 추이 보기"
                          >
                            <TrendingUp className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="col-span-4">
                      <label className="block text-xs text-gray-500 mb-1">금액</label>
                      <input
                        type="text"
                        placeholder="금액"
                        value={item.amount?.toLocaleString()}
                        readOnly
                        className="w-full p-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-right font-medium"
                      />
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 제품 검색 모달 (useProductSearch가 true일 때만) */}
      {useProductSearch && (
        <ProductSearchModal
          isOpen={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          onSelect={handleProductSelect}
          companyId={companyId}
          companyName={companyName}
          documentType={documentType}
        />
      )}

      {/* 단가 추이 모달 (useProductSearch가 true일 때만) */}
      {useProductSearch && priceHistoryItem && (
        <PriceHistoryModal
          isOpen={!!priceHistoryItem}
          onClose={() => setPriceHistoryItem(null)}
          productId={priceHistoryItem.product_id}
          productName={priceHistoryItem.internal_name || priceHistoryItem.name}
          companyId={companyId}
          companyName={companyName}
          priceType={documentType === "order" ? "purchase" : "sales"}
          spec={priceHistoryItem.internal_spec || priceHistoryItem.spec}
        />
      )}
    </div>
  );
}
