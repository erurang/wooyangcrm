"use client";

import { FileText, Calendar, Clock, User, CreditCard, ChevronDown } from "lucide-react";

interface AppUser {
  id: string;
  name: string;
}

interface NewDocument {
  date: string;
  created_at: string;
  valid_until: string;
  delivery_date: string;
  payment_method: string;
}

interface DocumentInfoSectionProps {
  mode: "add" | "edit";
  type: string;
  user: AppUser;
  newDocument: NewDocument;
  setNewDocument: (doc: any) => void;
  paymentMethods: string[];
  iconColor: string;
  focusClass: string;
}

export default function DocumentInfoSection({
  mode,
  type,
  user,
  newDocument,
  setNewDocument,
  paymentMethods,
  iconColor,
  focusClass,
}: DocumentInfoSectionProps) {
  const isAddMode = mode === "add";

  const getUserLabel = () => {
    switch (type) {
      case "estimate":
        return "견적자";
      case "order":
        return "발주자";
      case "requestQuote":
        return "의뢰자";
      default:
        return "";
    }
  };

  return (
    <div className="bg-gray-50 p-5 rounded-xl">
      <div className="flex items-center gap-2 mb-4 text-gray-800">
        <FileText className={`h-5 w-5 ${iconColor}`} />
        <h4 className="text-lg font-semibold">문서 정보</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 결제조건 */}
        {(isAddMode ? type !== "requestQuote" : true) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              결제조건 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={newDocument.payment_method}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, payment_method: e.target.value })
                }
                className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm ${focusClass} focus:border-transparent appearance-none bg-white`}
              >
                <option value="">선택</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            </div>
          </div>
        )}

        {/* 날짜 필드 */}
        <div>
          {type === "estimate" && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                견적일
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  value={newDocument.date}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, date: e.target.value })
                  }
                  className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm ${focusClass} focus:border-transparent`}
                />
              </div>
            </>
          )}
          {type === "order" && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                발주일
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  disabled={isAddMode}
                  value={newDocument.date}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, date: e.target.value })
                  }
                  className={`w-full pl-10 pr-4 py-2.5 ${
                    isAddMode ? "bg-gray-100" : ""
                  } border border-gray-300 rounded-lg text-sm ${focusClass} focus:border-transparent`}
                />
              </div>
            </>
          )}
          {type === "requestQuote" && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                의뢰일
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  disabled
                  value={isAddMode ? newDocument.date : newDocument.created_at}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </>
          )}
        </div>

        {/* 유효기간/납기일 */}
        <div>
          {type === "estimate" && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                유효기간 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  value={newDocument.valid_until}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, valid_until: e.target.value })
                  }
                  className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm ${focusClass} focus:border-transparent`}
                />
              </div>
            </>
          )}
          {type === "order" && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                납기일 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  value={newDocument.delivery_date}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, delivery_date: e.target.value })
                  }
                  className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm ${focusClass} focus:border-transparent`}
                />
              </div>
            </>
          )}
          {type === "requestQuote" && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                희망견적일 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  value={newDocument.delivery_date}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, delivery_date: e.target.value })
                  }
                  className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm ${focusClass} focus:border-transparent`}
                />
              </div>
            </>
          )}
        </div>

        {/* 작성자 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {getUserLabel()}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              disabled
              type="text"
              value={user?.name}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
