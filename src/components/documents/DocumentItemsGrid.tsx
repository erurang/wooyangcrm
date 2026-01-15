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
    <div className="bg-gray-50 p-5 rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-gray-800">
          <Package className={`h-5 w-5 ${colors.icon}`} />
          <h4 className="text-lg font-semibold">항목</h4>
        </div>
        <button
          onClick={addItem}
          className={`flex items-center text-white ${colors.button} px-3 py-1.5 rounded-lg text-sm font-medium transition-colors`}
        >
          <Plus className="h-4 w-4 mr-1" />
          추가
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div
          className={`${colors.headerBg} px-4 py-3 border-b border-gray-200 grid grid-cols-12 gap-2 text-xs font-medium text-gray-700`}
        >
          <div className="col-span-4">제품명</div>
          <div className="col-span-2">규격</div>
          <div className="col-span-1">수량</div>
          <div className="col-span-2">단가</div>
          <div className="col-span-2">금액</div>
          <div className="col-span-1">관리</div>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="mb-2">등록된 항목이 없습니다.</p>
              <button
                onClick={addItem}
                className={`inline-flex items-center ${colors.text} text-sm font-medium`}
              >
                <Plus className="h-4 w-4 mr-1" />
                항목 추가하기
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={index}
                className="px-4 py-3 border-b last:border-b-0 border-gray-200 grid grid-cols-12 gap-2 items-center hover:bg-gray-50 transition-colors"
              >
                <div className="col-span-4">
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
                <div className="col-span-2">
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
                <div className="col-span-1">
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
