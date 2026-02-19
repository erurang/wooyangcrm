"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  X,
  Upload,
  FileText,
  Trash2,
  Loader2,
  Download,
} from "lucide-react";
import {
  OverseasFileType,
  OVERSEAS_FILE_TYPE_LABELS,
  OverseasContact,
  OverseasConsultationFormData,
  ShippingMethodType,
  SHIPPING_METHOD_LABELS,
  CurrencyType,
  ShippingCarrier,
  OrderType,
  ORDER_TYPE_LABELS,
  TradeStatus,
  TRADE_STATUS_LABELS,
  TRADE_STATUS_ORDER,
  IncotermsType,
  INCOTERMS_LABELS,
} from "@/types/overseas";
import {
  uploadOverseasConsultationFile,
  fetchOverseasConsultationFiles,
  deleteOverseasConsultationFile,
  OverseasConsultationFileInfo,
} from "@/lib/overseas/overseasConsultationFiles";
import HeadlessSelect from "@/components/ui/HeadlessSelect";
import SplitShipmentSection from "./SplitShipmentSection";
import CreateSplitShipmentModal from "./CreateSplitShipmentModal";

interface PendingFile {
  file: File;
  fileType: OverseasFileType;
  id: string; // temporary id for UI
}

interface OverseasConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  formData: OverseasConsultationFormData;
  setFormData: React.Dispatch<React.SetStateAction<OverseasConsultationFormData>>;
  onSubmit: () => Promise<string | null>; // returns consultationId on success
  onDelete?: () => Promise<void>;
  onComplete?: () => void; // 파일 업로드 완료 후 호출 (데이터 새로고침용)
  saving: boolean;
  deleting?: boolean;
  contacts: OverseasContact[];
  users: { id: string; name: string }[];
  consultationId?: string;
}

const FILE_TYPE_OPTIONS: OverseasFileType[] = [
  "PI",
  "CI",
  "PL",
  "BL",
  "AWB",
  "CO",
  "REMITTANCE",
  "OTHER",
];

export default function OverseasConsultationModal({
  isOpen,
  onClose,
  mode,
  formData,
  setFormData,
  onSubmit,
  onDelete,
  onComplete,
  saving,
  deleting,
  contacts,
  users,
  consultationId,
}: OverseasConsultationModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 업로드 대기 중인 파일 (아직 저장 안 됨)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  // 저장된 파일 목록 (수정 모드)
  const [savedFiles, setSavedFiles] = useState<OverseasConsultationFileInfo[]>([]);
  // 선택된 파일 타입
  const [selectedFileType, setSelectedFileType] = useState<OverseasFileType>("PI");
  // 파일 업로드 중
  const [uploadingFiles, setUploadingFiles] = useState(false);
  // 파일 로딩 중
  const [loadingFiles, setLoadingFiles] = useState(false);
  // 운송업체 목록
  const [shippingCarriers, setShippingCarriers] = useState<ShippingCarrier[]>([]);
  // 분할 배송 모달
  const [isCreateSplitModalOpen, setIsCreateSplitModalOpen] = useState(false);
  // 분할 배송 목록 새로고침 트리거
  const [splitRefreshKey, setSplitRefreshKey] = useState(0);

  // 운송업체 목록 로드
  useEffect(() => {
    if (isOpen) {
      fetch("/api/shipping-carriers")
        .then((res) => res.json())
        .then((data) => {
          if (data.carriers) {
            setShippingCarriers(data.carriers);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  // 수정 모드에서 기존 파일 로드
  useEffect(() => {
    if (mode === "edit" && consultationId && isOpen) {
      setLoadingFiles(true);
      fetchOverseasConsultationFiles(consultationId)
        .then(setSavedFiles)
        .finally(() => setLoadingFiles(false));
    } else {
      setSavedFiles([]);
    }
  }, [mode, consultationId, isOpen]);

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setPendingFiles([]);
      setSelectedFileType("PI");
    }
  }, [isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newPendingFiles: PendingFile[] = Array.from(files).map((file) => ({
        file,
        fileType: selectedFileType,
        id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }));

      setPendingFiles((prev) => [...prev, ...newPendingFiles]);

      // input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [selectedFileType]
  );

  // 대기 파일 제거
  const handleRemovePendingFile = useCallback((id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // 저장된 파일 삭제
  const handleDeleteSavedFile = useCallback(async (fileId: string) => {
    if (!confirm("파일을 삭제하시겠습니까?")) return;

    const success = await deleteOverseasConsultationFile(fileId);
    if (success) {
      setSavedFiles((prev) => prev.filter((f) => f.id !== fileId));
    }
  }, []);

  // 파일 다운로드 (cross-origin signed URL 대응)
  const handleDownloadFile = useCallback(async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("파일 다운로드 실패:", error);
      window.open(url, "_blank");
    }
  }, []);

  // 저장 핸들러
  const handleSubmit = useCallback(async () => {
    // 먼저 상담 저장
    const newConsultationId = await onSubmit();
    if (!newConsultationId) return;

    // 대기 파일이 있으면 업로드
    if (pendingFiles.length > 0) {
      setUploadingFiles(true);
      try {
        await Promise.all(
          pendingFiles.map((pf) =>
            uploadOverseasConsultationFile(
              pf.file,
              newConsultationId,
              formData.user_id,
              pf.fileType
            )
          )
        );
        // 파일 업로드 완료 후 데이터 새로고침
        onComplete?.();
      } catch (error) {
        console.error("파일 업로드 실패:", error);
      } finally {
        setUploadingFiles(false);
      }
    }

    setPendingFiles([]);
    onClose();
  }, [onSubmit, pendingFiles, formData.user_id, onClose, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">
            {mode === "add" ? "상담 등록" : "상담 수정"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 수입/수출 + 상담일 + 거래처 담당자 + 작성자 */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                수입/수출
              </label>
              <HeadlessSelect
                value={formData.order_type || ""}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, order_type: value as OrderType | "" }))
                }
                options={[
                  { value: "", label: "선택" },
                  { value: "import", label: ORDER_TYPE_LABELS.import },
                  { value: "export", label: ORDER_TYPE_LABELS.export },
                ]}
                placeholder="선택"
                focusClass="focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                상담일
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                거래처 담당자
              </label>
              <HeadlessSelect
                value={formData.contact_id}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, contact_id: value }));
                }}
                options={[
                  { value: "", label: "선택 안 함" },
                  ...contacts
                    .filter((contact) => contact.id)
                    .map((contact) => ({
                      value: contact.id,
                      label: contact.name,
                      sublabel: contact.position || undefined,
                    })),
                ]}
                placeholder="선택 안 함"
                focusClass="focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                작성자
              </label>
              <HeadlessSelect
                value={formData.user_id}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, user_id: value }))
                }
                options={[
                  { value: "", label: "선택하세요" },
                  ...users.map((user) => ({
                    value: user.id,
                    label: user.name,
                  })),
                ]}
                placeholder="선택하세요"
                focusClass="focus:ring-teal-500"
              />
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              제목
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="상담 제목 (선택)"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* 상담 내용 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              상담 내용
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={4}
              placeholder="상담 내용을 입력하세요..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* 거래 정보 섹션 */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              거래 정보
              {formData.order_type && (
                <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded ${
                  formData.order_type === "import"
                    ? "bg-sky-50 text-sky-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}>
                  {formData.order_type === "import" ? "수입" : "수출"}
                </span>
              )}
            </h3>

            {/* 수입/수출에 따라 다른 필드 표시 */}
            {formData.order_type === "import" ? (
              /* 수입: 발주일 → 생산완료예정 → 출고(해외) → 입고(우리) */
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">발주일</label>
                  <input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, order_date: e.target.value }))}
                    className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">생산완료예정</label>
                  <input
                    type="date"
                    value={formData.expected_completion_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expected_completion_date: e.target.value }))}
                    className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">출고일 (해외)</label>
                  <input
                    type="date"
                    value={formData.pickup_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, pickup_date: e.target.value }))}
                    className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sky-600 mb-1">입고예정일 ★</label>
                  <input
                    type="date"
                    value={formData.arrival_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, arrival_date: e.target.value }))}
                    className="w-full px-2 py-2 text-sm border border-sky-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-sky-50/30"
                  />
                </div>
              </div>
            ) : formData.order_type === "export" ? (
              /* 수출: 수주일 → 생산완료예정 → 출고(우리) → 입고(해외) */
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">수주일</label>
                  <input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, order_date: e.target.value }))}
                    className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-emerald-600 mb-1">생산완료예정 ★</label>
                  <input
                    type="date"
                    value={formData.expected_completion_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expected_completion_date: e.target.value }))}
                    className="w-full px-2 py-2 text-sm border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-emerald-600 mb-1">출고예정일 ★</label>
                  <input
                    type="date"
                    value={formData.pickup_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, pickup_date: e.target.value }))}
                    className="w-full px-2 py-2 text-sm border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">입고일 (해외)</label>
                  <input
                    type="date"
                    value={formData.arrival_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, arrival_date: e.target.value }))}
                    className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            ) : (
              /* 미선택: 기본 필드 */
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">발주일</label>
                  <input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, order_date: e.target.value }))}
                    className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">생산완료예정일</label>
                  <input
                    type="date"
                    value={formData.expected_completion_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expected_completion_date: e.target.value }))}
                    className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">출고일</label>
                  <input
                    type="date"
                    value={formData.pickup_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, pickup_date: e.target.value }))}
                    className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">입고일</label>
                  <input
                    type="date"
                    value={formData.arrival_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, arrival_date: e.target.value }))}
                    className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}

            {/* O/C No./통화/총송금액/송금일 */}
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">O/C No.</label>
                <input
                  type="text"
                  value={formData.oc_number}
                  onChange={(e) => setFormData((prev) => ({ ...prev, oc_number: e.target.value }))}
                  placeholder="Invoice No."
                  className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">통화</label>
                <HeadlessSelect
                  value={formData.currency || ""}
                  onChange={(value) => setFormData((prev) => ({
                    ...prev,
                    currency: value as CurrencyType | ""
                  }))}
                  options={[
                    { value: "", label: "선택" },
                    { value: "KRW", label: "KRW (원화)" },
                    { value: "EUR", label: "EUR (유로)" },
                    { value: "USD", label: "USD (달러)" },
                    { value: "CNY", label: "CNY (위안)" },
                  ]}
                  placeholder="선택"
                  focusClass="focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">총송금액</label>
                <input
                  type="number"
                  value={formData.total_remittance}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    total_remittance: e.target.value ? Number(e.target.value) : ""
                  }))}
                  placeholder="금액"
                  className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">송금일</label>
                <input
                  type="date"
                  value={formData.remittance_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, remittance_date: e.target.value }))}
                  className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* 운송/운송업체/인코텀즈/상태 */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">운송</label>
                <HeadlessSelect
                  value={formData.shipping_method || ""}
                  onChange={(value) => setFormData((prev) => ({
                    ...prev,
                    shipping_method: value as ShippingMethodType | ""
                  }))}
                  options={[
                    { value: "", label: "선택" },
                    { value: "air", label: SHIPPING_METHOD_LABELS.air },
                    { value: "sea", label: SHIPPING_METHOD_LABELS.sea },
                    { value: "express", label: SHIPPING_METHOD_LABELS.express },
                  ]}
                  placeholder="선택"
                  focusClass="focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">운송업체</label>
                <HeadlessSelect
                  value={formData.shipping_carrier_id || ""}
                  onChange={(value) => setFormData((prev) => ({
                    ...prev,
                    shipping_carrier_id: value
                  }))}
                  options={[
                    { value: "", label: "선택" },
                    ...shippingCarriers.map((carrier) => ({
                      value: carrier.id,
                      label: carrier.name,
                    })),
                  ]}
                  placeholder="선택"
                  focusClass="focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">인코텀즈</label>
                <HeadlessSelect
                  value={formData.incoterms || ""}
                  onChange={(value) => setFormData((prev) => ({
                    ...prev,
                    incoterms: value as IncotermsType | ""
                  }))}
                  options={[
                    { value: "", label: "선택" },
                    ...Object.entries(INCOTERMS_LABELS).map(([key, label]) => ({
                      value: key,
                      label: label,
                    })),
                  ]}
                  placeholder="선택"
                  focusClass="focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">상태</label>
                <HeadlessSelect
                  value={formData.trade_status || ""}
                  onChange={(value) => setFormData((prev) => ({
                    ...prev,
                    trade_status: value as TradeStatus | ""
                  }))}
                  options={[
                    { value: "", label: "선택" },
                    ...TRADE_STATUS_ORDER.map((status) => ({
                      value: status,
                      label: TRADE_STATUS_LABELS[status],
                    })),
                  ]}
                  placeholder="선택"
                  focusClass="focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* 파일 업로드 섹션 */}
          <div className="border-t border-slate-200 pt-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              첨부파일
            </h3>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {loadingFiles ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                <Loader2 size={16} className="animate-spin" />
                파일 목록 불러오는 중...
              </div>
            ) : (
              /* 파일 타입별 행 */
              <div className="space-y-2">
                {FILE_TYPE_OPTIONS.map((type, index) => {
                  // 해당 타입의 저장된 파일들
                  const savedFilesOfType = savedFiles.filter(f => f.fileType === type);
                  // 해당 타입의 대기 중인 파일들
                  const pendingFilesOfType = pendingFiles.filter(f => f.fileType === type);
                  const hasFiles = savedFilesOfType.length > 0 || pendingFilesOfType.length > 0;

                  return (
                    <div key={type} className="border border-slate-200 rounded-lg overflow-hidden">
                      {/* 파일 타입 헤더 */}
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-600 w-5">
                            {index + 1}.
                          </span>
                          <span className="text-sm font-medium text-slate-700">
                            {OVERSEAS_FILE_TYPE_LABELS[type]}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFileType(type);
                            // 약간의 딜레이 후 파일 선택 다이얼로그 열기
                            setTimeout(() => fileInputRef.current?.click(), 50);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-teal-600 border border-teal-200 rounded hover:bg-teal-50 transition-colors"
                        >
                          <Upload size={14} />
                          파일첨부
                        </button>
                      </div>

                      {/* 해당 타입의 파일 목록 */}
                      {hasFiles && (
                        <div className="px-3 py-2 space-y-1.5 bg-white">
                          {/* 저장된 파일들 */}
                          {savedFilesOfType.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-1.5 bg-slate-50 rounded"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText size={14} className="text-slate-400 shrink-0" />
                                <button
                                  type="button"
                                  onClick={() => window.open(file.url, "_blank")}
                                  className="text-sm text-slate-700 truncate hover:text-teal-600 hover:underline"
                                  title="새 창에서 열기"
                                >
                                  {file.name}
                                </button>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(file.url, file.name)}
                                  className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                                  title="다운로드"
                                >
                                  <Download size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSavedFile(file.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="삭제"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                          {/* 대기 중인 파일들 */}
                          {pendingFilesOfType.map((pf) => (
                            <div
                              key={pf.id}
                              className="flex items-center justify-between p-1.5 bg-sky-50 rounded"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText size={14} className="text-sky-400 shrink-0" />
                                <span className="text-sm text-slate-700 truncate">
                                  {pf.file.name}
                                </span>
                                <span className="text-xs text-slate-400">
                                  ({(pf.file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePendingFile(pf.id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="제거"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 분할 배송 섹션 (수정 모드에서만 표시) */}
          {mode === "edit" && consultationId && (
            <SplitShipmentSection
              key={splitRefreshKey}
              parentConsultationId={consultationId}
              parentOcNumber={formData.oc_number}
              onCreateSplit={() => setIsCreateSplitModalOpen(true)}
              onSelectSplit={(split) => {
                // 분할 배송 선택 시 해당 상담으로 전환
                console.log("Selected split:", split);
              }}
            />
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div>
            {mode === "edit" && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                삭제
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || uploadingFiles || !formData.content.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving || uploadingFiles ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  저장 중...
                </>
              ) : (
                mode === "add" ? "등록" : "저장"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 분할 배송 생성 모달 */}
      {consultationId && (
        <CreateSplitShipmentModal
          isOpen={isCreateSplitModalOpen}
          onClose={() => setIsCreateSplitModalOpen(false)}
          parentConsultationId={consultationId}
          parentOcNumber={formData.oc_number}
          userId={formData.user_id}
          onSuccess={() => {
            setSplitRefreshKey((prev) => prev + 1);
            onComplete?.();
          }}
        />
      )}
    </div>
  );
}
