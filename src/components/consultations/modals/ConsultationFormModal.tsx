"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircularProgress } from "@mui/material";
import { X, AlertCircle } from "lucide-react";
import { useState, useCallback } from "react";
import type { ContactMethod } from "@/types/consultation";
import { CONTACT_METHOD_LABELS } from "@/types/consultation";
import { useEscapeKey } from "@/hooks/useEscapeKey";

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
  onSubmit: () => Promise<void>;
  saving: boolean;
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
}: ConsultationFormModalProps) {
  const isAddMode = mode === "add";
  const modalTitle = isAddMode ? "상담 내역 추가" : "상담 내역 수정";
  const [errors, setErrors] = useState<FormErrors>({});

  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);

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
    await onSubmit();
  }, [validateForm, onSubmit]);

  // 모달 닫을 때 에러 초기화
  const handleClose = useCallback(() => {
    setErrors({});
    onClose();
  }, [onClose]);

  // 입력 필드 스타일
  const getInputClass = (hasError: boolean, isDisabled = false) => {
    const base = "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors";
    if (isDisabled) return `${base} bg-gray-100 border-gray-300`;
    if (hasError) return `${base} border-red-500 focus:ring-red-500 bg-red-50`;
    return `${base} border-gray-300 focus:ring-blue-500`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{modalTitle}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상담일
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    readOnly
                    className={getInputClass(false, true)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    후속 날짜
                  </label>
                  <input
                    type="date"
                    value={formData.follow_up_date || ""}
                    onChange={(e) => handleFieldChange("follow_up_date", e.target.value)}
                    className={getInputClass(!!errors.follow_up_date)}
                  />
                  {errors.follow_up_date && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.follow_up_date}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    담당자 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.contact_name}
                    onChange={(e) => handleFieldChange("contact_name", e.target.value)}
                    className={getInputClass(!!errors.contact_name)}
                  >
                    <option value="">담당자 선택</option>
                    {contacts.map((contact) => {
                      if (!contact.resign)
                        return (
                          <option key={contact.id} value={contact.contact_name}>
                            {contact.contact_name}{" "}
                            {contact.level && `(${contact.level})`}
                          </option>
                        );
                      return null;
                    })}
                  </select>
                  {errors.contact_name && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.contact_name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상담자
                  </label>
                  <select
                    value={formData.user_id}
                    disabled
                    className={getInputClass(false, true)}
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 접수경로 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  접수 경로
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONTACT_METHOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleFieldChange("contact_method", option.value)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        formData.contact_method === option.value
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상담 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="상담 내용을 입력하세요..."
                  value={formData.content}
                  onChange={(e) => handleFieldChange("content", e.target.value)}
                  className={`${getInputClass(!!errors.content)} resize-none`}
                  rows={8}
                />
                {errors.content ? (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.content}
                  </p>
                ) : isAddMode && (
                  <p className="mt-1 text-xs text-gray-500">
                    담당자를 선택 후 상담을 작성해주세요. 후속 날짜를 설정하면
                    지정날짜 7일 전에 대시보드의 후속 상담 필요 고객 리스트에
                    표시됩니다.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end items-center gap-3 px-5 py-4 bg-gray-50 border-t">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <CircularProgress size={16} className="mr-2" />
                    저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
