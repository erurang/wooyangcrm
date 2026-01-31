"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Edit,
  Trash2,
  FileText,
  Download,
  Loader2,
  Calendar,
  User,
  Upload,
  X,
  Package,
  Ship,
  Truck,
  DollarSign,
  ClipboardList,
} from "lucide-react";
import {
  OverseasConsultation,
  OverseasFileType,
  OVERSEAS_FILE_TYPE_LABELS,
  ORDER_TYPE_LABELS,
  CURRENCY_LABELS,
  SHIPPING_METHOD_LABELS,
  TRADE_STATUS_LABELS,
  TRADE_STATUS_COLORS,
  TradeStatus,
} from "@/types/overseas";
import {
  fetchOverseasConsultationFiles,
  uploadOverseasConsultationFile,
  deleteOverseasConsultationFile,
  OverseasConsultationFileInfo,
} from "@/lib/overseas/overseasConsultationFiles";

interface User {
  id: string;
  name: string;
}

interface OverseasConsultationTableProps {
  consultations: OverseasConsultation[];
  users: User[];
  loginUserId: string;
  isLoading?: boolean;
  onEditConsultation: (consultation: OverseasConsultation) => void;
  onDeleteConsultation: (consultation: OverseasConsultation) => void;
  onAddConsultation?: () => void;
}

// 파일 타입별 색상
const FILE_TYPE_COLORS: Record<OverseasFileType, string> = {
  PI: "bg-blue-50 text-blue-700 border-blue-200",
  CI: "bg-green-50 text-green-700 border-green-200",
  PL: "bg-purple-50 text-purple-700 border-purple-200",
  BL: "bg-orange-50 text-orange-700 border-orange-200",
  AWB: "bg-cyan-50 text-cyan-700 border-cyan-200",
  CO: "bg-pink-50 text-pink-700 border-pink-200",
  LC: "bg-amber-50 text-amber-700 border-amber-200",
  REMITTANCE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CONTRACT: "bg-indigo-50 text-indigo-700 border-indigo-200",
  CATALOG: "bg-teal-50 text-teal-700 border-teal-200",
  OTHER: "bg-slate-50 text-slate-700 border-slate-200",
};

// 주요 파일 타입 (버튼으로 표시)
const MAIN_FILE_TYPES: OverseasFileType[] = ["PI", "CI", "PL", "BL"];

export default function OverseasConsultationTable({
  consultations,
  users,
  loginUserId,
  isLoading,
  onEditConsultation,
  onDeleteConsultation,
  onAddConsultation,
}: OverseasConsultationTableProps) {
  // 각 상담별 파일 목록
  const [filesMap, setFilesMap] = useState<Record<string, OverseasConsultationFileInfo[]>>({});
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});

  // 파일 업로드 모달 상태
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadingConsultationId, setUploadingConsultationId] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<OverseasFileType>("PI");
  const [uploading, setUploading] = useState(false);

  // 상담 목록이 변경되면 파일 목록 로드
  useEffect(() => {
    consultations.forEach((consultation) => {
      if (!filesMap[consultation.id] && !loadingFiles[consultation.id]) {
        loadFiles(consultation.id);
      }
    });
  }, [consultations]);

  const loadFiles = async (consultationId: string) => {
    setLoadingFiles((prev) => ({ ...prev, [consultationId]: true }));
    try {
      const files = await fetchOverseasConsultationFiles(consultationId);
      setFilesMap((prev) => ({ ...prev, [consultationId]: files }));
    } finally {
      setLoadingFiles((prev) => ({ ...prev, [consultationId]: false }));
    }
  };

  // 파일 업로드
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !uploadingConsultationId) return;

    setUploading(true);
    try {
      const file = e.target.files[0];
      const result = await uploadOverseasConsultationFile(
        file,
        uploadingConsultationId,
        loginUserId,
        selectedFileType
      );

      if (result) {
        // 파일 목록 새로고침
        loadFiles(uploadingConsultationId);
      }
    } finally {
      setUploading(false);
      setUploadModalOpen(false);
      setUploadingConsultationId(null);
    }
  };

  // 파일 삭제
  const handleDeleteFile = async (consultationId: string, fileId: string) => {
    if (!confirm("파일을 삭제하시겠습니까?")) return;

    const success = await deleteOverseasConsultationFile(fileId);
    if (success) {
      loadFiles(consultationId);
    }
  };

  // 파일 다운로드 (cross-origin signed URL 대응)
  const handleDownloadFile = async (url: string, fileName: string) => {
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
      // 실패 시 새 탭에서 열기
      window.open(url, "_blank");
    }
  };

  // 파일 타입별 파일 개수
  const getFileCountByType = (consultationId: string, fileType: OverseasFileType) => {
    const files = filesMap[consultationId] || [];
    return files.filter((f) => f.fileType === fileType).length;
  };

  // 해당 타입의 파일 목록
  const getFilesByType = (consultationId: string, fileType: OverseasFileType) => {
    const files = filesMap[consultationId] || [];
    return files.filter((f) => f.fileType === fileType);
  };

  // 내용 줄바꿈 처리
  const formatContentWithLineBreaks = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // 날짜 포맷 (짧은 형태: MM/DD)
  const formatDateShort = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;
  };

  // 금액 포맷
  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return "-";
    const formatted = amount.toLocaleString("ko-KR");
    if (currency) {
      const symbols: Record<string, string> = {
        KRW: "₩",
        USD: "$",
        EUR: "€",
        CNY: "¥",
        JPY: "¥",
        GBP: "£",
      };
      return `${symbols[currency] || ""}${formatted}`;
    }
    return formatted;
  };

  // 거래 정보가 있는지 확인
  const hasTradeInfo = (consultation: OverseasConsultation) => {
    return !!(
      consultation.order_type ||
      consultation.order_date ||
      consultation.expected_completion_date ||
      consultation.pickup_date ||
      consultation.arrival_date ||
      consultation.oc_number ||
      consultation.total_remittance ||
      consultation.trade_status
    );
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 mt-3">상담 내역을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {consultations && consultations.length > 0 ? (
        <div className="space-y-4">
          {consultations.map((consultation) => {
            const consultUser = users.find((u) => u.id === consultation.user_id);
            const userLink = consultation.user_id === loginUserId
              ? "/profile"
              : `/profile/${consultation.user_id}`;
            const isAuthor = loginUserId === consultation.user_id;
            const files = filesMap[consultation.id] || [];
            const isLoadingFiles = loadingFiles[consultation.id];

            return (
              <div
                key={consultation.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* 좌측: 날짜, 담당자, 상담자 */}
                  <div className="sm:w-44 shrink-0 bg-slate-50 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-slate-100">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:block sm:space-y-3">
                      {/* 날짜 */}
                      <div className="flex items-center gap-2 sm:block">
                        <div className="text-xs text-slate-500 sm:mb-0.5 flex items-center gap-1">
                          <Calendar size={12} />
                          날짜
                        </div>
                        <div className="text-sm font-medium text-slate-800">
                          {formatDate(consultation.date)}
                        </div>
                      </div>

                      {/* 거래처 담당자 */}
                      {consultation.contact_name && (
                        <div className="flex items-center gap-2 sm:block">
                          <div className="text-xs text-slate-500 sm:mb-0.5 flex items-center gap-1">
                            <User size={12} />
                            거래처 담당자
                          </div>
                          <div className="text-sm font-medium text-slate-700">
                            {consultation.contact_name}
                          </div>
                        </div>
                      )}

                      {/* 상담자 */}
                      <div className="flex items-center gap-2 sm:block">
                        <div className="text-xs text-slate-500 sm:mb-0.5">상담자</div>
                        {consultUser ? (
                          <Link
                            href={userLink}
                            className="text-sm text-teal-600 hover:underline"
                          >
                            {consultUser.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 우측: 내용 + 파일 버튼 */}
                  <div className="flex-1 p-3 sm:p-4 flex flex-col">
                    {/* 상단: 제목 + 관리 버튼 */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      {/* 제목 */}
                      {consultation.title && (
                        <h4 className="text-sm font-semibold text-slate-800">
                          {consultation.title}
                        </h4>
                      )}
                      {/* 관리 버튼 */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isAuthor && (
                          <>
                            <button
                              onClick={() => onEditConsultation(consultation)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            >
                              <Edit size={13} />
                              수정
                            </button>
                            <button
                              onClick={() => onDeleteConsultation(consultation)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={13} />
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 내용 */}
                    <div className="text-sm text-slate-700 leading-relaxed flex-1 mb-3">
                      {formatContentWithLineBreaks(consultation.content)}
                    </div>

                    {/* 거래 정보 */}
                    {hasTradeInfo(consultation) && (
                      <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        {/* 상태 배지 + 수입/수출 */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {/* 수입/수출 배지 */}
                          {consultation.order_type && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                consultation.order_type === "import"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {ORDER_TYPE_LABELS[consultation.order_type]}
                            </span>
                          )}
                          {/* 상태 배지 */}
                          {consultation.trade_status && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                                TRADE_STATUS_COLORS[consultation.trade_status as TradeStatus]
                              }`}
                            >
                              {TRADE_STATUS_LABELS[consultation.trade_status as TradeStatus]}
                            </span>
                          )}
                          {/* O/C No. */}
                          {consultation.oc_number && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded text-xs text-slate-600 border border-slate-200">
                              <ClipboardList size={11} />
                              O/C: {consultation.oc_number}
                            </span>
                          )}
                        </div>

                        {/* 날짜 정보 그리드 */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {/* 발주일 */}
                          {consultation.order_date && (
                            <div className="flex items-center gap-1.5">
                              <Package size={12} className="text-slate-400" />
                              <span className="text-slate-500">발주</span>
                              <span className="font-medium text-slate-700">{formatDateShort(consultation.order_date)}</span>
                            </div>
                          )}
                          {/* 생산예정 */}
                          {consultation.expected_completion_date && (
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-slate-400" />
                              <span className="text-slate-500">생산예정</span>
                              <span className="font-medium text-slate-700">{formatDateShort(consultation.expected_completion_date)}</span>
                            </div>
                          )}
                          {/* 출고일 */}
                          {consultation.pickup_date && (
                            <div className="flex items-center gap-1.5">
                              <Ship size={12} className="text-slate-400" />
                              <span className="text-slate-500">출고</span>
                              <span className="font-medium text-slate-700">{formatDateShort(consultation.pickup_date)}</span>
                            </div>
                          )}
                          {/* 입고일 */}
                          {consultation.arrival_date && (
                            <div className="flex items-center gap-1.5">
                              <Truck size={12} className="text-slate-400" />
                              <span className="text-slate-500">입고</span>
                              <span className="font-medium text-slate-700">{formatDateShort(consultation.arrival_date)}</span>
                            </div>
                          )}
                        </div>

                        {/* 송금 정보 */}
                        {(consultation.total_remittance || consultation.shipping_method || consultation.shipping_carrier) && (
                          <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap items-center gap-3 text-xs">
                            {/* 총 송금액 */}
                            {consultation.total_remittance && (
                              <div className="flex items-center gap-1.5">
                                <DollarSign size={12} className="text-slate-400" />
                                <span className="text-slate-500">송금</span>
                                <span className="font-medium text-slate-700">
                                  {formatCurrency(consultation.total_remittance, consultation.currency)}
                                </span>
                                {consultation.remittance_date && (
                                  <span className="text-slate-400">
                                    ({formatDateShort(consultation.remittance_date)})
                                  </span>
                                )}
                              </div>
                            )}
                            {/* 운송 방법 */}
                            {consultation.shipping_method && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-500">운송</span>
                                <span className="font-medium text-slate-700">
                                  {SHIPPING_METHOD_LABELS[consultation.shipping_method]}
                                </span>
                              </div>
                            )}
                            {/* 운송업체 */}
                            {consultation.shipping_carrier?.name && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-500">업체</span>
                                <span className="font-medium text-slate-700">
                                  {consultation.shipping_carrier.name}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 파일 버튼들 */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
                        {/* 주요 파일 타입 버튼 */}
                        {MAIN_FILE_TYPES.map((fileType) => {
                          const typeFiles = getFilesByType(consultation.id, fileType);
                          const hasFiles = typeFiles.length > 0;

                          return (
                            <div key={fileType} className="flex flex-col sm:flex-row sm:items-center gap-1">
                              {/* 업로드 버튼 */}
                              <button
                                className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2.5 sm:px-2.5 sm:py-1.5 text-xs rounded-lg border transition-colors ${
                                  hasFiles
                                    ? FILE_TYPE_COLORS[fileType]
                                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                }`}
                                onClick={() => {
                                  setUploadingConsultationId(consultation.id);
                                  setSelectedFileType(fileType);
                                  setUploadModalOpen(true);
                                }}
                              >
                                <FileText size={14} />
                                {OVERSEAS_FILE_TYPE_LABELS[fileType]}
                              </button>

                              {/* 기존 파일 목록 */}
                              {typeFiles.map((file) => (
                                <div
                                  key={file.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 text-slate-700 text-xs rounded-lg group"
                                >
                                  <span className="truncate max-w-[100px]" title={file.name}>
                                    {file.name}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadFile(file.url, file.name);
                                    }}
                                    className="p-0.5 text-teal-600 hover:bg-teal-50 rounded"
                                    title="다운로드"
                                  >
                                    <Download size={12} />
                                  </button>
                                  {isAuthor && (
                                    <button
                                      onClick={() => handleDeleteFile(consultation.id, file.id)}
                                      className="p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="삭제"
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })}

                        {/* 기타 파일 업로드 버튼 */}
                        <button
                          className="flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2.5 sm:px-2.5 sm:py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
                          onClick={() => {
                            setUploadingConsultationId(consultation.id);
                            setSelectedFileType("OTHER");
                            setUploadModalOpen(true);
                          }}
                        >
                          <Upload size={14} />
                          파일 추가
                        </button>
                      </div>

                      {/* 기타 파일 타입 파일들 */}
                      {files.filter((f) => !MAIN_FILE_TYPES.includes(f.fileType)).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {files
                            .filter((f) => !MAIN_FILE_TYPES.includes(f.fileType))
                            .map((file) => (
                              <div
                                key={file.id}
                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border group ${FILE_TYPE_COLORS[file.fileType]}`}
                              >
                                <span className="text-[10px] font-medium">
                                  {OVERSEAS_FILE_TYPE_LABELS[file.fileType]}
                                </span>
                                <span className="truncate max-w-[80px]" title={file.name}>
                                  {file.name}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadFile(file.url, file.name);
                                  }}
                                  className="p-0.5 hover:bg-white/50 rounded"
                                  title="다운로드"
                                >
                                  <Download size={12} />
                                </button>
                                {isAuthor && (
                                  <button
                                    onClick={() => handleDeleteFile(consultation.id, file.id)}
                                    className="p-0.5 hover:bg-white/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="삭제"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            ))}
                        </div>
                      )}

                      {/* 파일 로딩 중 */}
                      {isLoadingFiles && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                          <Loader2 size={12} className="animate-spin" />
                          파일 불러오는 중...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-12 text-center">
          <FileText size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">등록된 상담이 없습니다.</p>
          {onAddConsultation && (
            <button
              onClick={onAddConsultation}
              className="mt-4 text-teal-600 hover:text-teal-700 text-sm"
            >
              첫 상담 등록하기
            </button>
          )}
        </div>
      )}

      {/* 파일 업로드 모달 */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">파일 업로드</h3>

            {/* 파일 타입 선택 */}
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                파일 타입
              </label>
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value as OverseasFileType)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {Object.entries(OVERSEAS_FILE_TYPE_LABELS).map(([type, label]) => (
                  <option key={type} value={type}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* 파일 선택 */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                파일 선택
              </label>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
              />
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setUploadingConsultationId(null);
                }}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                취소
              </button>
            </div>

            {/* 업로드 중 */}
            {uploading && (
              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                <div className="flex items-center gap-2 text-teal-600">
                  <Loader2 size={20} className="animate-spin" />
                  업로드 중...
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
