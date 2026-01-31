"use client";

import { X, FileText, Building2, Calendar, Package } from "lucide-react";
import type { InventoryTaskWithDetails, InventoryItem, DocumentItemDB } from "@/types/inventory";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import dayjs from "dayjs";

// 품목 데이터 가져오기 헬퍼 (document_items 테이블 우선, 없으면 content.items 폴백)
function getTaskItems(task: InventoryTaskWithDetails): InventoryItem[] {
  // 신규: document_items 테이블에서 조인된 데이터
  if (task.document?.items && task.document.items.length > 0) {
    return task.document.items.map((item: DocumentItemDB) => ({
      name: item.name,
      spec: item.spec || undefined,
      quantity: item.quantity,
      unit: item.unit || undefined,
      number: item.item_number,
    }));
  }
  // 레거시: content.items JSONB
  return (task.document?.content?.items || []) as InventoryItem[];
}

interface DocumentDetailModalProps {
  task: InventoryTaskWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentDetailModal({
  task,
  isOpen,
  onClose,
}: DocumentDetailModalProps) {
  // ESC 키로 모달 닫기
  useEscapeKey(isOpen && !!task, onClose);

  if (!isOpen || !task) return null;

  const items = getTaskItems(task);
  const isInbound = task.task_type === "inbound";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isInbound ? "bg-green-100" : "bg-blue-100"}`}>
              <FileText className={`h-5 w-5 ${isInbound ? "text-green-600" : "text-blue-600"}`} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {task.document_number}
              </h3>
              <p className="text-sm text-gray-500">
                {isInbound ? "발주서" : "견적서"} 상세
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Building2 className="h-4 w-4" />
                거래처
              </div>
              <div className="font-medium text-gray-900">
                {task.company?.name || "-"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                문서 일자
              </div>
              <div className="font-medium text-gray-900">
                {task.document?.date || "-"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                {isInbound ? "입고 예정일" : "출고 예정일"}
              </div>
              <div className="font-medium text-gray-900">
                {task.expected_date || task.document?.delivery_date || "미정"}
              </div>
            </div>
          </div>

          {/* 품목 목록 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-gray-400" />
              <h4 className="font-medium text-gray-900">품목 목록</h4>
              <span className="text-sm text-gray-500">({items.length}개)</span>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      품명
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      규격
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      수량
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        품목 정보가 없습니다
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {item.number || idx + 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.spec || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                          {item.quantity} {item.unit || "개"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 작업 상태 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">작업 정보</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">상태: </span>
                <span className={`font-medium ${
                  task.status === "completed" ? "text-green-600" :
                  task.status === "assigned" ? "text-blue-600" :
                  task.status === "canceled" ? "text-red-600" :
                  "text-yellow-600"
                }`}>
                  {task.status === "pending" ? "대기" :
                   task.status === "assigned" ? "배정됨" :
                   task.status === "completed" ? "완료" :
                   "취소됨"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">지정자: </span>
                <span className="font-medium text-gray-900">
                  {task.assigner ? `${task.assigner.name} ${task.assigner.level}` : "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">{isInbound ? "입고" : "출고"} 담당: </span>
                <span className="font-medium text-gray-900">
                  {task.assignee ? `${task.assignee.name} ${task.assignee.level}` : "미배정"}
                </span>
              </div>
              {task.status === "completed" && task.completer && (
                <div>
                  <span className="text-gray-500">완료 처리: </span>
                  <span className="font-medium text-gray-900">
                    {task.completer.name} {task.completer.level}
                    {task.completed_at && (
                      <span className="text-gray-400 ml-1">
                        ({dayjs(task.completed_at).format("MM-DD HH:mm")})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
