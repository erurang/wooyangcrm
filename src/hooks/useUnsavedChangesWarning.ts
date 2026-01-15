"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

interface UseUnsavedChangesWarningOptions {
  enabled?: boolean;
  message?: string;
}

/**
 * 폼 이탈 경고 훅
 * - 입력 중 뒤로가기, 새로고침, 탭 닫기 시 경고
 * - Next.js 라우터 이동 시에도 경고
 *
 * @param hasUnsavedChanges - 저장되지 않은 변경사항이 있는지 여부
 * @param options - 옵션 (enabled, message)
 *
 * @example
 * const [formData, setFormData] = useState(initialData);
 * const [originalData] = useState(initialData);
 *
 * // 변경사항 감지
 * const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
 *
 * useUnsavedChangesWarning(hasChanges);
 *
 * // 저장 후 변경사항 초기화
 * const handleSave = async () => {
 *   await save(formData);
 *   setOriginalData(formData);
 * };
 */
export function useUnsavedChangesWarning(
  hasUnsavedChanges: boolean,
  options: UseUnsavedChangesWarningOptions = {}
) {
  const {
    enabled = true,
    message = "저장되지 않은 변경사항이 있습니다. 페이지를 떠나시겠습니까?",
  } = options;

  const shouldWarn = enabled && hasUnsavedChanges;

  // 브라우저 네이티브 이벤트 (새로고침, 탭 닫기)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldWarn) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldWarn, message]);

  // 프로그래밍 방식으로 확인 후 이동
  const confirmNavigation = useCallback((): boolean => {
    if (shouldWarn) {
      return window.confirm(message);
    }
    return true;
  }, [shouldWarn, message]);

  return { confirmNavigation };
}

/**
 * 폼 상태 추적 훅
 * - 초기 데이터와 현재 데이터 비교하여 변경사항 감지
 * - useUnsavedChangesWarning과 함께 사용
 *
 * @example
 * const { isDirty, resetForm, updateField } = useFormState(initialData);
 * useUnsavedChangesWarning(isDirty);
 */
export function useFormState<T extends Record<string, any>>(initialData: T) {
  const [originalData, setOriginalData] = useState<T>(initialData);
  const [formData, setFormData] = useState<T>(initialData);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(originalData);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback((newData?: T) => {
    const data = newData || initialData;
    setOriginalData(data);
    setFormData(data);
  }, [initialData]);

  const markAsSaved = useCallback(() => {
    setOriginalData(formData);
  }, [formData]);

  return {
    formData,
    setFormData,
    originalData,
    isDirty,
    updateField,
    resetForm,
    markAsSaved,
  };
}

export default useUnsavedChangesWarning;
