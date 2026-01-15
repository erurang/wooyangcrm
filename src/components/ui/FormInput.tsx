"use client";

import { InputHTMLAttributes, ReactNode, forwardRef } from "react";
import FormField from "./FormField";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
  icon?: ReactNode;
  wrapperClassName?: string;
}

/**
 * 폼 인풋 컴포넌트
 * - FormField 래퍼 포함
 * - 아이콘 지원
 * - 에러 시 테두리 빨간색 하이라이트
 */
const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      required = false,
      error,
      icon,
      className = "",
      wrapperClassName = "",
      ...props
    },
    ref
  ) => {
    const baseInputClass =
      "w-full py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors";
    const normalClass = "border-gray-300 focus:ring-blue-500";
    const errorClass = "border-red-500 focus:ring-red-500 bg-red-50";
    const iconPadding = icon ? "pl-10 pr-4" : "px-4";

    return (
      <FormField
        label={label}
        required={required}
        error={error}
        className={wrapperClassName}
      >
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`${baseInputClass} ${iconPadding} ${
              error ? errorClass : normalClass
            } ${className}`}
            {...props}
          />
        </div>
      </FormField>
    );
  }
);

FormInput.displayName = "FormInput";

export default FormInput;
