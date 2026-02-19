"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { motion } from "framer-motion";
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
import HeadlessSelect from "@/components/ui/HeadlessSelect";
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
  title: string;
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
    case "estimate": return { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", icon: FileText };
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
    if (loginUser?.id) {
      if (!selectedUserId && !initialUserId && !allUsers) {
        setSelectedUserId(loginUser.id);
      }
      // loginUser 로드 후에만 initialized 설정
      setIsInitialized(true);
    }
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
      // 제목이 있으면 내용 앞에 추가
      let contentWithDocs = item.title ? `[${item.title}]\n${item.content}` : item.content;

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
    <div className="min-h-screen bg-slate-50 px-2 md:px-4 py-4">
      {/* 헤더 */}
      <div className="max-w-7xl mx-auto space-y-4 print:hidden">
        {/* 타이틀 + 액션 버튼 */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-100 rounded-xl">
              <FileText className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">업무일지</h1>
              <p className="text-sm text-slate-500">일일/주간/월간 업무 보고</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareReport}
              disabled={!reportData?.items.length}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2 className="w-4 h-4" />
              보고
            </button>
            <button
              onClick={handleExcelDownload}
              disabled={!reportData?.items.length}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={handlePrint}
              disabled={!reportData?.items.length}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-sky-600 bg-sky-50 rounded-lg hover:bg-sky-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              인쇄
            </button>
          </div>
        </div>

        {/* 필터 영역 */}
        <div className="flex flex-wrap items-center gap-3 px-2 py-3 bg-white rounded-lg border border-slate-200 shadow-sm">
          {/* 날짜 선택 */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <button
              onClick={goToPreviousDay}
              className="p-1 rounded hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={goToNextDay}
              disabled={selectedDate >= today}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
            {selectedDate !== today && (
              <button
                onClick={goToToday}
                className="px-2 py-1 text-xs text-sky-600 hover:bg-sky-50 rounded"
              >
                오늘
              </button>
            )}
          </div>

          <div className="w-px h-6 bg-slate-200" />

          {/* 작성자 선택 */}
          <div className="flex items-center gap-1.5 min-w-[160px]">
            <HeadlessSelect
              value={allUsers ? "" : selectedUserId}
              onChange={(value) => {
                if (value) {
                  setAllUsers(false);
                  setSelectedUserId(value);
                }
              }}
              disabled={allUsers}
              options={users?.map((user) => ({
                value: user.id,
                label: `${user.name} ${user.level}`,
              })) || []}
              placeholder="작성자 선택"
              icon={<User className="h-4 w-4" />}
            />
          </div>

          {isAdmin && (
            <>
              <div className="w-px h-6 bg-slate-200" />
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allUsers}
                  onChange={(e) => setAllUsers(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">전체 직원</span>
              </label>
            </>
          )}

          <div className="w-px h-6 bg-slate-200" />

          {/* 보기 모드 탭 */}
          <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
            {(["daily", "weekly", "monthly"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === mode
                    ? "bg-white text-sky-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {mode === "daily" ? "일간" : mode === "weekly" ? "주간" : "월간"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-2 mt-4 print:p-0 print:max-w-none print:mt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-600">
            데이터를 불러오는 데 실패했습니다.
          </div>
        ) : (!selectedUserId && !allUsers) ? (
          <div className="text-center py-20 text-slate-500">
            작성자를 선택해주세요.
          </div>
        ) : reportData?.items.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
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
                    <span className="font-medium text-slate-400 w-16">작성일</span>
                    <span>{formatDisplayDate(reportData.date, reportData.dayOfWeek, reportData.dateEnd)}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-slate-400 w-16">작성자</span>
                    <span>{reportData.author}</span>
                  </div>
                </div>
              </div>
              <div className="border-l">
                <table className="h-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
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
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-sky-600" />
                      <span className="text-sm font-medium text-slate-600">매출 (견적)</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">진행</span>
                        <span className="font-medium">{formatCurrency(totals.salesPending)}</span>
                        {totals.salesPendingCount > 0 && (
                          <span className="text-xs text-slate-400">({totals.salesPendingCount}건)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">완료</span>
                        <span className="font-medium text-green-600">{formatCurrency(totals.salesCompleted)}</span>
                        {totals.salesCompletedCount > 0 && (
                          <span className="text-xs text-slate-400">({totals.salesCompletedCount}건)</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                  {/* 매입 (발주서) */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-slate-600">매입 (발주)</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">진행</span>
                        <span className="font-medium">{formatCurrency(totals.purchasePending)}</span>
                        {totals.purchasePendingCount > 0 && (
                          <span className="text-xs text-slate-400">({totals.purchasePendingCount}건)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">완료</span>
                        <span className="font-medium text-green-600">{formatCurrency(totals.purchaseCompleted)}</span>
                        {totals.purchaseCompletedCount > 0 && (
                          <span className="text-xs text-slate-400">({totals.purchaseCompletedCount}건)</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* 업무 내용 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm main-content-table">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="px-3 py-3 text-center font-medium w-12 border-r">No.</th>
                    <th className="px-3 py-3 text-center font-medium w-28 border-r">업체명</th>
                    <th className="px-3 py-3 text-left font-medium border-r w-[45%]">내용</th>
                    <th className="px-3 py-3 text-center font-medium w-32">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.items.map((item) => (
                    <tr key={item.consultationId} className="border-b hover:bg-slate-50">
                      <td className="px-3 py-3 text-center align-middle border-r">
                        {item.no}
                      </td>
                      <td className="px-3 py-3 text-center align-middle border-r">
                        <span
                          onClick={() => router.push(`/consultations/${item.companyId}`)}
                          className="text-sky-600 hover:underline cursor-pointer print:text-black print:cursor-default"
                        >
                          {item.companyName}
                        </span>
                        {item.authorName && (
                          <div className="text-xs text-slate-400 mt-1">
                            ({item.authorName})
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 border-r">
                        {/* 주간/월간 모드에서 상담 날짜 표시 */}
                        {viewMode !== "daily" && item.consultationDate && (
                          <div className="mb-2 text-xs text-slate-400 font-medium">
                            {item.consultationDate}
                          </div>
                        )}
                        {/* 상담 제목 */}
                        {item.title && (
                          <div className="mb-1.5 font-semibold text-slate-800">
                            {item.title}
                          </div>
                        )}
                        <div
                          onClick={() => handleConsultationClick(item.companyId, item.consultationId)}
                          className="whitespace-pre-wrap cursor-pointer hover:bg-sky-50 rounded p-1 -m-1 print:cursor-default print:hover:bg-transparent"
                        >
                          {item.content}
                        </div>

                        {item.documents.length > 0 && (
                          <div className="space-y-2 mt-3 pt-3 border-t border-slate-100">
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
                                    <table className="w-full text-xs table-fixed">
                                      <thead>
                                        <tr className="bg-white/50">
                                          <th className="border border-slate-300 px-2 py-1 text-left w-[35%]">품목</th>
                                          <th className="border border-slate-300 px-2 py-1 text-left w-[20%]">규격</th>
                                          <th className="border border-slate-300 px-2 py-1 text-right w-[10%]">수량</th>
                                          <th className="border border-slate-300 px-2 py-1 text-right w-[15%]">단가</th>
                                          <th className="border border-slate-300 px-2 py-1 text-right w-[20%]">금액</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {doc.items.map((docItem, idx) => (
                                          <tr key={idx} className="bg-white/30">
                                            <td className="border border-slate-300 px-2 py-1">{docItem.name}</td>
                                            <td className="border border-slate-300 px-2 py-1 text-slate-500">{docItem.spec || "-"}</td>
                                            <td className="border border-slate-300 px-2 py-1 text-right whitespace-nowrap">
                                              {docItem.quantity}{docItem.unit || ""}
                                            </td>
                                            <td className="border border-slate-300 px-2 py-1 text-right whitespace-nowrap">
                                              {formatCurrency(docItem.unit_price)}
                                            </td>
                                            <td className="border border-slate-300 px-2 py-1 text-right font-medium whitespace-nowrap">
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
                              className="w-full min-h-[60px] px-2 py-1 text-sm border rounded resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                            <span className="text-slate-500">{item.note || "-"}</span>
                            {canEditNote && (
                              <button
                                onClick={() => handleStartEditNote(item.consultationId, item.note)}
                                className="p-1 text-slate-300 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors print:hidden"
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

          #print-area .main-content-table > thead > tr > th,
          #print-area .main-content-table > tbody > tr > td {
            border: 1px solid #d1d5db !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            padding: 4px 6px !important;
          }

          /* 메인 테이블 컬럼 너비 조정 (직접 자식만) */
          #print-area .main-content-table > thead > tr > th:nth-child(1),
          #print-area .main-content-table > tbody > tr > td:nth-child(1) {
            width: 6% !important;
          }
          #print-area .main-content-table > thead > tr > th:nth-child(2),
          #print-area .main-content-table > tbody > tr > td:nth-child(2) {
            width: 14% !important;
          }
          #print-area .main-content-table > thead > tr > th:nth-child(3),
          #print-area .main-content-table > tbody > tr > td:nth-child(3) {
            width: 55% !important;
          }
          #print-area .main-content-table > thead > tr > th:nth-child(4),
          #print-area .main-content-table > tbody > tr > td:nth-child(4) {
            width: 25% !important;
          }

          /* 행 분리 방지 */
          #print-area .main-content-table > tbody > tr {
            page-break-inside: avoid !important;
          }

          /* 문서 품목 테이블 스타일 */
          #print-area .table-fixed {
            table-layout: fixed !important;
            width: 100% !important;
          }
          #print-area .table-fixed th,
          #print-area .table-fixed td {
            border: 1px solid #d1d5db !important;
            padding: 2px 4px !important;
            font-size: 9px !important;
          }

          /* 문서 상세 카드 크기 조정 */
          #print-area .rounded-lg {
            padding: 6px !important;
            margin-top: 6px !important;
          }

          #print-area .bg-slate-50 {
            background-color: #f9fafb !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #print-area .bg-sky-50 {
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
            size: A4 portrait;
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DailyReportContent />
    </Suspense>
  );
}
