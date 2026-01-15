"use client";

import { SelectHTMLAttributes, ReactNode, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import FormField from "./FormField";

interface Option {
  value: string;
  label: string;
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  error?: string;
  icon?: ReactNode;
  options: Option[];
  placeholder?: string;
  wrapperClassName?: string;
}

/**
 * 폼 셀렉트 컴포넌트
 * - FormField 래퍼 포함
 * - 아이콘 지원
 * - 에러 시 테두리 빨간색 하이라이트
 */
const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      required = false,
      error,
      icon,
      options,
      placeholder = "선택",
      className = "",
      wrapperClassName = "",
      ...props
    },
    ref
  ) => {
    const baseSelectClass =
      "w-full py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent appearance-none bg-white transition-colors";
    const normalClass = "border-gray-300 focus:ring-blue-500";
    const errorClass = "border-red-500 focus:ring-red-500 bg-red-50";
    const iconPadding = icon ? "pl-10 pr-10" : "pl-4 pr-10";

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
          <select
            ref={ref}
            className={`${baseSelectClass} ${iconPadding} ${
              error ? errorClass : normalClass
            } ${className}`}
            {...props}
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
        </div>
      </FormField>
    );
  }
);

FormSelect.displayName = "FormSelect";

export default FormSelect;
