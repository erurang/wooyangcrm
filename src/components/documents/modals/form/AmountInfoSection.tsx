"use client";

import { DollarSign } from "lucide-react";

interface AmountInfoSectionProps {
  mode: "add" | "edit";
  koreanAmount: string;
  totalAmount: number;
  iconColor: string;
}

export default function AmountInfoSection({
  mode,
  koreanAmount,
  totalAmount,
  iconColor,
}: AmountInfoSectionProps) {
  const isAddMode = mode === "add";

  return (
    <div className="bg-slate-50 p-5 rounded-xl">
      <div className="flex items-center gap-2 mb-4 text-slate-700">
        <DollarSign className={`h-5 w-5 ${iconColor}`} />
        <h4 className="text-lg font-semibold">금액 정보</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            총액金
          </label>
          <div className="relative">
            <input
              type="text"
              value={isAddMode ? `${koreanAmount}` : `${koreanAmount} 원`}
              readOnly
              className="w-full pl-4 pr-4 py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            원
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              value={`${totalAmount?.toLocaleString()}`}
              readOnly
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
