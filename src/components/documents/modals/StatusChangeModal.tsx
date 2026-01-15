"use client";

import { AlertCircle, Check, X } from "lucide-react";
import type { Document, StatusReason } from "@/types/document";

interface StatusChangeModalProps {
  statusChangeDoc: Document | null;
  setStatusChangeDoc: (doc: Document | null) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  statusReason: StatusReason;
  setStatusReason: React.Dispatch<React.SetStateAction<StatusReason>>;
  handleStatusChange: () => Promise<void>;
}

export default function StatusChangeModal({
  setStatusChangeDoc,
  selectedStatus,
  setSelectedStatus,
  statusReason,
  setStatusReason,
  handleStatusChange,
}: StatusChangeModalProps) {
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* 모달 헤더 */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold">진행 상태 변경</h2>
          </div>
        </div>

        {/* 모달 내용 */}
        <div className="p-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태 선택
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    selectedStatus === "completed"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                  onClick={() => {
                    setSelectedStatus("completed");
                    setStatusReason((prev: StatusReason) => ({
                      ...prev,
                      completed: {
                        reason: prev.completed?.reason || "",
                      },
                    }));
                  }}
                >
                  <Check
                    className={`h-5 w-5 ${
                      selectedStatus === "completed"
                        ? "text-green-500"
                        : "text-gray-400"
                    }`}
                  />
                  <span className="font-medium">완료</span>
                </button>
                <button
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    selectedStatus === "canceled"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                  onClick={() => {
                    setSelectedStatus("canceled");
                    setStatusReason((prev: StatusReason) => ({
                      ...prev,
                      canceled: {
                        reason: prev.canceled?.reason || "",
                      },
                    }));
                  }}
                >
                  <X
                    className={`h-5 w-5 ${
                      selectedStatus === "canceled"
                        ? "text-red-500"
                        : "text-gray-400"
                    }`}
                  />
                  <span className="font-medium">취소</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedStatus === "completed" ? "완료 사유" : "취소 사유"}
              </label>
              <div className="relative">
                <textarea
                  placeholder={
                    selectedStatus === "completed"
                      ? "완료 사유를 입력하세요."
                      : "취소 사유를 입력하세요."
                  }
                  className={`w-full p-3 border rounded-lg text-sm min-h-[120px] focus:outline-none focus:ring-2 ${
                    selectedStatus === "completed"
                      ? "border-green-300 focus:ring-green-500"
                      : "border-red-300 focus:ring-red-500"
                  }`}
                  value={
                    statusReason[selectedStatus as "completed" | "canceled"]
                      ?.reason || ""
                  }
                  onChange={(e) =>
                    setStatusReason((prev: StatusReason) => ({
                      ...prev,
                      [selectedStatus]: {
                        reason: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-2">
              <button
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setStatusChangeDoc(null)}
              >
                취소
              </button>
              <button
                className={`px-4 py-2.5 text-white rounded-lg text-sm font-medium flex items-center shadow-sm ${
                  selectedStatus === "completed"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                onClick={handleStatusChange}
              >
                {selectedStatus === "completed" ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    완료로 변경
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-1.5" />
                    취소로 변경
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
