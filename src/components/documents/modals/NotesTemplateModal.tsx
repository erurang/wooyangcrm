"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Edit2, Trash2, FileText, Check, Search, User, BookOpen, Sparkles } from "lucide-react";
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
  useEscapeKey(isOpen, onClose);

  const { templates, isLoading, addTemplate, updateTemplate, deleteTemplate } =
    useNotesTemplates();

  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredTemplates = useMemo(() => {
    let result = templates;

    if (activeTab === "my" && userId) {
      result = result.filter((t) => t.created_by === userId);
    }

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
          className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden"
          >
            {/* 헤더 */}
            <div className="relative bg-gradient-to-r from-sky-600 via-sky-600 to-sky-600 px-6 py-5">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[length:20px_20px]" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <BookOpen size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {mode === "list"
                        ? "특기사항 템플릿"
                        : mode === "add"
                        ? "새 템플릿 만들기"
                        : "템플릿 수정"}
                    </h3>
                    <p className="text-xs text-white/70 mt-0.5">
                      {mode === "list"
                        ? "자주 사용하는 특기사항을 템플릿으로 관리하세요"
                        : "템플릿 내용을 입력하세요"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {mode === "list" && (
                    <button
                      onClick={handleAdd}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-sky-700 bg-white rounded-xl hover:bg-sky-50 transition-all shadow-lg shadow-sky-900/20"
                    >
                      <Plus size={16} />
                      새 템플릿
                    </button>
                  )}
                  <button
                    onClick={handleClose}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {mode === "list" ? (
              <>
                {/* 탭 + 검색 */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between gap-4">
                    {/* 탭 */}
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                      <button
                        onClick={() => setActiveTab("all")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                          activeTab === "all"
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        전체 템플릿
                      </button>
                      <button
                        onClick={() => setActiveTab("my")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                          activeTab === "my"
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        내 템플릿
                      </button>
                    </div>

                    {/* 검색 */}
                    <div className="relative flex-1 max-w-xs">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="템플릿 검색..."
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 2단 레이아웃 */}
                <div className="flex" style={{ height: "420px" }}>
                  {/* 좌측: 템플릿 목록 */}
                  <div className="w-1/2 border-r border-slate-100 overflow-y-auto">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-slate-400 mt-3">불러오는 중...</p>
                      </div>
                    ) : filteredTemplates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <div className="p-4 bg-slate-100 rounded-2xl mb-3">
                          <FileText size={32} className="opacity-50" />
                        </div>
                        <p className="text-sm font-medium">
                          {searchTerm
                            ? "검색 결과가 없습니다"
                            : activeTab === "my"
                            ? "내가 만든 템플릿이 없습니다"
                            : "저장된 템플릿이 없습니다"}
                        </p>
                        <p className="text-xs mt-1">
                          {!searchTerm && "새 템플릿을 추가해보세요!"}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 space-y-2">
                        {filteredTemplates.map((template, index) => (
                          <motion.div
                            key={template.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => setSelectedTemplate(template)}
                            className={`p-4 rounded-xl cursor-pointer transition-all ${
                              selectedTemplate?.id === template.id
                                ? "bg-sky-50 border-2 border-sky-300 shadow-sm"
                                : "bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-slate-700 truncate">
                                  {template.title}
                                </div>
                                <div className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                                  {template.content}
                                </div>
                              </div>
                              {template.created_by === userId && (
                                <span className="shrink-0 px-2 py-0.5 text-[10px] font-medium bg-sky-100 text-sky-600 rounded-full">
                                  MY
                                </span>
                              )}
                            </div>
                            {template.users?.name && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">
                                <User size={12} />
                                {template.users.name}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 우측: 미리보기 */}
                  <div className="w-1/2 bg-gradient-to-br from-slate-50 to-white overflow-y-auto">
                    {selectedTemplate ? (
                      <div className="h-full flex flex-col p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Sparkles size={16} className="text-sky-500" />
                              <h4 className="font-bold text-slate-800">
                                {selectedTemplate.title}
                              </h4>
                            </div>
                            {selectedTemplate.users?.name && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                                <User size={12} />
                                작성자: {selectedTemplate.users.name}
                              </div>
                            )}
                          </div>
                          {selectedTemplate.created_by === userId && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEdit(selectedTemplate)}
                                className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                                title="수정"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(selectedTemplate.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="삭제"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 p-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-600 whitespace-pre-wrap overflow-y-auto shadow-inner">
                          {selectedTemplate.content}
                        </div>

                        <button
                          onClick={() => handleSelect(selectedTemplate.content)}
                          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-sky-700 rounded-xl hover:from-sky-700 hover:to-sky-800 transition-all shadow-lg shadow-sky-500/25"
                        >
                          <Check size={18} />
                          이 템플릿 사용하기
                        </button>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6">
                        <div className="p-5 bg-gradient-to-br from-sky-100 to-sky-100 rounded-2xl mb-4">
                          <FileText size={36} className="text-sky-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-400">템플릿을 선택하세요</p>
                        <p className="text-xs text-slate-400 mt-1">선택하면 미리보기가 표시됩니다</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 푸터 */}
                <div className="flex justify-end items-center px-6 py-4 bg-slate-50 border-t border-slate-100">
                  <button
                    onClick={handleClose}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </>
            ) : (
              /* 추가/수정 폼 */
              <>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">
                      템플릿 제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="예: 기본 납품 조건"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">
                      템플릿 내용 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="특기사항 내용을 입력하세요..."
                      rows={12}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* 푸터 */}
                <div className="flex justify-end items-center gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
                  <button
                    onClick={resetForm}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    disabled={saving}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-sky-700 rounded-xl hover:from-sky-700 hover:to-sky-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-sky-500/25"
                    disabled={saving || !formTitle.trim() || !formContent.trim()}
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        {mode === "add" ? "템플릿 저장" : "수정 완료"}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
