"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  Users,
  Briefcase,
  User,
  GripVertical,
  Save,
} from "lucide-react";
import { useApprovalCategories } from "@/hooks/approvals";
import {
  useDefaultApprovalLines,
  usePositionHierarchy,
  LINE_TYPE_LABELS,
  APPROVER_TYPE_LABELS,
  type DefaultApprovalLine,
  type CreateDefaultLineRequest,
} from "@/hooks/useDefaultApprovalLines";
import { useUsersList } from "@/hooks/useUserList";
import HeadlessSelect from "@/components/ui/HeadlessSelect";

export default function DefaultApprovalLinesPage() {
  const { categories, isLoading: categoriesLoading } = useApprovalCategories();
  const {
    groupedData,
    isLoading,
    createLine,
    updateLine,
    deleteLine,
    bulkUpdate,
    isCreating,
    isUpdating,
    isBulkUpdating,
  } = useDefaultApprovalLines();
  const { positions } = usePositionHierarchy();
  const { users } = useUsersList();

  // 확장된 카테고리
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // 편집 모드
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingLines, setEditingLines] = useState<
    (Omit<CreateDefaultLineRequest, "category_id"> & { id?: string })[]
  >([]);

  // 추가 모달
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalCategoryId, setAddModalCategoryId] = useState("");
  const [newLineData, setNewLineData] = useState<{
    approver_type: "position" | "role" | "user";
    approver_value: string;
    line_type: "approval" | "review" | "reference";
    is_required: boolean;
  }>({
    approver_type: "position",
    approver_value: "",
    line_type: "approval",
    is_required: true,
  });

  // 카테고리 확장/축소 토글
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // 편집 모드 시작
  const startEditing = (categoryId: string) => {
    const lines = groupedData[categoryId] || [];
    setEditingLines(
      lines.map((line) => ({
        id: line.id,
        approver_type: line.approver_type,
        approver_value: line.approver_value,
        line_type: line.line_type,
        line_order: line.line_order,
        is_required: line.is_required,
      }))
    );
    setEditingCategoryId(categoryId);
  };

  // 편집 취소
  const cancelEditing = () => {
    setEditingCategoryId(null);
    setEditingLines([]);
  };

  // 편집 저장
  const saveEditing = async () => {
    if (!editingCategoryId) return;

    try {
      await bulkUpdate(editingCategoryId, editingLines);
      setEditingCategoryId(null);
      setEditingLines([]);
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 편집 중 라인 추가
  const addEditingLine = () => {
    const maxOrder = Math.max(0, ...editingLines.map((l) => l.line_order));
    setEditingLines([
      ...editingLines,
      {
        approver_type: "position",
        approver_value: "",
        line_type: "approval",
        line_order: maxOrder + 1,
        is_required: true,
      },
    ]);
  };

  // 편집 중 라인 제거
  const removeEditingLine = (index: number) => {
    const newLines = editingLines.filter((_, i) => i !== index);
    // 순서 재정렬
    setEditingLines(
      newLines.map((line, i) => ({ ...line, line_order: i + 1 }))
    );
  };

  // 편집 중 라인 업데이트
  const updateEditingLine = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    const newLines = [...editingLines];
    (newLines[index] as Record<string, unknown>)[field] = value;
    setEditingLines(newLines);
  };

  // 개별 라인 삭제
  const handleDeleteLine = async (lineId: string, categoryName: string) => {
    if (!confirm(`이 결재선 항목을 삭제하시겠습니까?`)) return;

    try {
      await deleteLine(lineId);
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 추가 모달 열기
  const openAddModal = (categoryId: string) => {
    setAddModalCategoryId(categoryId);
    setNewLineData({
      approver_type: "position",
      approver_value: "",
      line_type: "approval",
      is_required: true,
    });
    setIsAddModalOpen(true);
  };

  // 새 라인 추가
  const handleAddLine = async () => {
    if (!addModalCategoryId || !newLineData.approver_value) {
      alert("결재자를 선택해주세요.");
      return;
    }

    try {
      const existingLines = groupedData[addModalCategoryId] || [];
      const maxOrder = Math.max(0, ...existingLines.map((l) => l.line_order));

      await createLine({
        category_id: addModalCategoryId,
        approver_type: newLineData.approver_type,
        approver_value: newLineData.approver_value,
        line_type: newLineData.line_type,
        line_order: maxOrder + 1,
        is_required: newLineData.is_required,
      });

      setIsAddModalOpen(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 결재자 값 표시
  const getApproverDisplay = (
    type: string,
    value: string
  ): string => {
    if (type === "position") {
      return value;
    } else if (type === "user") {
      const user = users.find((u: { id: string; name: string }) => u.id === value);
      return user?.name || value;
    }
    return value;
  };

  // 결재자 선택 옵션
  const getApproverOptions = (type: string) => {
    if (type === "position") {
      return positions.map((p: { position_name: string }) => ({
        value: p.position_name,
        label: p.position_name,
      }));
    } else if (type === "user") {
      return users.map((u: { id: string; name: string; position?: string }) => ({
        value: u.id,
        label: `${u.name}${u.position ? ` (${u.position})` : ""}`,
      }));
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">
                  기본 결재선 설정
                </h1>
                <p className="text-xs text-slate-500">
                  문서 유형별 기본 결재선을 설정합니다
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-4 max-w-4xl mx-auto">
        {isLoading || categoriesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : categories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-white rounded-lg border border-slate-200"
          >
            <Settings className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              등록된 문서 유형이 없습니다
            </h3>
            <p className="text-sm text-slate-400">
              먼저 결재 카테고리를 생성해주세요
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {categories.map((category, index) => {
              const categoryLines = groupedData[category.id] || [];
              const isExpanded = expandedCategories.has(category.id);
              const isEditing = editingCategoryId === category.id;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                >
                  {/* 카테고리 헤더 */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {category.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {categoryLines.length}개의 결재선 설정
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isEditing && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddModal(category.id);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="추가"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(category.id);
                              if (!isExpanded) {
                                toggleCategory(category.id);
                              }
                            }}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="편집"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 결재선 목록 */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-200"
                      >
                        {isEditing ? (
                          /* 편집 모드 */
                          <div className="p-4 bg-slate-50">
                            <div className="space-y-2">
                              {editingLines.map((line, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200"
                                >
                                  <GripVertical className="h-4 w-4 text-slate-400 cursor-move" />
                                  <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                    {line.line_order}
                                  </span>

                                  <HeadlessSelect
                                    value={line.approver_type}
                                    onChange={(val) =>
                                      updateEditingLine(idx, "approver_type", val)
                                    }
                                    options={[
                                      { value: "position", label: "직급" },
                                      { value: "user", label: "특정 사용자" },
                                    ]}
                                    placeholder="타입"
                                  />

                                  <div className="flex-1">
                                    <HeadlessSelect
                                      value={line.approver_value}
                                      onChange={(val) =>
                                        updateEditingLine(idx, "approver_value", val)
                                      }
                                      options={getApproverOptions(line.approver_type)}
                                      placeholder="결재자 선택"
                                    />
                                  </div>

                                  <HeadlessSelect
                                    value={line.line_type}
                                    onChange={(val) =>
                                      updateEditingLine(idx, "line_type", val)
                                    }
                                    options={[
                                      { value: "approval", label: "결재" },
                                      { value: "review", label: "검토" },
                                      { value: "reference", label: "참조" },
                                    ]}
                                    placeholder="유형"
                                  />

                                  <button
                                    onClick={() => removeEditingLine(idx)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between mt-4">
                              <button
                                onClick={addEditingLine}
                                className="flex items-center gap-2 px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
                              >
                                <Plus className="h-4 w-4" />
                                결재선 추가
                              </button>

                              <div className="flex gap-2">
                                <button
                                  onClick={cancelEditing}
                                  className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                                >
                                  취소
                                </button>
                                <button
                                  onClick={saveEditing}
                                  disabled={isBulkUpdating}
                                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                  <Save className="h-4 w-4" />
                                  {isBulkUpdating ? "저장 중..." : "저장"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : categoryLines.length === 0 ? (
                          /* 빈 상태 */
                          <div className="p-6 text-center text-slate-400">
                            <p className="text-sm">설정된 결재선이 없습니다</p>
                            <button
                              onClick={() => openAddModal(category.id)}
                              className="mt-2 text-blue-600 text-sm hover:underline"
                            >
                              결재선 추가하기
                            </button>
                          </div>
                        ) : (
                          /* 읽기 모드 */
                          <div className="p-4">
                            <div className="space-y-2">
                              {categoryLines.map((line) => (
                                <div
                                  key={line.id}
                                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                                >
                                  <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                    {line.line_order}
                                  </span>

                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded ${
                                      line.line_type === "approval"
                                        ? "bg-blue-100 text-blue-700"
                                        : line.line_type === "review"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {LINE_TYPE_LABELS[line.line_type]}
                                  </span>

                                  <div className="flex items-center gap-2 flex-1">
                                    {line.approver_type === "position" ? (
                                      <Briefcase className="h-4 w-4 text-slate-400" />
                                    ) : (
                                      <User className="h-4 w-4 text-slate-400" />
                                    )}
                                    <span className="text-slate-800">
                                      {getApproverDisplay(
                                        line.approver_type,
                                        line.approver_value
                                      )}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      ({APPROVER_TYPE_LABELS[line.approver_type]})
                                    </span>
                                  </div>

                                  {!line.is_required && (
                                    <span className="text-xs text-slate-400">
                                      선택
                                    </span>
                                  )}

                                  <button
                                    onClick={() =>
                                      handleDeleteLine(line.id, category.name)
                                    }
                                    className="p-1 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 추가 모달 */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">결재선 추가</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* 결재자 타입 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    결재자 유형
                  </label>
                  <HeadlessSelect
                    value={newLineData.approver_type}
                    onChange={(val) =>
                      setNewLineData({
                        ...newLineData,
                        approver_type: val as "position" | "role" | "user",
                        approver_value: "",
                      })
                    }
                    options={[
                      { value: "position", label: "직급 기반" },
                      { value: "user", label: "특정 사용자" },
                    ]}
                    placeholder="결재자 유형 선택"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {newLineData.approver_type === "position"
                      ? "기안자의 팀/부서에서 해당 직급의 상위자를 자동으로 찾습니다"
                      : "지정된 사용자가 항상 결재자가 됩니다"}
                  </p>
                </div>

                {/* 결재자 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    결재자 {newLineData.approver_type === "position" ? "직급" : ""}
                  </label>
                  <HeadlessSelect
                    value={newLineData.approver_value}
                    onChange={(val) =>
                      setNewLineData({ ...newLineData, approver_value: val })
                    }
                    options={getApproverOptions(newLineData.approver_type)}
                    placeholder={
                      newLineData.approver_type === "position"
                        ? "직급 선택"
                        : "사용자 선택"
                    }
                  />
                </div>

                {/* 결재선 유형 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    결재선 유형
                  </label>
                  <div className="flex gap-2">
                    {(["approval", "review", "reference"] as const).map(
                      (type) => (
                        <button
                          key={type}
                          onClick={() =>
                            setNewLineData({ ...newLineData, line_type: type })
                          }
                          className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                            newLineData.line_type === type
                              ? type === "approval"
                                ? "bg-blue-50 text-blue-700 border-blue-300"
                                : type === "review"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                                : "bg-gray-50 text-gray-700 border-gray-300"
                              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {LINE_TYPE_LABELS[type]}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* 필수 여부 */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_required"
                    checked={newLineData.is_required}
                    onChange={(e) =>
                      setNewLineData({
                        ...newLineData,
                        is_required: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="is_required"
                    className="text-sm text-gray-700"
                  >
                    필수 결재 (체크 해제 시 생략 가능)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-4 bg-gray-50 border-t">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isCreating}
                >
                  취소
                </button>
                <button
                  onClick={handleAddLine}
                  disabled={isCreating || !newLineData.approver_value}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isCreating ? "추가 중..." : "추가"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
