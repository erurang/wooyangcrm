"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircularProgress } from "@mui/material";
import { X, AlertCircle, Plus, Trash2, Paperclip, Upload, FileText, Download, Users, UserCheck } from "lucide-react";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useUsersList } from "@/hooks/useUserList";
import { supabase } from "@/lib/supabaseClient";
import { useLoginUser } from "@/context/login";
import { useGlobalToast } from "@/context/toast";
import dayjs from "dayjs";
import HeadlessSelect from "@/components/ui/HeadlessSelect";
import {
  OverseasOrderFormData,
  OverseasOrderItem,
  OverseasContact,
  OrderType,
  CurrencyType,
  ShippingMethodType,
  ORDER_TYPE_LABELS,
  CURRENCY_LABELS,
  CURRENCY_SYMBOLS,
  SHIPPING_METHOD_LABELS,
} from "@/types/overseas";

interface FormErrors {
  invoice_no?: string;
  order_date?: string;
  items?: string;
}

// 간단한 User 타입
interface User {
  id: string;
  name: string;
}

// 파일 인터페이스
interface OrderFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  description?: string;
  user_id: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
  };
  signedUrl?: string;
}

const FILE_TYPE_OPTIONS = [
  { value: "PI", label: "PI" },
  { value: "OC", label: "OC" },
  { value: "BL", label: "B/L" },
  { value: "CI", label: "CI" },
  { value: "PL", label: "PL" },
  { value: "remittance", label: "송금" },
  { value: "other", label: "기타" },
];

const CURRENCY_OPTIONS: { value: CurrencyType; label: string }[] = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "CNY", label: "CNY (¥)" },
  { value: "GBP", label: "GBP (£)" },
];

const SHIPPING_OPTIONS: { value: ShippingMethodType | ""; label: string }[] = [
  { value: "", label: "선택안함" },
  { value: "air", label: "항공" },
  { value: "sea", label: "해상" },
  { value: "express", label: "특송" },
];

interface OverseasOrderFormModalProps {
  mode: "add" | "edit";
  isOpen: boolean;
  onClose: () => void;
  formData: OverseasOrderFormData;
  setFormData: (data: OverseasOrderFormData) => void;
  onSubmit: () => Promise<void>;
  onDelete?: () => Promise<void>;
  saving: boolean;
  deleting?: boolean;
  contacts?: OverseasContact[];
  orderId?: string;
  invoiceNo?: string;
}

const emptyItem: OverseasOrderItem = {
  name: "",
  spec: "",
  quantity: "",
  unit_price: 0,
  amount: 0,
};

export default function OverseasOrderFormModal({
  mode,
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  onDelete,
  saving,
  deleting,
  contacts = [],
  orderId,
  invoiceNo,
}: OverseasOrderFormModalProps) {
  const isAddMode = mode === "add";
  const modalTitle = isAddMode ? "발주 추가" : "발주 수정";
  const [errors, setErrors] = useState<FormErrors>({});
  const { error: showError } = useGlobalToast();

  // 로그인 사용자
  const loginUser = useLoginUser();

  // 사용자 목록 가져오기
  const { users } = useUsersList();

  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);

  // 파일 관련 상태
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileType, setFileType] = useState("other");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 목록 로드
  useEffect(() => {
    if (isOpen && orderId) {
      loadFiles();
    } else {
      setFiles([]);
    }
  }, [isOpen, orderId]);

  const loadFiles = async () => {
    if (!orderId) return;
    setFilesLoading(true);

    const { data, error } = await supabase
      .from("overseas_order_files")
      .select(`
        id,
        file_name,
        file_url,
        file_type,
        description,
        user_id,
        created_at,
        users:user_id (
          id,
          name
        )
      `)
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("파일 목록 로드 실패:", error.message);
      setFiles([]);
      setFilesLoading(false);
      return;
    }

    // Signed URL 생성
    const filesWithUrls = await Promise.all(
      (data || []).map(async (file: any) => {
        const { data: signedUrlData } = await supabase.storage
          .from("overseas_order_files")
          .createSignedUrl(file.file_url, 60 * 60);

        return {
          ...file,
          user: file.users,
          signedUrl: signedUrlData?.signedUrl || "",
        };
      })
    );

    setFiles(filesWithUrls);
    setFilesLoading(false);
  };

  // 파일 선택
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setPendingFiles(Array.from(selectedFiles));
    setShowUploadForm(true);
  };

  // 파일 업로드
  const handleFileUpload = async () => {
    if (pendingFiles.length === 0 || uploading || !loginUser?.id || !orderId) {
      console.log("업로드 조건 미충족:", {
        pendingFiles: pendingFiles.length,
        uploading,
        loginUserId: loginUser?.id,
        orderId
      });
      return;
    }

    setUploading(true);

    for (const file of pendingFiles) {
      const timestamp = Date.now();
      const sanitizedName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w.-]/g, "_")
        .replace(/_{2,}/g, "_")
        .toLowerCase();
      const uniqueFileName = `${timestamp}_${sanitizedName}`;
      const filePath = `orders/${orderId}/${uniqueFileName}`;

      console.log("파일 업로드 시도:", { filePath, fileName: file.name });

      // 스토리지에 업로드
      const { error: uploadError } = await supabase.storage
        .from("overseas_order_files")
        .upload(filePath, file);

      if (uploadError) {
        console.error("스토리지 업로드 실패:", uploadError);
        showError(`파일 업로드 실패: ${uploadError.message}`);
        continue;
      }

      console.log("스토리지 업로드 성공, DB 저장 시도");

      // DB에 저장
      const { error: dbError } = await supabase
        .from("overseas_order_files")
        .insert({
          order_id: orderId,
          user_id: loginUser.id,
          file_url: filePath,
          file_name: file.name,
          file_type: fileType,
        });

      if (dbError) {
        console.error("DB 저장 실패:", dbError);
        showError(`DB 저장 실패: ${dbError.message}`);
      } else {
        console.log("파일 업로드 완료:", file.name);
      }
    }

    setUploading(false);
    cancelUpload();
    loadFiles();
  };

  // 업로드 취소
  const cancelUpload = () => {
    setPendingFiles([]);
    setFileType("other");
    setShowUploadForm(false);
  };

  // 파일 삭제
  const handleFileDelete = async (fileId: string, filePath: string) => {
    if (!confirm("파일을 삭제하시겠습니까?")) return;

    await supabase.storage.from("overseas_order_files").remove([filePath]);
    const { error } = await supabase
      .from("overseas_order_files")
      .delete()
      .eq("id", fileId);

    if (!error) {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    }
  };

  // 파일 다운로드
  const handleFileDownload = async (file: OrderFile) => {
    if (!file.signedUrl) return;
    const response = await fetch(file.signedUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.file_name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // 드래그 & 드롭
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 자식 요소로 이동할 때는 무시
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, []);

  // 파일 타입 라벨
  const getFileTypeLabel = (type: string) => {
    const option = FILE_TYPE_OPTIONS.find((o) => o.value === type);
    return option?.label || type;
  };

  // 파일 확장자 아이콘
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
      return "image";
    } else if (["pdf"].includes(ext || "")) {
      return "pdf";
    } else if (["doc", "docx"].includes(ext || "")) {
      return "doc";
    } else if (["xls", "xlsx"].includes(ext || "")) {
      return "excel";
    } else if (["ppt", "pptx"].includes(ext || "")) {
      return "ppt";
    } else if (["zip", "rar", "7z"].includes(ext || "")) {
      return "archive";
    }
    return "file";
  };

  // 총금액 계산
  const totalAmount = useMemo(() => {
    return formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [formData.items]);

  // 원화 환산액 계산
  const krwAmount = useMemo(() => {
    const rate = formData.exchange_rate;
    if (rate === "" || rate === 0) return 0;
    const remittance =
      formData.remittance_amount === "" ? 0 : formData.remittance_amount;
    return Math.round(remittance * rate);
  }, [formData.remittance_amount, formData.exchange_rate]);

  // 필드별 검증
  const validateField = useCallback(
    (field: keyof FormErrors, value: unknown): string | undefined => {
      switch (field) {
        case "invoice_no":
          return !(value as string)?.trim()
            ? "Invoice No.를 입력해주세요."
            : undefined;
        case "order_date":
          return !(value as string)?.trim()
            ? "발주일을 선택해주세요."
            : undefined;
        case "items": {
          const items = value as OverseasOrderItem[];
          if (!items || items.length === 0)
            return "최소 1개 이상의 품목을 입력해주세요.";
          const hasValidItem = items.some((item) => {
            const qty = item.quantity;
            const numQty =
              typeof qty === "number"
                ? qty
                : parseFloat(String(qty).match(/[\d.]+/)?.[0] || "0");
            return item.name?.trim() && numQty > 0;
          });
          if (!hasValidItem)
            return "품명과 수량을 입력한 품목이 최소 1개 필요합니다.";
          return undefined;
        }
        default:
          return undefined;
      }
    },
    []
  );

  // 폼 전체 검증
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    const invoiceError = validateField("invoice_no", formData.invoice_no);
    if (invoiceError) newErrors.invoice_no = invoiceError;

    const dateError = validateField("order_date", formData.order_date);
    if (dateError) newErrors.order_date = dateError;

    const itemsError = validateField("items", formData.items);
    if (itemsError) newErrors.items = itemsError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  // 필드 변경 시 에러 클리어
  const handleFieldChange = useCallback(
    (field: keyof OverseasOrderFormData, value: unknown) => {
      setFormData({ ...formData, [field]: value });
      if (errors[field as keyof FormErrors]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field as keyof FormErrors];
          return newErrors;
        });
      }
    },
    [formData, setFormData, errors]
  );

  // 수량에서 숫자만 추출하는 함수 (예: "10박스" -> 10)
  const extractNumber = (value: string | number): number => {
    if (typeof value === "number") return value;
    const match = value.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  // 품목 변경
  const handleItemChange = useCallback(
    (index: number, field: keyof OverseasOrderItem, value: string | number) => {
      const newItems = [...formData.items];
      newItems[index] = { ...newItems[index], [field]: value };

      // 금액 자동 계산
      if (field === "quantity" || field === "unit_price") {
        const qty =
          field === "quantity"
            ? extractNumber(value)
            : extractNumber(newItems[index].quantity);
        const price =
          field === "unit_price" ? Number(value) : newItems[index].unit_price;
        newItems[index].amount = qty * price;
      }

      setFormData({ ...formData, items: newItems });

      // 에러 클리어
      if (errors.items) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.items;
          return newErrors;
        });
      }
    },
    [formData, setFormData, errors]
  );

  // 품목 추가
  const handleAddItem = useCallback(() => {
    setFormData({
      ...formData,
      items: [...formData.items, { ...emptyItem }],
    });
  }, [formData, setFormData]);

  // 품목 삭제
  const handleRemoveItem = useCallback(
    (index: number) => {
      if (formData.items.length <= 1) return;
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    },
    [formData, setFormData]
  );

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
    const base =
      "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors";
    if (isDisabled) return `${base} bg-gray-100 border-gray-300`;
    if (hasError) return `${base} border-red-500 focus:ring-red-500 bg-red-50`;
    return `${base} border-gray-300 focus:ring-blue-500`;
  };

  const currencySymbol = CURRENCY_SYMBOLS[formData.currency] || "$";

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
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-5 border-b shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalTitle}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* 본문 */}
            <div className="p-5 overflow-y-auto flex-1">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* 구분 (수입/수출) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    구분
                  </label>
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => handleFieldChange("order_type", "import")}
                      className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                        formData.order_type === "import"
                          ? "bg-white text-blue-600 shadow-sm font-medium"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      수입
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange("order_type", "export")}
                      className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                        formData.order_type === "export"
                          ? "bg-white text-blue-600 shadow-sm font-medium"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      수출
                    </button>
                  </div>
                </div>

                {/* Invoice No. */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="INV-2024-001"
                    value={formData.invoice_no}
                    onChange={(e) =>
                      handleFieldChange("invoice_no", e.target.value)
                    }
                    className={getInputClass(!!errors.invoice_no)}
                  />
                  {errors.invoice_no && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.invoice_no}
                    </p>
                  )}
                </div>

                {/* 발주일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    발주일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) =>
                      handleFieldChange("order_date", e.target.value)
                    }
                    className={getInputClass(!!errors.order_date)}
                  />
                  {errors.order_date && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.order_date}
                    </p>
                  )}
                </div>

                {/* 통화 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    통화
                  </label>
                  <HeadlessSelect
                    value={formData.currency}
                    onChange={(val) => handleFieldChange("currency", val as CurrencyType)}
                    options={CURRENCY_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                    placeholder="통화 선택"
                  />
                </div>
              </div>

              {/* 날짜 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    출고일 (해외)
                  </label>
                  <input
                    type="date"
                    value={formData.shipment_date || ""}
                    onChange={(e) =>
                      handleFieldChange("shipment_date", e.target.value)
                    }
                    className={getInputClass(false)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    입고일 (국내)
                  </label>
                  <input
                    type="date"
                    value={formData.arrival_date || ""}
                    onChange={(e) =>
                      handleFieldChange("arrival_date", e.target.value)
                    }
                    className={getInputClass(false)}
                  />
                </div>
              </div>

              {/* 담당자 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* 상대 담당자 (거래처) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상대 담당자 (거래처)
                  </label>
                  {contacts.length > 0 ? (
                    <HeadlessSelect
                      value={formData.contact_name}
                      onChange={(val) => handleFieldChange("contact_name", val)}
                      options={[
                        { value: "", label: "선택안함" },
                        ...contacts.map((contact) => ({
                          value: contact.name,
                          label: contact.name,
                          sublabel: contact.position ? `(${contact.position})` : undefined,
                        })),
                      ]}
                      placeholder="담당자 선택"
                      icon={<Users className="h-4 w-4" />}
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="담당자명 입력"
                      value={formData.contact_name}
                      onChange={(e) =>
                        handleFieldChange("contact_name", e.target.value)
                      }
                      className={getInputClass(false)}
                    />
                  )}
                </div>

                {/* 오더 담당자 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    오더 담당자
                  </label>
                  <HeadlessSelect
                    value={formData.user_id}
                    onChange={(val) => handleFieldChange("user_id", val)}
                    options={[
                      { value: "", label: "선택안함" },
                      ...users.map((user: { id: string; name: string }) => ({
                        value: user.id,
                        label: user.name,
                      })),
                    ]}
                    placeholder="담당자 선택"
                    icon={<UserCheck className="h-4 w-4" />}
                  />
                </div>
              </div>

              {/* 품목 리스트 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    품목 <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Plus size={14} />
                    품목 추가
                  </button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-1/4">
                          품명
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-1/4">
                          규격
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-20">
                          수량
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">
                          단가 ({currencySymbol})
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">
                          금액 ({currencySymbol})
                        </th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              placeholder="품명"
                              value={item.name}
                              onChange={(e) =>
                                handleItemChange(index, "name", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              placeholder="규격"
                              value={item.spec}
                              onChange={(e) =>
                                handleItemChange(index, "spec", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              placeholder="수량"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(index, "quantity", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "unit_price",
                                  Number(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-2 py-1 text-right text-sm font-medium text-gray-900">
                            {item.amount.toLocaleString()}
                          </td>
                          <td className="px-2 py-1">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              disabled={formData.items.length <= 1}
                              className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-2 text-right text-sm font-medium text-gray-700"
                        >
                          총금액
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-blue-600">
                          {currencySymbol}
                          {totalAmount.toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {errors.items && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.items}
                  </p>
                )}
              </div>

              {/* 송금 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    총송금액 ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.remittance_amount}
                    onChange={(e) =>
                      handleFieldChange(
                        "remittance_amount",
                        e.target.value === ""
                          ? ""
                          : Number(e.target.value) || 0
                      )
                    }
                    className={getInputClass(false)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    송금일
                  </label>
                  <input
                    type="date"
                    value={formData.remittance_date || ""}
                    onChange={(e) =>
                      handleFieldChange("remittance_date", e.target.value)
                    }
                    className={getInputClass(false)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    환율 (₩)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.exchange_rate}
                    onChange={(e) =>
                      handleFieldChange(
                        "exchange_rate",
                        e.target.value === ""
                          ? ""
                          : Number(e.target.value) || 0
                      )
                    }
                    className={getInputClass(false)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    원화환산액
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`₩${krwAmount.toLocaleString()}`}
                    className={getInputClass(false, true)}
                  />
                </div>
              </div>

              {/* 운송 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    운송방법
                  </label>
                  <HeadlessSelect
                    value={formData.shipping_method}
                    onChange={(val) => handleFieldChange("shipping_method", val as ShippingMethodType | "")}
                    options={SHIPPING_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                    placeholder="운송방법 선택"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    운송업체/관세사
                  </label>
                  <input
                    type="text"
                    placeholder="업체명"
                    value={formData.forwarder}
                    onChange={(e) =>
                      handleFieldChange("forwarder", e.target.value)
                    }
                    className={getInputClass(false)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    H.S.code
                  </label>
                  <input
                    type="text"
                    placeholder="0000.00.0000"
                    value={formData.hs_code}
                    onChange={(e) =>
                      handleFieldChange("hs_code", e.target.value)
                    }
                    className={getInputClass(false)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    관세율 (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.tariff_rate}
                    onChange={(e) =>
                      handleFieldChange(
                        "tariff_rate",
                        e.target.value === ""
                          ? ""
                          : Number(e.target.value) || 0
                      )
                    }
                    className={getInputClass(false)}
                  />
                </div>
              </div>

              {/* 첨부파일 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    첨부파일
                    {files.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded">
                        {files.length}
                      </span>
                    )}
                  </label>
                </div>

                {/* 수정 모드: 파일 업로드 가능 */}
                {orderId ? (
                  <div className="border rounded-lg overflow-hidden">
                    {/* 드래그 앤 드롭 영역 */}
                    {!showUploadForm && (
                      <div
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                          dragging
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFileSelect(e.target.files)}
                        />
                        {dragging ? (
                          <div className="flex flex-col items-center gap-2 text-blue-600">
                            <Upload className="h-8 w-8" />
                            <p className="text-sm font-medium">파일을 여기에 놓으세요</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-gray-500">
                            <FileText className="h-6 w-6" />
                            <p className="text-sm">
                              <span className="font-medium text-blue-600">파일 선택</span>
                              <span className="hidden sm:inline"> 또는 드래그 앤 드롭</span>
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              PI, OC, B/L, CI, PL, 송금증빙 등
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 업로드 폼 */}
                    {showUploadForm && (
                      <div className="p-4 bg-blue-50 border-b">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-700 truncate">
                              {pendingFiles.map((f) => f.name).join(", ")}
                            </div>
                          </div>
                          <HeadlessSelect
                            value={fileType}
                            onChange={(val) => setFileType(val)}
                            options={FILE_TYPE_OPTIONS.map((opt) => ({
                              value: opt.value,
                              label: opt.label,
                            }))}
                            placeholder="파일 종류"
                          />
                          <button
                            type="button"
                            onClick={cancelUpload}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={handleFileUpload}
                            disabled={uploading}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            {uploading && <CircularProgress size={12} color="inherit" />}
                            업로드
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 파일 목록 */}
                    {filesLoading ? (
                      <div className="p-4 text-center">
                        <CircularProgress size={20} />
                      </div>
                    ) : files.length > 0 ? (
                      <div className="divide-y max-h-40 overflow-y-auto">
                        {files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between px-3 py-2 hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <FileText size={14} className="text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-700 truncate">
                                {file.file_name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded shrink-0">
                                {getFileTypeLabel(file.file_type)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => handleFileDownload(file)}
                                className="p-1 text-gray-400 hover:text-blue-600"
                                title="다운로드"
                              >
                                <Download size={14} />
                              </button>
                              {file.user_id === loginUser?.id && (
                                <button
                                  type="button"
                                  onClick={() => handleFileDelete(file.id, file.file_url)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                  title="삭제"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-gray-400">
                        첨부된 파일이 없습니다
                      </div>
                    )}
                  </div>
                ) : (
                  /* 추가 모드: 저장 후 파일 첨부 안내 */
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center bg-gray-50">
                    <Paperclip className="mx-auto h-6 w-6 text-gray-300 mb-1" />
                    <p className="text-xs text-gray-400">
                      발주 저장 후 파일을 첨부할 수 있습니다
                    </p>
                  </div>
                )}
              </div>

              {/* 비고 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비고
                </label>
                <textarea
                  placeholder="추가 메모..."
                  value={formData.notes}
                  onChange={(e) => handleFieldChange("notes", e.target.value)}
                  className={`${getInputClass(false)} resize-none`}
                  rows={3}
                />
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex justify-between items-center px-5 py-4 bg-gray-50 border-t shrink-0">
              {/* 왼쪽: 삭제 버튼 (수정 모드에서만) */}
              <div>
                {!isAddMode && onDelete && (
                  <button
                    onClick={onDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    disabled={saving || deleting}
                  >
                    {deleting ? (
                      <>
                        <CircularProgress size={16} className="mr-2" color="inherit" />
                        삭제 중...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} className="mr-1" />
                        삭제
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* 오른쪽: 취소/저장 버튼 */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={saving || deleting}
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={saving || deleting}
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
