"use client";

import { Plus, Package, Trash2 } from "lucide-react";

interface Items {
  name: string;
  spec?: string;
  quantity: string | number;
  unit_price: number;
  amount: number;
}

interface DocumentItemsGridProps {
  items: Items[];
  setItems: React.Dispatch<React.SetStateAction<Items[]>>;
  addItem: () => void;
  removeItem: (index: number) => void;
  handleQuantityChange: (index: number, value: string) => void;
  handleUnitPriceChange: (index: number, value: string) => void;
  accentColor?: "blue" | "indigo";
}

export default function DocumentItemsGrid({
  items,
  setItems,
  addItem,
  removeItem,
  handleQuantityChange,
  handleUnitPriceChange,
  accentColor = "blue",
}: DocumentItemsGridProps) {
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
          onClick={addItem}
          className={`flex items-center text-white ${colors.button} px-3 py-2 sm:py-1.5 rounded-lg text-sm font-medium transition-colors active:opacity-90`}
        >
          <Plus className="h-4 w-4 mr-1" />
          추가
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        {/* 데스크탑 헤더 - 모바일에서 숨김 */}
        <div
          className={`hidden sm:grid ${colors.headerBg} px-4 py-3 border-b border-gray-200 grid-cols-12 gap-2 text-xs font-medium text-gray-700`}
        >
          <div className="col-span-5 grid grid-cols-2 gap-2">
            <span>제품명</span>
            <span>규격</span>
          </div>
          <div className="col-span-2">수량</div>
          <div className="col-span-2">단가</div>
          <div className="col-span-2">금액</div>
          <div className="col-span-1">관리</div>
        </div>

        <div className="max-h-80 sm:max-h-64 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-gray-500">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-300" />
              <p className="mb-2 text-sm">등록된 항목이 없습니다.</p>
              <button
                onClick={addItem}
                className={`inline-flex items-center ${colors.text} text-sm font-medium py-2`}
              >
                <Plus className="h-4 w-4 mr-1" />
                항목 추가하기
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={index}>
                {/* 모바일: 카드 레이아웃 */}
                <div className="sm:hidden p-3 border-b last:border-b-0 border-gray-200 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      #{index + 1}
                    </span>
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
                    <div className="grid grid-cols-2 gap-2">
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
                        className={`w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 ${colors.focus} focus:border-transparent`}
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
                        className={`w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 ${colors.focus} focus:border-transparent`}
                      />
                    </div>
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
                      <input
                        type="text"
                        placeholder="단가"
                        value={item.unit_price?.toLocaleString()}
                        onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                        className={`w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 ${colors.focus} focus:border-transparent text-right`}
                      />
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

                {/* 데스크탑: 테이블 레이아웃 */}
                <div className="hidden sm:grid px-4 py-3 border-b last:border-b-0 border-gray-200 grid-cols-12 gap-2 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-5 grid grid-cols-2 gap-2">
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
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="수량"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      className={`w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 ${colors.focus} focus:border-transparent`}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="단가"
                      value={item.unit_price?.toLocaleString()}
                      onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                      className={`w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 ${colors.focus} focus:border-transparent`}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="금액"
                      value={item.amount?.toLocaleString()}
                      readOnly
                      className="w-full p-2 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      onClick={() => removeItem(index)}
                      className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
