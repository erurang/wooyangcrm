"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoginUser } from "@/context/login";
import { useUsersList } from "@/hooks/useUserList";
import useSWR from "swr";
import {
  FileSpreadsheet,
  Calendar,
  User,
  Printer,
  FileText,
  ShoppingCart,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Check,
  X,
  Users,
  Share2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import * as XLSX from "xlsx";

type ViewMode = "daily" | "weekly" | "monthly";

interface DocumentItem {
  name: string;
  spec?: string;
  quantity: string | number;
  unit_price: number;
  amount: number;
  unit?: string;
}

interface DocumentDetail {
  id: string;
  type: string;
  documentNumber: string;
  totalAmount: number;
  status: string;
  items: DocumentItem[];
}

interface DailyReportItem {
  no: number;
  companyName: string;
  companyId: string;
  content: string;
  consultationId: string;
  consultationDate: string;
  authorName?: string;
  documents: DocumentDetail[];
  note: string;
}

interface DailyReportData {
  date: string;
  dateEnd?: string;
  dayOfWeek: string;
  author: string;
  authorId: string;
  items: DailyReportItem[];
  viewMode: ViewMode;
}

// 금액 포맷
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
};

// 문서 타입 텍스트
const getDocTypeText = (type: string) => {
  switch (type) {
    case "estimate": return "견적서";
    case "order": return "발주서";
    case "requestQuote": return "견적의뢰서";
    default: return type;
  }
};

// 문서 타입별 스타일
const getDocTypeStyle = (type: string) => {
  switch (type) {
    case "estimate": return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: FileText };
    case "order": return { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: ShoppingCart };
    case "requestQuote": return { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: ClipboardList };
    default: return { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", icon: FileText };
  }
};

// 문서 상태 텍스트 및 스타일
const getStatusInfo = (status: string) => {
  switch (status) {
    case "pending": return { text: "진행중", bg: "bg-yellow-100", textColor: "text-yellow-700" };
    case "completed": return { text: "완료", bg: "bg-green-100", textColor: "text-green-700" };
    case "canceled": return { text: "취소", bg: "bg-red-100", textColor: "text-red-700" };
    default: return { text: status, bg: "bg-slate-100", textColor: "text-slate-700" };
  }
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function DailyReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginUser = useLoginUser();
  const { users } = useUsersList();
  const printRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split("T")[0];

  // URL에서 초기 상태 읽기
  const initialDate = searchParams.get("date") || today;
  const initialMode = (searchParams.get("mode") as ViewMode) || "daily";
  const initialUserId = searchParams.get("userId") || "";
  const initialAllUsers = searchParams.get("allUsers") === "true";

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUserId);
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [allUsers, setAllUsers] = useState(initialAllUsers);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteValue, setEditNoteValue] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 로그인 사용자로 초기화 (URL에 userId가 없을 때만)
  useEffect(() => {
    if (loginUser?.id && !selectedUserId && !initialUserId && !allUsers) {
      setSelectedUserId(loginUser.id);
    }
    setIsInitialized(true);
  }, [loginUser?.id, selectedUserId, initialUserId, allUsers]);

  // URL 업데이트 (상태 변경 시)
  useEffect(() => {
    if (!isInitialized) return;

    const params = new URLSearchParams();
    params.set("date", selectedDate);
    params.set("mode", viewMode);
    if (allUsers) {
      params.set("allUsers", "true");
    } else if (selectedUserId) {
      params.set("userId", selectedUserId);
    }

    const newUrl = `/reports/daily?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [selectedDate, viewMode, selectedUserId, allUsers, isInitialized, router]);

  const apiUrl = selectedUserId || allUsers
    ? `/api/reports/daily?date=${selectedDate}&mode=${viewMode}${allUsers ? "&allUsers=true" : `&userId=${selectedUserId}`}`
    : null;

  const { data: reportData, isLoading, error, mutate } = useSWR<DailyReportData>(
    apiUrl,
    fetcher
  );

  const formatDisplayDate = (dateStr: string, dayOfWeek: string, dateEnd?: string) => {
    if (dateEnd && dateEnd !== dateStr) {
      const [sY, sM, sD] = dateStr.split("-");
      const [eY, eM, eD] = dateEnd.split("-");
      if (sY === eY) {
        return `${sY}-${sM}-${sD} ~ ${eM}-${eD} (${dayOfWeek})`;
      }
      return `${dateStr} ~ ${dateEnd} (${dayOfWeek})`;
    }
    const [year, month, day] = dateStr.split("-");
    return `${year}-${month}-${day} (${dayOfWeek})`;
  };

  const goToPreviousDay = useCallback(() => {
    const date = new Date(selectedDate);
    if (viewMode === "daily") {
      date.setDate(date.getDate() - 1);
    } else if (viewMode === "weekly") {
      date.setDate(date.getDate() - 7);
    } else {
      date.setMonth(date.getMonth() - 1);
    }
    setSelectedDate(date.toISOString().split("T")[0]);
  }, [selectedDate, viewMode]);

  const goToNextDay = useCallback(() => {
    const date = new Date(selectedDate);
    if (viewMode === "daily") {
      date.setDate(date.getDate() + 1);
    } else if (viewMode === "weekly") {
      date.setDate(date.getDate() + 7);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    setSelectedDate(date.toISOString().split("T")[0]);
  }, [selectedDate, viewMode]);

  const goToToday = useCallback(() => {
    setSelectedDate(today);
  }, [today]);

  // 총 매출/매입 계산 (handleExcelDownload보다 먼저 정의)
  const totals = useMemo(() => {
    const initial = {
      salesPending: 0, salesCompleted: 0,
      purchasePending: 0, purchaseCompleted: 0,
      salesPendingCount: 0, salesCompletedCount: 0,
      purchasePendingCount: 0, purchaseCompletedCount: 0,
    };
    if (!reportData?.items) return initial;

    reportData.items.forEach((item) => {
      item.documents.forEach((doc) => {
        const isCompleted = doc.status === "completed";
        if (doc.type === "estimate") {
          if (isCompleted) {
            initial.salesCompleted += doc.totalAmount;
            initial.salesCompletedCount++;
          } else if (doc.status === "pending") {
            initial.salesPending += doc.totalAmount;
            initial.salesPendingCount++;
          }
        } else if (doc.type === "order") {
          if (isCompleted) {
            initial.purchaseCompleted += doc.totalAmount;
            initial.purchaseCompletedCount++;
          } else if (doc.status === "pending") {
            initial.purchasePending += doc.totalAmount;
            initial.purchasePendingCount++;
          }
        }
      });
    });

    return initial;
  }, [reportData]);

  const hasTotals = totals.salesPending > 0 || totals.salesCompleted > 0 || totals.purchasePending > 0 || totals.purchaseCompleted > 0;

  const handleExcelDownload = useCallback(() => {
    if (!reportData?.items.length) return;

    const wb = XLSX.utils.book_new();
    const wsData: (string | number)[][] = [];

    const modeText = viewMode === "daily" ? "일일" : viewMode === "weekly" ? "주간" : "월간";

    wsData.push([]);
    wsData.push(["", "", "", `${modeText} 업무일지`, "", "", "", "", ""]);
    wsData.push([]);
    wsData.push(["", "작성일", formatDisplayDate(reportData.date, reportData.dayOfWeek, reportData.dateEnd), "", "", "", "담당", "검토", "대표"]);
    wsData.push(["", "작성자", reportData.author, "", "", "", "", "", ""]);
    if (hasTotals) {
      wsData.push(["", "매출(진행)", formatCurrency(totals.salesPending), `(${totals.salesPendingCount}건)`, "매출(완료)", formatCurrency(totals.salesCompleted), `(${totals.salesCompletedCount}건)`, "", ""]);
      wsData.push(["", "매입(진행)", formatCurrency(totals.purchasePending), `(${totals.purchasePendingCount}건)`, "매입(완료)", formatCurrency(totals.purchaseCompleted), `(${totals.purchaseCompletedCount}건)`, "", ""]);
    }
    wsData.push([]);
    wsData.push(["", "No.", allUsers ? "업체명 (작성자)" : "업체명", "내용", "", "", "", "", "비고"]);

    reportData.items.forEach((item) => {
      let contentWithDocs = item.content;

      if (item.documents.length > 0) {
        item.documents.forEach((doc) => {
          const statusInfo = getStatusInfo(doc.status);
          contentWithDocs += `\n\n[${getDocTypeText(doc.type)} - ${doc.documentNumber || "번호없음"}] (${statusInfo.text}) 총액: ${formatCurrency(doc.totalAmount)}`;
          if (doc.items.length > 0) {
            doc.items.forEach((docItem, idx) => {
              contentWithDocs += `\n  ${idx + 1}. ${docItem.name}${docItem.spec ? ` (${docItem.spec})` : ""} - ${docItem.quantity}${docItem.unit || "개"} x ${formatCurrency(docItem.unit_price)} = ${formatCurrency(docItem.amount)}`;
            });
          }
        });
      }

      const companyCell = item.authorName ? `${item.companyName} (${item.authorName})` : item.companyName;
      wsData.push(["", item.no, companyCell, contentWithDocs, "", "", "", "", item.note || ""]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [
      { wch: 2 }, { wch: 5 }, { wch: 15 }, { wch: 80 },
      { wch: 5 }, { wch: 5 }, { wch: 8 }, { wch: 8 }, { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "업무일지");
    XLSX.writeFile(wb, `업무일지_${reportData.author}_${reportData.date}.xlsx`);
  }, [reportData, viewMode, totals, hasTotals]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDocumentClick = (docId: string) => {
    router.push(`/documents/review?documentId=${docId}`);
  };

  const handleConsultationClick = (companyId: string, consultationId: string) => {
    router.push(`/consultations/${companyId}?highlight=${consultationId}`);
  };

  const handleStartEditNote = (consultationId: string, currentNote: string) => {
    setEditingNoteId(consultationId);
    setEditNoteValue(currentNote);
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditNoteValue("");
  };

  const handleSaveNote = async (consultationId: string) => {
    setSavingNote(true);
    try {
      const res = await fetch("/api/reports/daily", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationId,
          note: editNoteValue,
        }),
      });

      if (res.ok) {
        mutate();
        setEditingNoteId(null);
        setEditNoteValue("");
      }
    } catch (error) {
      console.error("비고 저장 실패:", error);
    } finally {
      setSavingNote(false);
    }
  };

  const handleShareReport = () => {
    // 결재 시스템으로 이동 (업무일지 공유/보고)
    const params = new URLSearchParams({
      type: "daily_report",
      date: selectedDate,
      userId: selectedUserId || "",
      mode: viewMode,
    });
    router.push(`/approvals/new?${params.toString()}`);
  };

  const isOwnReport = loginUser?.id === selectedUserId;
  const canEditNote = isOwnReport && viewMode === "daily";
  const isAdmin = loginUser?.role === "admin" || loginUser?.role === "managementSupport";

  const getReportTitle = () => {
    switch (viewMode) {
      case "daily": return "일일 업무일지";
      case "weekly": return "주간 업무일지";
      case "monthly": return "월간 업무일지";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b px-6 py-4 print:hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">업무일지</h1>
            <div className="flex gap-2">
              <button
                onClick={handleShareReport}
                disabled={!reportData?.items.length}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Share2 className="w-4 h-4" />
                보고
              </button>
              <button
                onClick={handleExcelDownload}
                disabled={!reportData?.items.length}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={handlePrint}
                disabled={!reportData?.items.length}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Printer className="w-4 h-4" />
                인쇄/PDF
              </button>
            </div>
          </div>

          {/* 보기 모드 탭 */}
          <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
            {(["daily", "weekly", "monthly"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === mode
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {mode === "daily" ? "일간" : mode === "weekly" ? "주간" : "월간"}
              </button>
            ))}
          </div>

          {/* 필터 영역 */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <button
                onClick={goToPreviousDay}
                className="p-1.5 rounded hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={goToNextDay}
                disabled={selectedDate >= today}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {selectedDate !== today && (
                <button
                  onClick={goToToday}
                  className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                >
                  오늘
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <select
                value={allUsers ? "" : selectedUserId}
                onChange={(e) => {
                  if (e.target.value) {
                    setAllUsers(false);
                    setSelectedUserId(e.target.value);
                  }
                }}
                disabled={allUsers}
                className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] disabled:bg-gray-100"
              >
                <option value="">작성자 선택</option>
                {users?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} {user.level}
                  </option>
                ))}
              </select>
            </div>

            {isAdmin && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allUsers}
                  onChange={(e) => setAllUsers(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">전체 직원 조회</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="max-w-7xl mx-auto p-6 print:p-0 print:max-w-none">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-600">
            데이터를 불러오는 데 실패했습니다.
          </div>
        ) : (!selectedUserId && !allUsers) ? (
          <div className="text-center py-20 text-gray-500">
            작성자를 선택해주세요.
          </div>
        ) : reportData?.items.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            해당 기간에 작성된 상담 기록이 없습니다.
          </div>
        ) : reportData ? (
          <div
            id="print-area"
            ref={printRef}
            className="bg-white rounded-lg border shadow-sm print:shadow-none print:border-0"
          >
            {/* 업무일지 제목 */}
            <div className="text-center py-6 border-b">
              <h2 className="text-2xl font-bold">{getReportTitle()}</h2>
            </div>

            {/* 상단 정보 + 결재란 */}
            <div className="flex border-b">
              <div className="flex-1 p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex">
                    <span className="font-medium text-gray-500 w-16">작성일</span>
                    <span>{formatDisplayDate(reportData.date, reportData.dayOfWeek, reportData.dateEnd)}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-500 w-16">작성자</span>
                    <span>{reportData.author}</span>
                  </div>
                </div>
              </div>
              <div className="border-l">
                <table className="h-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 border-r w-16">담당</th>
                      <th className="px-4 py-2 border-r w-16">검토</th>
                      <th className="px-4 py-2 w-16">대표</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-4 border-r border-t"></td>
                      <td className="px-4 py-4 border-r border-t"></td>
                      <td className="px-4 py-4 border-t"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 일일 요약 (매출/매입 - 진행중/완료 구분) */}
            {hasTotals && (
              <div className="border-b p-3">
                <div className="grid grid-cols-2 gap-4">
                  {/* 매출 (견적서) */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">매출 (견적)</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">진행</span>
                        <span className="font-medium">{formatCurrency(totals.salesPending)}</span>
                        {totals.salesPendingCount > 0 && (
                          <span className="text-xs text-gray-400">({totals.salesPendingCount}건)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">완료</span>
                        <span className="font-medium text-green-600">{formatCurrency(totals.salesCompleted)}</span>
                        {totals.salesCompletedCount > 0 && (
                          <span className="text-xs text-gray-400">({totals.salesCompletedCount}건)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* 매입 (발주서) */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">매입 (발주)</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">진행</span>
                        <span className="font-medium">{formatCurrency(totals.purchasePending)}</span>
                        {totals.purchasePendingCount > 0 && (
                          <span className="text-xs text-gray-400">({totals.purchasePendingCount}건)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">완료</span>
                        <span className="font-medium text-green-600">{formatCurrency(totals.purchaseCompleted)}</span>
                        {totals.purchaseCompletedCount > 0 && (
                          <span className="text-xs text-gray-400">({totals.purchaseCompletedCount}건)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 업무 내용 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm main-content-table">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-3 py-3 text-center font-medium w-12 border-r">No.</th>
                    <th className="px-3 py-3 text-center font-medium w-28 border-r">업체명</th>
                    <th className="px-3 py-3 text-left font-medium border-r">내용</th>
                    <th className="px-3 py-3 text-center font-medium w-32">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.items.map((item) => (
                    <tr key={item.consultationId} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-3 text-center align-middle border-r">
                        {item.no}
                      </td>
                      <td className="px-3 py-3 text-center align-middle border-r">
                        <span
                          onClick={() => router.push(`/consultations/${item.companyId}`)}
                          className="text-blue-600 hover:underline cursor-pointer print:text-black print:cursor-default"
                        >
                          {item.companyName}
                        </span>
                        {item.authorName && (
                          <div className="text-xs text-gray-500 mt-1">
                            ({item.authorName})
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 border-r">
                        {/* 주간/월간 모드에서 상담 날짜 표시 */}
                        {viewMode !== "daily" && item.consultationDate && (
                          <div className="mb-2 text-xs text-gray-500 font-medium">
                            {item.consultationDate}
                          </div>
                        )}
                        <div
                          onClick={() => handleConsultationClick(item.companyId, item.consultationId)}
                          className="whitespace-pre-wrap cursor-pointer hover:bg-blue-50 rounded p-1 -m-1 print:cursor-default print:hover:bg-transparent"
                        >
                          {item.content}
                        </div>

                        {item.documents.length > 0 && (
                          <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
                            {item.documents.map((doc) => {
                              const style = getDocTypeStyle(doc.type);
                              const statusInfo = getStatusInfo(doc.status);
                              const IconComponent = style.icon;
                              return (
                                <div
                                  key={doc.id}
                                  className={`${style.bg} ${style.border} border rounded-lg p-3`}
                                >
                                  <div className={`flex items-center justify-between mb-2 ${style.text}`}>
                                    <div className="flex items-center gap-2 font-medium flex-wrap">
                                      <IconComponent className="w-4 h-4 shrink-0" />
                                      <span>{getDocTypeText(doc.type)}</span>
                                      {doc.documentNumber && (
                                        <button
                                          onClick={() => handleDocumentClick(doc.id)}
                                          className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100 hover:underline print:no-underline"
                                        >
                                          ({doc.documentNumber})
                                          <ExternalLink className="w-3 h-3 print:hidden" />
                                        </button>
                                      )}
                                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusInfo.bg} ${statusInfo.textColor}`}>
                                        {statusInfo.text}
                                      </span>
                                    </div>
                                    <span className="font-bold whitespace-nowrap">
                                      {formatCurrency(doc.totalAmount)}
                                    </span>
                                  </div>

                                  {doc.items.length > 0 && (
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="bg-white/50">
                                          <th className="border border-gray-300 px-2 py-1 text-left">품목</th>
                                          <th className="border border-gray-300 px-2 py-1 text-left w-20">규격</th>
                                          <th className="border border-gray-300 px-2 py-1 text-right w-14">수량</th>
                                          <th className="border border-gray-300 px-2 py-1 text-right w-20">단가</th>
                                          <th className="border border-gray-300 px-2 py-1 text-right w-20">금액</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {doc.items.map((docItem, idx) => (
                                          <tr key={idx} className="bg-white/30">
                                            <td className="border border-gray-300 px-2 py-1">{docItem.name}</td>
                                            <td className="border border-gray-300 px-2 py-1 text-gray-600">{docItem.spec || "-"}</td>
                                            <td className="border border-gray-300 px-2 py-1 text-right whitespace-nowrap">
                                              {docItem.quantity}{docItem.unit || ""}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1 text-right whitespace-nowrap">
                                              {formatCurrency(docItem.unit_price)}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1 text-right font-medium whitespace-nowrap">
                                              {formatCurrency(docItem.amount)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center align-middle">
                        {editingNoteId === item.consultationId ? (
                          <div className="flex flex-col gap-1">
                            <textarea
                              value={editNoteValue}
                              onChange={(e) => setEditNoteValue(e.target.value)}
                              className="w-full min-h-[60px] px-2 py-1 text-sm border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => handleSaveNote(item.consultationId)}
                                disabled={savingNote}
                                className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEditNote}
                                disabled={savingNote}
                                className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-gray-600">{item.note || "-"}</span>
                            {canEditNote && (
                              <button
                                onClick={() => handleStartEditNote(item.consultationId, item.note)}
                                className="p-1 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors print:hidden"
                                title="비고 수정"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      {/* 인쇄용 스타일 */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }

          .print\\:hidden {
            display: none !important;
          }

          #print-area,
          #print-area * {
            visibility: visible !important;
          }

          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            font-size: 10px !important;
          }

          #print-area table {
            border-collapse: collapse;
          }

          /* 메인 내용 테이블에만 고정 레이아웃 적용 */
          #print-area .main-content-table {
            width: 100% !important;
            table-layout: fixed !important;
          }

          #print-area .main-content-table th,
          #print-area .main-content-table td {
            border: 1px solid #d1d5db !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            padding: 4px 6px !important;
          }

          /* 메인 테이블 컬럼 너비 조정 */
          #print-area .main-content-table th:nth-child(1),
          #print-area .main-content-table td:nth-child(1) {
            width: 6% !important;
          }
          #print-area .main-content-table th:nth-child(2),
          #print-area .main-content-table td:nth-child(2) {
            width: 14% !important;
          }
          #print-area .main-content-table th:nth-child(3),
          #print-area .main-content-table td:nth-child(3) {
            width: 60% !important;
          }
          #print-area .main-content-table th:nth-child(4),
          #print-area .main-content-table td:nth-child(4) {
            width: 20% !important;
          }

          /* 행 분리 방지 */
          #print-area .main-content-table tr {
            page-break-inside: avoid !important;
          }

          /* 문서 상세 카드 크기 조정 */
          #print-area .rounded-lg {
            padding: 6px !important;
            margin-top: 6px !important;
          }

          #print-area .bg-gray-50 {
            background-color: #f9fafb !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #print-area .bg-blue-50 {
            background-color: #eff6ff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #print-area .bg-green-50 {
            background-color: #f0fdf4 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #print-area .bg-orange-50 {
            background-color: #fff7ed !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #print-area .bg-yellow-100 {
            background-color: #fef9c3 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #print-area .bg-green-100 {
            background-color: #dcfce7 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #print-area .bg-red-100 {
            background-color: #fee2e2 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          @page {
            size: A4 landscape;
            margin: 8mm;
          }
        }
      `}</style>
    </div>
  );
}

export default function DailyReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DailyReportContent />
    </Suspense>
  );
}
