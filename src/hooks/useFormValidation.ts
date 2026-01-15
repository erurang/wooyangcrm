"use client";

import { useState, useCallback } from "react";

type ValidationRule<T> = {
  validate: (value: unknown, formData: T) => boolean;
  message: string;
};

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T>[];
};

type FormErrors<T> = {
  [K in keyof T]?: string;
};

interface UseFormValidationReturn<T> {
  errors: FormErrors<T>;
  setError: (field: keyof T, message: string) => void;
  clearError: (field: keyof T) => void;
  clearAllErrors: () => void;
  validateField: (field: keyof T, value: unknown, formData: T) => boolean;
  validateForm: (formData: T) => boolean;
  hasErrors: boolean;
}

/**
 * 폼 검증 훅
 * @param rules - 필드별 검증 규칙
 * @returns 에러 상태 및 검증 함수들
 *
 * @example
 * const { errors, validateForm, validateField, clearError } = useFormValidation({
 *   name: [
 *     { validate: (v) => !!v?.trim(), message: "이름을 입력해주세요." }
 *   ],
 *   email: [
 *     { validate: (v) => !!v?.trim(), message: "이메일을 입력해주세요." },
 *     { validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: "올바른 이메일 형식이 아닙니다." }
 *   ],
 *   startDate: [
 *     { validate: (v, form) => !form.endDate || new Date(v) <= new Date(form.endDate), message: "시작일은 종료일보다 앞이어야 합니다." }
 *   ]
 * });
 */
export function useFormValidation<T extends Record<string, any>>(
  rules: ValidationRules<T>
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<FormErrors<T>>({});

  const setError = useCallback((field: keyof T, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  const clearError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const validateField = useCallback(
    (field: keyof T, value: unknown, formData: T): boolean => {
      const fieldRules = rules[field];
      if (!fieldRules) return true;

      for (const rule of fieldRules) {
        if (!rule.validate(value, formData)) {
          setError(field, rule.message);
          return false;
        }
      }

      clearError(field);
      return true;
    },
    [rules, setError, clearError]
  );

  const validateForm = useCallback(
    (formData: T): boolean => {
      let isValid = true;
      const newErrors: FormErrors<T> = {};

      for (const field of Object.keys(rules) as (keyof T)[]) {
        const fieldRules = rules[field];
        if (!fieldRules) continue;

        const value = formData[field];
        for (const rule of fieldRules) {
          if (!rule.validate(value, formData)) {
            newErrors[field] = rule.message;
            isValid = false;
            break;
          }
        }
      }

      setErrors(newErrors);
      return isValid;
    },
    [rules]
  );

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    setError,
    clearError,
    clearAllErrors,
    validateField,
    validateForm,
    hasErrors,
  };
}

// 공통 검증 규칙 헬퍼
export const validators = {
  required: (message = "필수 입력 항목입니다.") => ({
    validate: (v: unknown) => {
      if (typeof v === "string") return !!v?.trim();
      if (typeof v === "number") return !isNaN(v);
      return !!v;
    },
    message,
  }),

  email: (message = "올바른 이메일 형식이 아닙니다.") => ({
    validate: (v: string) =>
      !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    message,
  }),

  phone: (message = "올바른 전화번호 형식이 아닙니다.") => ({
    validate: (v: string) =>
      !v || /^[\d-]+$/.test(v),
    message,
  }),

  minLength: (min: number, message?: string) => ({
    validate: (v: string) => !v || v.length >= min,
    message: message || `최소 ${min}자 이상 입력해주세요.`,
  }),

  maxLength: (max: number, message?: string) => ({
    validate: (v: string) => !v || v.length <= max,
    message: message || `최대 ${max}자까지 입력 가능합니다.`,
  }),

  dateRange: <T extends Record<string, any>>(
    startField: keyof T,
    endField: keyof T,
    message = "시작일은 종료일보다 앞이어야 합니다."
  ) => ({
    validate: (v: string, formData: T) => {
      const endDate = formData[endField];
      if (!v || !endDate) return true;
      return new Date(v) <= new Date(endDate as string);
    },
    message,
  }),

  numberRange: (
    min: number,
    max: number,
    message?: string
  ) => ({
    validate: (v: number) => {
      if (v === undefined || v === null) return true;
      return v >= min && v <= max;
    },
    message: message || `${min}에서 ${max} 사이의 값을 입력해주세요.`,
  }),

  priceRange: <T extends Record<string, any>>(
    minField: keyof T,
    maxField: keyof T,
    message = "최소 가격은 최대 가격보다 작아야 합니다."
  ) => ({
    validate: (v: number, formData: T) => {
      const maxPrice = formData[maxField];
      if (v === undefined || maxPrice === undefined) return true;
      return v <= (maxPrice as number);
    },
    message,
  }),
};
