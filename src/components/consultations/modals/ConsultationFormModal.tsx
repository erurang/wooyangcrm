"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, AlertCircle, Paperclip, FileText, Upload, Users, UserCheck, Loader2, Save, MessageSquare } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import type { ContactMethod } from "@/types/consultation";
import { CONTACT_METHOD_LABELS } from "@/types/consultation";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import HeadlessSelect from "@/components/ui/HeadlessSelect";

interface Contact {
  id: string;
  contact_name: string;
  level: string;
  resign: boolean;
}

interface User {
  id: string;
  name: string;
  level: string;
}

interface ConsultationFormData {
  date: string;
  follow_up_date: string;
  contact_name: string;
  user_id: string;
  title: string;
  content: string;
  contact_method: ContactMethod;
}

interface FormErrors {
  contact_name?: string;
  content?: string;
  follow_up_date?: string;
}

// 접수 경로 옵션
const CONTACT_METHOD_OPTIONS: { value: ContactMethod; label: string }[] = [
  { value: "phone", label: "전화" },
  { value: "online", label: "온라인문의" },
  { value: "email", label: "메일" },
  { value: "meeting", label: "미팅" },
  { value: "exhibition", label: "전시회" },
  { value: "visit", label: "방문" },
  { value: "sample", label: "샘플" },
  { value: "other", label: "기타" },
];

interface ConsultationFormModalProps {
  mode: "add" | "edit";
  isOpen: boolean;
  onClose: () => void;
  formData: ConsultationFormData;
  setFormData: (data: ConsultationFormData) => void;
  contacts: Contact[];
  users: User[];
  onSubmit: (files?: File[]) => Promise<void>;
  saving: boolean;
  // 파일 첨부 관련
  pendingFiles?: File[];
  onFilesChange?: (files: File[]) => void;
}

export default function ConsultationFormModal({
  mode,
  isOpen,
  onClose,
  formData,
  setFormData,
  contacts,
  users,
  onSubmit,
  saving,
  pendingFiles: externalPendingFiles,
  onFilesChange,
}: ConsultationFormModalProps) {
  const isAddMode = mode === "add";
  const modalTitle = isAddMode ? "상담 내역 추가" : "상담 내역 수정";
  const [errors, setErrors] = useState<FormErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 내부 파일 상태 (외부에서 관리하지 않을 경우)
  const [internalPendingFiles, setInternalPendingFiles] = useState<File[]>([]);
  const pendingFiles = externalPendingFiles ?? internalPendingFiles;
  const setPendingFiles = onFilesChange ?? setInternalPendingFiles;

  // 모달 닫힐 때 파일 초기화
  useEffect(() => {
    if (!isOpen) {
      setInternalPendingFiles([]);
      setIsDragging(false);
    }
  }, [isOpen]);

  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    setPendingFiles([...pendingFiles, ...Array.from(selectedFiles)]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 자식 요소로 이동할 때는 무시
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      setPendingFiles([...pendingFiles, ...Array.from(droppedFiles)]);
    }
  }, [pendingFiles, setPendingFiles]);

  // 파일 제거
  const removePendingFile = (index: number) => {
    setPendingFiles(pendingFiles.filter((_, i) => i !== index));
  };

  // 파일 확장자 아이콘
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
      return "🖼️";
    } else if (["pdf"].includes(ext || "")) {
      return "📄";
    } else if (["doc", "docx"].includes(ext || "")) {
      return "📝";
    } else if (["xls", "xlsx"].includes(ext || "")) {
      return "📊";
    } else if (["ppt", "pptx"].includes(ext || "")) {
      return "📽️";
    } else if (["zip", "rar", "7z"].includes(ext || "")) {
      return "🗜️";
    }
    return "📎";
  };

  // 필드별 검증
  const validateField = useCallback((field: keyof FormErrors, value: string): string | undefined => {
    switch (field) {
      case "contact_name":
        return !value?.trim() ? "담당자를 선택해주세요." : undefined;
      case "content":
        return !value?.trim() ? "상담 내용을 입력해주세요." : undefined;
      case "follow_up_date":
        if (value && formData.date && new Date(value) < new Date(formData.date)) {
          return "후속 날짜는 상담일 이후여야 합니다.";
        }
        return undefined;
      default:
        return undefined;
    }
  }, [formData.date]);

  // 폼 전체 검증
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    const contactError = validateField("contact_name", formData.contact_name);
    if (contactError) newErrors.contact_name = contactError;

    const contentError = validateField("content", formData.content);
    if (contentError) newErrors.content = contentError;

    const followUpError = validateField("follow_up_date", formData.follow_up_date);
    if (followUpError) newErrors.follow_up_date = followUpError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  // 필드 변경 시 에러 클리어
  const handleFieldChange = useCallback((field: keyof ConsultationFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof FormErrors];
        return newErrors;
      });
    }
  }, [formData, setFormData, errors]);

  // 제출 시 검증
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    await onSubmit(pendingFiles.length > 0 ? pendingFiles : undefined);
  }, [validateForm, onSubmit, pendingFiles]);

  // 모달 닫을 때 에러 및 파일 초기화
  const handleClose = useCallback(() => {
    setErrors({});
    setInternalPendingFiles([]);
    onClose();
  }, [onClose]);

  // 모달 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // 입력 필드 스타일 - 모바일에서 더 큰 터치 영역
  const getInputClass = (hasError: boolean, isDisabled = false) => {
    const base = "w-full max-w-full px-3.5 py-2.5 sm:py-2 border rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 transition-all duration-200 box-border";
    if (isDisabled) return `${base} bg-slate-100 border-slate-200 text-slate-400`;
    if (hasError) return `${base} border-red-400 focus:ring-red-500/30 focus:border-red-400 bg-red-50`;
    return `${base} border-slate-200 focus:ring-sky-500/30 focus:border-sky-400 bg-slate-50/50 hover:bg-white placeholder:text-slate-300`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onMouseDown={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* 헤더 - 고정 */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-200/60 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-50 rounded-xl">
                  <MessageSquare className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">{modalTitle}</h3>
                  <p className="text-xs text-slate-400">상담 내역을 입력해주세요</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* 컨텐츠 - 스크롤 */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-4 py-4 sm:px-5 sm:py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="min-w-0">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    상담일
                  </label>
                  <div className="overflow-hidden rounded-lg">
                    <input
                      type="date"
                      value={formData.date}
                      readOnly
                      className={getInputClass(false, true)}
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    후속 날짜
                  </label>
                  <div className="overflow-hidden rounded-lg">
                    <input
                      type="date"
                      value={formData.follow_up_date || ""}
                      onChange={(e) => handleFieldChange("follow_up_date", e.target.value)}
                      className={getInputClass(!!errors.follow_up_date)}
                    />
                  </div>
                  {errors.follow_up_date && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.follow_up_date}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    담당자 <span className="text-red-500">*</span>
                  </label>
                  <HeadlessSelect
                    value={formData.contact_name}
                    onChange={(val) => handleFieldChange("contact_name", val)}
                    options={contacts
                      .filter((contact) => !contact.resign)
                      .map((contact) => ({
                        value: contact.contact_name,
                        label: contact.contact_name,
                        sublabel: contact.level ? `(${contact.level})` : undefined,
                      }))}
                    placeholder="담당자 선택"
                    icon={<Users className="h-4 w-4" />}
                    className={errors.contact_name ? "border-red-500 focus:ring-red-500 bg-red-50" : ""}
                    focusClass={errors.contact_name ? "focus:ring-red-500" : "focus:ring-sky-500"}
                  />
                  {errors.contact_name && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.contact_name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    상담자
                  </label>
                  <HeadlessSelect
                    value={formData.user_id}
                    onChange={(val) => isAddMode && handleFieldChange("user_id", val)}
                    options={users.map((user) => ({
                      value: user.id,
                      label: `${user.name} ${user.level}`,
                    }))}
                    placeholder="상담자"
                    icon={<UserCheck className="h-4 w-4" />}
                    disabled={!isAddMode}
                  />
                </div>
              </div>

              {/* 접수경로 */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  접수 경로
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {CONTACT_METHOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleFieldChange("contact_method", option.value)}
                      className={`px-3 py-2 sm:py-1.5 text-sm rounded-xl border transition-all duration-200 ${
                        formData.contact_method === option.value
                          ? "bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-200"
                          : "bg-white text-slate-600 border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 active:bg-slate-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  제목
                </label>
                <input
                  type="text"
                  placeholder="상담 제목을 입력하세요 (선택사항)"
                  value={formData.title || ""}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  className={getInputClass(false)}
                />
              </div>

              {/* 상담 내용 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  상담 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="상담 내용을 입력하세요..."
                  value={formData.content}
                  onChange={(e) => handleFieldChange("content", e.target.value)}
                  className={`${getInputClass(!!errors.content)} resize-y min-h-[120px]`}
                  rows={5}
                />
                {errors.content ? (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.content}
                  </p>
                ) : isAddMode && (
                  <p className="mt-1 text-xs text-slate-400">
                    담당자를 선택 후 상담을 작성해주세요. 후속 날짜를 설정하면
                    지정날짜 7일 전에 대시보드의 후속 상담 필요 고객 리스트에
                    표시됩니다.
                  </p>
                )}
              </div>

              {/* 파일 첨부 */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    파일 첨부
                  </div>
                </label>

                {/* 첨부된 파일 목록 */}
                {pendingFiles.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {pendingFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2.5 sm:p-2 bg-sky-50 border border-sky-200 rounded-lg"
                      >
                        <span className="text-lg">{getFileIcon(file.name)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-600 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePendingFile(index)}
                          className="p-2 sm:p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 드래그 앤 드롭 영역 - 모바일에서 간소화 */}
                <div
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 active:bg-slate-100 ${
                    isDragging
                      ? "border-sky-500 bg-sky-50/80"
                      : "border-slate-200 hover:border-sky-400 hover:bg-slate-50/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {isDragging ? (
                    <div className="flex flex-col items-center gap-2 text-sky-600">
                      <Upload className="h-8 w-8" />
                      <p className="text-sm font-medium">파일을 여기에 놓으세요</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 sm:gap-2 text-slate-400">
                      <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
                      <p className="text-sm">
                        <span className="font-medium text-sky-600">파일 선택</span>
                        <span className="hidden sm:inline"> 또는 드래그 앤 드롭</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>

            {/* 푸터 - 고정 */}
            <div className="flex justify-end items-center gap-2.5 px-4 py-3.5 sm:px-5 bg-slate-50/50 border-t border-slate-200/60 shrink-0">
              <button
                onClick={handleClose}
                className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-sm shadow-sky-200 hover:shadow-md hover:shadow-sky-200 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    저장
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
