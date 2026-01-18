"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Edit2, Trash2, FileText, Check, Search, User } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useNotesTemplates } from "@/hooks/documents/useNotesTemplates";

interface Template {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  users?: { name: string };
}

interface NotesTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (content: string) => void;
  userId?: string;
}

export default function NotesTemplateModal({
  isOpen,
  onClose,
  onSelect,
  userId,
}: NotesTemplateModalProps) {
  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);

  const { templates, isLoading, addTemplate, updateTemplate, deleteTemplate } =
    useNotesTemplates();

  // 상태
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [activeTab, setActiveTab] = useState<"my" | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [saving, setSaving] = useState(false);

  // 필터링된 템플릿
  const filteredTemplates = useMemo(() => {
    let result = templates;

    // 탭 필터
    if (activeTab === "my" && userId) {
      result = result.filter((t) => t.created_by === userId);
    }

    // 검색 필터
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          t.content.toLowerCase().includes(term)
      );
    }

    return result;
  }, [templates, activeTab, userId, searchTerm]);

  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setEditingId(null);
    setMode("list");
  };

  const handleAdd = () => {
    resetForm();
    setMode("add");
  };

  const handleEdit = (template: Template) => {
    setEditingId(template.id);
    setFormTitle(template.title);
    setFormContent(template.content);
    setMode("edit");
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;

    setSaving(true);
    try {
      if (mode === "add") {
        await addTemplate(formTitle, formContent, userId);
      } else if (mode === "edit" && editingId) {
        await updateTemplate(editingId, formTitle, formContent);
      }
      resetForm();
      setSelectedTemplate(null);
    } catch (error) {
      console.error("Error saving template:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 템플릿을 삭제하시겠습니까?")) return;

    try {
      await deleteTemplate(id);
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const handleSelect = (content: string) => {
    onSelect(content);
    onClose();
  };

  const handleClose = () => {
    resetForm();
    setSelectedTemplate(null);
    setSearchTerm("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {mode === "list"
                    ? "특기사항 템플릿"
                    : mode === "add"
                    ? "템플릿 추가"
                    : "템플릿 수정"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {mode === "list" && (
                  <button
                    onClick={handleAdd}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} />
                    추가
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {mode === "list" ? (
              <>
                {/* 탭 + 검색 */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between gap-4">
                    {/* 탭 */}
                    <div className="flex gap-1 bg-gray-200 p-1 rounded-lg">
                      <button
                        onClick={() => setActiveTab("all")}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          activeTab === "all"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        전체
                      </button>
                      <button
                        onClick={() => setActiveTab("my")}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          activeTab === "my"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        내 템플릿
                      </button>
                    </div>

                    {/* 검색 */}
                    <div className="relative flex-1 max-w-xs">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="검색..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* 2단 레이아웃 */}
                <div className="flex" style={{ height: "400px" }}>
                  {/* 좌측: 템플릿 목록 */}
                  <div className="w-1/2 border-r overflow-y-auto">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : filteredTemplates.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {searchTerm
                          ? "검색 결과가 없습니다."
                          : activeTab === "my"
                          ? "내가 만든 템플릿이 없습니다."
                          : "저장된 템플릿이 없습니다."}
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredTemplates.map((template) => (
                          <div
                            key={template.id}
                            onClick={() => setSelectedTemplate(template)}
                            className={`p-3 cursor-pointer transition-colors ${
                              selectedTemplate?.id === template.id
                                ? "bg-blue-50 border-l-2 border-l-blue-600"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {template.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {template.content}
                            </div>
                            {template.users?.name && (
                              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                <User size={10} />
                                {template.users.name}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 우측: 미리보기 */}
                  <div className="w-1/2 p-4 bg-gray-50 overflow-y-auto">
                    {selectedTemplate ? (
                      <div className="h-full flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">
                            {selectedTemplate.title}
                          </h4>
                          {/* 본인이 만든 템플릿만 수정/삭제 가능 */}
                          {selectedTemplate.created_by === userId && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEdit(selectedTemplate)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="수정"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(selectedTemplate.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="삭제"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 p-3 bg-white rounded-lg border text-sm text-gray-700 whitespace-pre-wrap overflow-y-auto">
                          {selectedTemplate.content}
                        </div>

                        {selectedTemplate.users?.name && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                            <User size={12} />
                            작성자: {selectedTemplate.users.name}
                          </div>
                        )}

                        <button
                          onClick={() => handleSelect(selectedTemplate.content)}
                          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Check size={16} />
                          이 템플릿 사용
                        </button>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                        템플릿을 선택하면 미리보기가 표시됩니다.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* 추가/수정 폼 */
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="템플릿 제목"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="특기사항 내용을 입력하세요..."
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            {/* 푸터 */}
            <div className="flex justify-end items-center gap-3 px-4 py-3 bg-gray-50 border-t">
              {mode === "list" ? (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  닫기
                </button>
              ) : (
                <>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={saving}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    disabled={saving || !formTitle.trim() || !formContent.trim()}
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        저장 중...
                      </>
                    ) : (
                      "저장"
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
