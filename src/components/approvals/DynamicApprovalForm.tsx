"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Calendar } from "lucide-react";

// 폼 필드 정의 타입
export interface FormField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "date" | "number" | "currency" | "file" | "table" | "richtext";
  options?: string[];
  required?: boolean;
  readonly?: boolean;
  computed?: boolean | string;
  accept?: string;
  columns?: Array<{
    name: string;
    label: string;
    type: string;
    computed?: boolean;
  }>;
}

export interface FormSchema {
  type: string;
  title: string;
  fields: FormField[];
}

interface DynamicApprovalFormProps {
  schema: FormSchema | null;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  disabled?: boolean;
}

/**
 * 동적 결재 문서 폼 컴포넌트
 * form_schema를 기반으로 다양한 타입의 입력 필드를 렌더링합니다.
 */
export default function DynamicApprovalForm({
  schema,
  values,
  onChange,
  disabled = false,
}: DynamicApprovalFormProps) {
  // 테이블 데이터 관리
  const [tableData, setTableData] = useState<Record<string, Array<Record<string, unknown>>>>({});

  // 초기 테이블 데이터 설정
  useEffect(() => {
    if (schema?.fields) {
      const initialTableData: Record<string, Array<Record<string, unknown>>> = {};
      schema.fields.forEach((field) => {
        if (field.type === "table" && !tableData[field.name]) {
          initialTableData[field.name] = values[field.name] as Array<Record<string, unknown>> || [{}];
        }
      });
      if (Object.keys(initialTableData).length > 0) {
        setTableData((prev) => ({ ...prev, ...initialTableData }));
      }
    }
  }, [schema]);

  // 필드 값 변경 핸들러
  const handleFieldChange = (fieldName: string, value: unknown) => {
    const newValues = { ...values, [fieldName]: value };

    // 날짜 관련 자동 계산 (연차 일수)
    if (schema?.type === "annual_leave" && (fieldName === "start_date" || fieldName === "end_date")) {
      const startDate = fieldName === "start_date" ? value : values.start_date;
      const endDate = fieldName === "end_date" ? value : values.end_date;
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        newValues.days = days > 0 ? days : 0;
      }
    }

    onChange(newValues);
  };

  // 테이블 행 추가
  const handleAddTableRow = (fieldName: string) => {
    const currentData = tableData[fieldName] || [];
    const newData = [...currentData, {}];
    setTableData((prev) => ({ ...prev, [fieldName]: newData }));
    handleFieldChange(fieldName, newData);
  };

  // 테이블 행 삭제
  const handleRemoveTableRow = (fieldName: string, index: number) => {
    const currentData = tableData[fieldName] || [];
    const newData = currentData.filter((_, i) => i !== index);
    setTableData((prev) => ({ ...prev, [fieldName]: newData }));
    handleFieldChange(fieldName, newData);
  };

  // 테이블 셀 값 변경
  const handleTableCellChange = (
    fieldName: string,
    rowIndex: number,
    columnName: string,
    value: unknown,
    columns?: FormField["columns"]
  ) => {
    const currentData = tableData[fieldName] || [];
    const newData = [...currentData];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [columnName]: value,
    };

    // 금액 자동 계산 (수량 * 단가)
    if (columns) {
      const hasQuantity = columns.some((c) => c.name === "quantity");
      const hasUnitPrice = columns.some((c) => c.name === "unit_price");
      const hasTotalPrice = columns.some((c) => c.name === "total_price" && c.computed);

      if (hasQuantity && hasUnitPrice && hasTotalPrice) {
        const quantity = Number(newData[rowIndex].quantity) || 0;
        const unitPrice = Number(newData[rowIndex].unit_price) || 0;
        newData[rowIndex].total_price = quantity * unitPrice;
      }
    }

    setTableData((prev) => ({ ...prev, [fieldName]: newData }));
    handleFieldChange(fieldName, newData);
  };

  // 총 금액 계산 (구매요청서)
  const totalAmount = useMemo(() => {
    const itemsField = schema?.fields.find((f) => f.name === "items" && f.type === "table");
    if (itemsField && tableData.items) {
      return tableData.items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
    }
    return 0;
  }, [tableData.items, schema]);

  // 스키마가 없으면 기본 텍스트 영역만 표시
  if (!schema || !schema.fields || schema.fields.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            기안 내용
          </label>
          <textarea
            value={(values.content as string) || ""}
            onChange={(e) => handleFieldChange("content", e.target.value)}
            placeholder="기안 내용을 입력하세요"
            rows={8}
            disabled={disabled}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none disabled:bg-slate-100"
          />
        </div>
      </div>
    );
  }

  // 필드 렌더링
  const renderField = (field: FormField) => {
    const value = values[field.name];

    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.label}
            disabled={disabled || field.readonly}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
          />
        );

      case "textarea":
      case "richtext":
        return (
          <textarea
            value={(value as string) || ""}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.label}
            rows={field.type === "richtext" ? 8 : 4}
            disabled={disabled || field.readonly}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none disabled:bg-slate-100"
          />
        );

      case "select":
        return (
          <select
            value={(value as string) || ""}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            disabled={disabled || field.readonly}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
          >
            <option value="">선택하세요</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "date":
        return (
          <div className="relative">
            <input
              type="date"
              value={(value as string) || ""}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              disabled={disabled || field.readonly}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        );

      case "number":
        return (
          <input
            type="number"
            value={(value as number) ?? ""}
            onChange={(e) => handleFieldChange(field.name, e.target.value ? Number(e.target.value) : "")}
            placeholder={field.label}
            disabled={disabled || field.readonly}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
          />
        );

      case "currency":
        return (
          <div className="relative">
            <input
              type="text"
              value={value !== undefined ? Number(value).toLocaleString() : ""}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/,/g, "");
                handleFieldChange(field.name, numericValue ? Number(numericValue) : "");
              }}
              placeholder="0"
              disabled={disabled || field.readonly}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 text-right pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">원</span>
          </div>
        );

      case "file":
        return (
          <input
            type="file"
            accept={field.accept}
            onChange={(e) => handleFieldChange(field.name, e.target.files)}
            disabled={disabled}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:bg-sky-50 file:text-sky-700"
          />
        );

      case "table":
        const rows = tableData[field.name] || [{}];
        return (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {field.columns?.map((col) => (
                    <th key={col.name} className="px-3 py-2 text-left font-medium text-slate-700">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-3 py-2 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-slate-100">
                    {field.columns?.map((col) => (
                      <td key={col.name} className="px-2 py-2">
                        {col.computed ? (
                          <span className="px-3 py-2 block text-right">
                            {Number(row[col.name] || 0).toLocaleString()}
                          </span>
                        ) : col.type === "currency" || col.type === "number" ? (
                          <input
                            type="text"
                            value={row[col.name] !== undefined ? Number(row[col.name]).toLocaleString() : ""}
                            onChange={(e) => {
                              const numericValue = e.target.value.replace(/,/g, "");
                              handleTableCellChange(
                                field.name,
                                rowIndex,
                                col.name,
                                numericValue ? Number(numericValue) : "",
                                field.columns
                              );
                            }}
                            disabled={disabled}
                            className="w-full px-3 py-1 border border-slate-200 rounded text-right focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        ) : (
                          <input
                            type="text"
                            value={(row[col.name] as string) || ""}
                            onChange={(e) =>
                              handleTableCellChange(field.name, rowIndex, col.name, e.target.value, field.columns)
                            }
                            disabled={disabled}
                            className="w-full px-3 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTableRow(field.name, rowIndex)}
                          disabled={disabled}
                          className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-2 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleAddTableRow(field.name)}
                disabled={disabled}
                className="flex items-center gap-1 px-3 py-1 text-sm text-sky-600 hover:bg-sky-50 rounded disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                행 추가
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {schema.fields.map((field) => {
        // total_amount는 자동 계산
        if (field.name === "total_amount" && field.readonly) {
          return (
            <div key={field.name}>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {field.label}
              </label>
              <div className="px-4 py-2 bg-slate-100 rounded-lg text-right font-semibold">
                {totalAmount.toLocaleString()} 원
              </div>
            </div>
          );
        }

        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
          </div>
        );
      })}
    </div>
  );
}
