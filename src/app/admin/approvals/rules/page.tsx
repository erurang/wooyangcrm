"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  X,
  Check,
  DollarSign,
  FolderOpen,
  User,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useApprovalCategories } from "@/hooks/approvals";
import { useUsersList } from "@/hooks/useUserList";
import {
  useApprovalRules,
  getActionLabel,
  getActionColor,
  formatAmount,
  type ApprovalRule,
  type CreateRuleRequest,
  type ApprovalRuleConditions,
} from "@/hooks/useApprovalRules";
import HeadlessSelect from "@/components/ui/HeadlessSelect";

export default function ApprovalRulesPage() {
  const loginUser = useLoginUser();
  const { rules, isLoading, createRule, updateRule, deleteRule, toggleRule } =
    useApprovalRules();
  const { categories } = useApprovalCategories();
  const { users } = useUsersList();

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ApprovalRule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    action: "auto_approve" | "skip_step" | "notify_only";
    priority: number;
    maxAmount: string;
    categoryId: string;
    requesterId: string;
  }>({
    name: "",
    description: "",
    action: "auto_approve",
    priority: 0,
    maxAmount: "",
    categoryId: "",
    requesterId: "",
  });

  // 모달 열기 (추가)
  const handleOpenAddModal = () => {
    setEditingRule(null);
    setFormData({
      name: "",
      description: "",
      action: "auto_approve",
      priority: 0,
      maxAmount: "",
      categoryId: "",
      requesterId: "",
    });
    setIsModalOpen(true);
  };

  // 모달 열기 (수정)
  const handleOpenEditModal = (rule: ApprovalRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      action: rule.action,
      priority: rule.priority,
      maxAmount: rule.conditions.maxAmount?.toString() || "",
      categoryId: rule.conditions.categoryId || "",
      requesterId: rule.conditions.requesterId || "",
    });
    setIsModalOpen(true);
  };

  // 저장
  const handleSubmit = async () => {
    if (!formData.name) {
      alert("규칙 이름을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const conditions: ApprovalRuleConditions = {};
      if (formData.maxAmount) {
        conditions.maxAmount = parseInt(formData.maxAmount);
      }
      if (formData.categoryId) {
        conditions.categoryId = formData.categoryId;
      }
      if (formData.requesterId) {
        conditions.requesterId = formData.requesterId;
      }

      if (editingRule) {
        await updateRule(editingRule.id, {
          name: formData.name,
          description: formData.description || undefined,
          action: formData.action,
          priority: formData.priority,
          conditions,
        });
      } else {
        await createRule({
          name: formData.name,
          description: formData.description || undefined,
          action: formData.action,
          priority: formData.priority,
          conditions,
          created_by: loginUser?.id,
        });
      }

      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 삭제
  const handleDelete = async (rule: ApprovalRule) => {
    if (!confirm(`"${rule.name}" 규칙을 삭제하시겠습니까?`)) return;

    try {
      await deleteRule(rule.id);
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 활성화 토글
  const handleToggle = async (rule: ApprovalRule) => {
    try {
      await toggleRule(rule.id, !rule.is_active);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-50 rounded-lg">
                <Settings className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">
                  결재 자동화 규칙
                </h1>
                <p className="text-xs text-slate-500">
                  조건에 따라 결재를 자동 승인하거나 알림을 보냅니다
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              규칙 추가
            </button>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-sky-600 border-t-transparent rounded-full" />
          </div>
        ) : rules.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-white rounded-lg border border-slate-200"
          >
            <Settings className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              등록된 규칙이 없습니다
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              자동화 규칙을 추가해보세요
            </p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              첫 규칙 추가
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule, index) => {
              const actionColor = getActionColor(rule.action);

              return (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-lg border border-slate-200 overflow-hidden ${
                    !rule.is_active ? "opacity-60" : ""
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${actionColor.bg} ${actionColor.text}`}
                          >
                            {getActionLabel(rule.action)}
                          </span>
                          {!rule.is_active && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-400">
                              비활성
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            우선순위: {rule.priority}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-800">
                          {rule.name}
                        </h3>
                        {rule.description && (
                          <p className="text-sm text-slate-500 mt-1">
                            {rule.description}
                          </p>
                        )}

                        {/* 조건 표시 */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {rule.conditions.maxAmount && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
                              <DollarSign className="h-3 w-3" />
                              {formatAmount(rule.conditions.maxAmount)} 이하
                            </div>
                          )}
                          {rule.conditions.categoryId && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
                              <FolderOpen className="h-3 w-3" />
                              {categories.find(
                                (c) => c.id === rule.conditions.categoryId
                              )?.name || "카테고리"}
                            </div>
                          )}
                          {rule.conditions.requesterId && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
                              <User className="h-3 w-3" />
                              {users.find(
                                (u: { id: string; name: string }) => u.id === rule.conditions.requesterId
                              )?.name || "기안자"}
                            </div>
                          )}
                          {!rule.conditions.maxAmount &&
                            !rule.conditions.categoryId &&
                            !rule.conditions.requesterId && (
                              <div className="text-xs text-slate-400">
                                조건 없음 (모든 결재에 적용)
                              </div>
                            )}
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggle(rule)}
                          className={`p-2 rounded-lg transition-colors ${
                            rule.is_active
                              ? "text-green-600 hover:bg-green-50"
                              : "text-slate-400 hover:bg-slate-100"
                          }`}
                          title={rule.is_active ? "비활성화" : "활성화"}
                        >
                          {rule.is_active ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(rule)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 추가/수정 모달 */}
      <AnimatePresence>
        {isModalOpen && (
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
              className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {editingRule ? "규칙 수정" : "새 규칙 추가"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* 규칙 이름 */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    규칙 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="예: 소액 자동승인"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="규칙에 대한 설명..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                  />
                </div>

                {/* 액션 */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    액션
                  </label>
                  <div className="flex gap-2">
                    {(
                      [
                        "auto_approve",
                        "skip_step",
                        "notify_only",
                      ] as const
                    ).map((action) => {
                      const color = getActionColor(action);
                      return (
                        <button
                          key={action}
                          type="button"
                          onClick={() => setFormData({ ...formData, action })}
                          className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                            formData.action === action
                              ? `${color.bg} ${color.text} border-current`
                              : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {getActionLabel(action)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 조건: 금액 */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    최대 금액 (원)
                  </label>
                  <input
                    type="number"
                    value={formData.maxAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, maxAmount: e.target.value })
                    }
                    placeholder="예: 1000000 (100만원)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    이 금액 이하인 결재에 적용됩니다
                  </p>
                </div>

                {/* 조건: 카테고리 */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    카테고리
                  </label>
                  <HeadlessSelect
                    value={formData.categoryId}
                    onChange={(val) =>
                      setFormData({ ...formData, categoryId: val })
                    }
                    options={[
                      { value: "", label: "전체 카테고리" },
                      ...categories.map((c) => ({
                        value: c.id,
                        label: c.name,
                      })),
                    ]}
                    placeholder="카테고리 선택"
                    icon={<FolderOpen className="h-4 w-4" />}
                  />
                </div>

                {/* 조건: 기안자 */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    특정 기안자
                  </label>
                  <HeadlessSelect
                    value={formData.requesterId}
                    onChange={(val) =>
                      setFormData({ ...formData, requesterId: val })
                    }
                    options={[
                      { value: "", label: "모든 기안자" },
                      ...users.map((u: { id: string; name: string }) => ({
                        value: u.id,
                        label: u.name,
                      })),
                    ]}
                    placeholder="기안자 선택"
                    icon={<User className="h-4 w-4" />}
                  />
                </div>

                {/* 우선순위 */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    우선순위
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    높은 숫자가 먼저 평가됩니다
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-4 bg-slate-50 border-t">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
                >
                  {isSubmitting ? "저장 중..." : editingRule ? "수정" : "추가"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
