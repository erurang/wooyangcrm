"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Package,
  CheckCircle,
  Clock,
  Building2,
  FileText,
  User,
  Calendar,
  UserCheck,
  Printer,
  X,
  Edit3,
  Plus,
  Trash2,
  Square,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Copy,
  Loader2,
  AlertCircle,
  XCircle,
  Truck,
  AlertTriangle,
  Search,
} from "lucide-react";
import dayjs from "dayjs";
import { useInventoryTasks, useInventoryStats } from "@/hooks/inventory/useInventoryTasks";
import { useUpdateInventoryTask } from "@/hooks/inventory/useUpdateInventoryTask";
import { useLoginUser } from "@/context/login";
import { useUsersList } from "@/hooks/useUserList";
import type {
  InventoryTaskWithDetails,
  InventoryTaskStatus,
  SpecSheetField,
  SpecSheetPage,
  InventoryItem,
} from "@/types/inventory";
import { isOverdue } from "@/types/inventory";
import { CircularProgress } from "@mui/material";
import DocumentDetailModal from "@/components/inventory/DocumentDetailModal";

// 기본 필드 템플릿 (출고용)
const getDefaultFields = (
  task: InventoryTaskWithDetails
): SpecSheetField[] => {
  const items = (task.document?.content?.items || []) as InventoryItem[];
  const productNames = items.map((p) => p.name).join(", ");
  const specs = items.map((p) => p.spec || "-").join(", ");
  const quantities = items.map((p) => `${p.quantity}${p.unit || "개"}`).join(", ");

  return [
    { id: "1", label: "납품업체", value: "우양신소재" },
    { id: "2", label: "견적번호", value: task.document_number || "" },
    { id: "3", label: "품명", value: productNames },
    { id: "4", label: "규격", value: specs },
    { id: "5", label: "수량", value: quantities },
    { id: "6", label: "출고일자", value: task.expected_date || "" },
    { id: "7", label: "박스 No.", value: "" },
  ];
};

// KST 기준 날짜 계산 헬퍼
const getKSTDate = (daysOffset: number = 0): string => {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  kstDate.setDate(kstDate.getDate() + daysOffset);
  return kstDate.toISOString().split("T")[0];
};

export default function OutboundPage() {
  const loginUser = useLoginUser();
  const { users } = useUsersList();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [filter, setFilter] = useState<"all" | InventoryTaskStatus | "overdue">("all");
  const [page, setPage] = useState(1);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 기간 필터 (기본: 30일 전 ~ 오늘)
  const [dateFrom, setDateFrom] = useState(() => getKSTDate(-30));
  const [dateTo, setDateTo] = useState(() => getKSTDate(0));

  // 통계 데이터 가져오기 (기간 필터 적용)
  const { stats, mutate: refreshStats } = useInventoryStats({
    taskType: "outbound",
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  // API로 데이터 가져오기
  const {
    tasks: rawTasks,
    total,
    totalPages,
    isLoading,
    isError,
    mutate: refreshTasks,
  } = useInventoryTasks({
    task_type: "outbound",
    status: filter === "all" ? undefined : filter,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    limit: 10,
  });

  // 데이터 갱신 함수
  const handleRefresh = () => {
    refreshTasks();
    refreshStats();
  };

  // 검색 필터 적용 (클라이언트 사이드)
  const tasks = searchQuery
    ? rawTasks.filter(t => {
        const query = searchQuery.toLowerCase();
        const items = (t.document?.content?.items || []) as InventoryItem[];
        const productNames = items.map(p => p.name?.toLowerCase() || "").join(" ");
        return (
          t.company?.name?.toLowerCase().includes(query) ||
          t.document_number?.toLowerCase().includes(query) ||
          productNames.includes(query)
        );
      })
    : rawTasks;

  const { updateTask, assignTask, completeTask, isLoading: isUpdating } =
    useUpdateInventoryTask();

  // 체크박스 선택
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 담당자 변경 모달
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // 예정일 수정 모달
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState("");

  // 상품명세서 모달 (다중 페이지 지원)
  const [specSheetOpen, setSpecSheetOpen] = useState(false);
  const [specSheetPages, setSpecSheetPages] = useState<SpecSheetPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);

  // 문서 상세 모달
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedDocumentTask, setSelectedDocumentTask] = useState<InventoryTaskWithDetails | null>(null);

  const handleOpenDocumentModal = (task: InventoryTaskWithDetails) => {
    setSelectedDocumentTask(task);
    setDocumentModalOpen(true);
  };

  // 통계는 별도 API에서 가져옴 (stats)

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setPage(1);
  }, [filter]);

  // 하이라이트 처리 (알림에서 이동 시)
  useEffect(() => {
    if (highlightId && tasks.length > 0) {
      const taskExists = tasks.some((t) => t.id === highlightId);
      if (taskExists) {
        setHighlightedTaskId(highlightId);
        setTimeout(() => {
          const element = document.getElementById(`task-${highlightId}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
        setTimeout(() => {
          setHighlightedTaskId(null);
        }, 3000);
      } else {
        setFilter("all");
      }
    }
  }, [highlightId, tasks]);

  const handleConfirm = async (taskId: string) => {
    if (!loginUser) return;
    const result = await completeTask(taskId, loginUser.id);
    if (result.success) {
      handleRefresh();
    }
  };

  const handleOpenAssignModal = (taskId: string) => {
    setSelectedTaskId(taskId);
    setAssignModalOpen(true);
  };

  const handleOpenDateModal = (taskId: string, currentDate: string | null) => {
    setSelectedTaskId(taskId);
    setEditingDate(currentDate || "");
    setDateModalOpen(true);
  };

  const handleChangeAssignee = async (userId: string) => {
    if (selectedTaskId && loginUser) {
      const result = await assignTask(selectedTaskId, userId, loginUser.id);
      if (result.success) {
        handleRefresh();
      }
    }
    setAssignModalOpen(false);
    setSelectedTaskId(null);
  };

  const handleUpdateExpectedDate = async () => {
    if (selectedTaskId && loginUser) {
      const result = await updateTask(selectedTaskId, {
        expected_date: editingDate || null,
        user_id: loginUser.id,
      });
      if (result.success) {
        handleRefresh();
      }
    }
    setDateModalOpen(false);
    setSelectedTaskId(null);
    setEditingDate("");
  };

  const handleCancelTask = async (taskId: string) => {
    if (!loginUser) return;
    if (!confirm("이 출고 작업을 취소하시겠습니까?")) return;

    const result = await updateTask(taskId, {
      status: "canceled",
      user_id: loginUser.id,
    });
    if (result.success) {
      handleRefresh();
    }
  };

  // 체크박스 핸들러
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const taskIds = tasks.map((task) => task.id);
    const allSelected = taskIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(taskIds));
    }
  };

  // 단일 아이템 명세서 열기
  const handleOpenSpecSheet = (task: InventoryTaskWithDetails) => {
    const specPage: SpecSheetPage = {
      id: Date.now().toString(),
      itemId: task.id,
      documentNumber: task.document_number,
      companyName: task.company?.name || "",
      fields: getDefaultFields(task),
    };
    setSpecSheetPages([specPage]);
    setCurrentPageIndex(0);
    setSpecSheetOpen(true);
  };

  // 선택된 아이템들 일괄 명세서 열기
  const handleOpenBulkSpecSheet = () => {
    if (selectedIds.size === 0) return;

    const pages: SpecSheetPage[] = tasks
      .filter((task) => selectedIds.has(task.id))
      .map((task) => ({
        id: Date.now().toString() + task.id,
        itemId: task.id,
        documentNumber: task.document_number,
        companyName: task.company?.name || "",
        fields: getDefaultFields(task),
      }));

    setSpecSheetPages(pages);
    setCurrentPageIndex(0);
    setSpecSheetOpen(true);
  };

  const handleUpdateField = (
    pageId: string,
    fieldId: string,
    key: "label" | "value",
    newValue: string
  ) => {
    setSpecSheetPages((prev) =>
      prev.map((specPage) =>
        specPage.id === pageId
          ? {
              ...specPage,
              fields: specPage.fields.map((field) =>
                field.id === fieldId ? { ...field, [key]: newValue } : field
              ),
            }
          : specPage
      )
    );
  };

  const handleAddField = (pageId: string) => {
    const newId = Date.now().toString();
    setSpecSheetPages((prev) =>
      prev.map((specPage) =>
        specPage.id === pageId
          ? {
              ...specPage,
              fields: [...specPage.fields, { id: newId, label: "항목", value: "" }],
            }
          : specPage
      )
    );
  };

  const handleRemoveField = (pageId: string, fieldId: string) => {
    setSpecSheetPages((prev) =>
      prev.map((specPage) =>
        specPage.id === pageId
          ? {
              ...specPage,
              fields: specPage.fields.filter((field) => field.id !== fieldId),
            }
          : specPage
      )
    );
  };

  const handleMoveField = (
    pageId: string,
    fieldId: string,
    direction: "up" | "down"
  ) => {
    setSpecSheetPages((prev) =>
      prev.map((specPage) => {
        if (specPage.id !== pageId) return specPage;

        const fields = [...specPage.fields];
        const currentIndex = fields.findIndex((f) => f.id === fieldId);
        if (currentIndex === -1) return specPage;

        const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= fields.length) return specPage;

        [fields[currentIndex], fields[newIndex]] = [
          fields[newIndex],
          fields[currentIndex],
        ];

        return { ...specPage, fields };
      })
    );
  };

  const handleAddPage = () => {
    const newPage: SpecSheetPage = {
      id: Date.now().toString(),
      itemId: "",
      documentNumber: "",
      companyName: "",
      fields: [
        { id: "1", label: "납품업체", value: "우양신소재" },
        { id: "2", label: "견적번호", value: "" },
        { id: "3", label: "품명", value: "" },
        { id: "4", label: "규격", value: "" },
        { id: "5", label: "수량", value: "" },
        { id: "6", label: "출고일자", value: "" },
        { id: "7", label: "박스 No.", value: "" },
      ],
    };
    setSpecSheetPages((prev) => [...prev, newPage]);
    setCurrentPageIndex(specSheetPages.length);
  };

  const handleRemovePage = (pageId: string) => {
    setSpecSheetPages((prev) => {
      const newPages = prev.filter((p) => p.id !== pageId);
      if (currentPageIndex >= newPages.length) {
        setCurrentPageIndex(Math.max(0, newPages.length - 1));
      }
      return newPages;
    });
  };

  const handleDuplicatePage = (pageId: string) => {
    const pageToCopy = specSheetPages.find((p) => p.id === pageId);
    if (!pageToCopy) return;

    const newPage: SpecSheetPage = {
      id: Date.now().toString(),
      itemId: pageToCopy.itemId,
      documentNumber: pageToCopy.documentNumber,
      companyName: pageToCopy.companyName,
      fields: pageToCopy.fields.map((field) => ({
        ...field,
        id: Date.now().toString() + field.id,
      })),
    };

    const pageIndex = specSheetPages.findIndex((p) => p.id === pageId);
    setSpecSheetPages((prev) => {
      const newPages = [...prev];
      newPages.splice(pageIndex + 1, 0, newPage);
      return newPages;
    });
    setCurrentPageIndex(pageIndex + 1);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const generateSpecSheetHtml = (specPage: SpecSheetPage) => `
      <div class="spec-sheet">
        <div class="header">상 품 명 세 서</div>
        <table>
          <tbody>
            ${specPage.fields
              .map(
                (field) => `
              <tr>
                <th>${field.label}</th>
                <td>${field.value}</td>
              </tr>
            `
              )
              .join("")}
            <tr>
              <th>수령업체</th>
              <td>${specPage.companyName}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    const a4Pages: string[] = [];
    for (let i = 0; i < specSheetPages.length; i += 2) {
      const sheet1 = specSheetPages[i];
      const sheet2 = specSheetPages[i + 1];
      a4Pages.push(`
        <div class="a4-page ${i > 0 ? "page-break" : ""}">
          ${generateSpecSheetHtml(sheet1)}
          ${sheet2 ? generateSpecSheetHtml(sheet2) : '<div class="spec-sheet empty"></div>'}
        </div>
      `);
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>상품명세서</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Malgun Gothic', sans-serif; margin: 0; padding: 0; }
            .a4-page {
              width: 210mm;
              height: 297mm;
              padding: 10mm;
              display: flex;
              flex-direction: column;
              gap: 8mm;
            }
            .page-break { page-break-before: always; }
            .spec-sheet {
              flex: 1;
              padding: 8mm;
              border: 1px solid #ccc;
              display: flex;
              flex-direction: column;
            }
            .spec-sheet.empty {
              border: 1px dashed #ddd;
            }
            .header { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; flex: 1; }
            th, td { border: 1px solid #000; padding: 6px 10px; text-align: left; font-size: 12px; }
            th { background: #f5f5f5; width: 80px; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .a4-page { padding: 8mm; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          ${a4Pages.join("")}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusDisplay = (task: InventoryTaskWithDetails) => {
    switch (task.status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" />
            대기
          </span>
        );
      case "assigned":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            <UserCheck className="h-3 w-3" />
            배정됨
          </span>
        );
      case "completed":
        return (
          <div>
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3" />
              출고됨
            </span>
            {task.completed_at && (
              <div className="text-[10px] text-gray-400 mt-1">
                {dayjs(task.completed_at).format("MM-DD HH:mm")}
              </div>
            )}
          </div>
        );
      case "canceled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" />
            취소됨
          </span>
        );
      default:
        return null;
    }
  };

  // 초기 로딩 상태 (데이터가 아예 없을 때만)
  if (isLoading && rawTasks.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          <CircularProgress size={40} />
        </div>
      </div>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col items-center justify-center h-64 text-red-600">
          <AlertCircle className="h-12 w-12 mb-2" />
          <p>데이터를 불러오는데 실패했습니다</p>
          <button
            onClick={() => handleRefresh()}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* 헤더 */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="h-6 w-6 md:h-7 md:w-7 text-blue-600" />
            출고 관리
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            완료된 견적서 기준으로 출고 확인을 진행합니다
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          {/* 기간 필터 */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-500">~</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {/* 검색 */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="거래처, 문서번호, 품명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 선택 인쇄 버튼 */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm text-blue-700 font-medium">
            {selectedIds.size}개 선택됨
          </span>
          <button
            onClick={handleOpenBulkSpecSheet}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Printer className="h-4 w-4" />
            선택 명세서 인쇄
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            선택 해제
          </button>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-5 gap-2 md:gap-4 mb-6">
        <div
          onClick={() => setFilter("all")}
          className={`p-3 md:p-4 rounded-lg border cursor-pointer transition-all ${
            filter === "all"
              ? "bg-blue-50 border-blue-300"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="text-xs md:text-sm text-gray-500">전체</div>
          <div className="text-xl md:text-2xl font-bold text-gray-900">
            {stats.total}
          </div>
        </div>
        <div
          onClick={() => setFilter("pending")}
          className={`p-3 md:p-4 rounded-lg border cursor-pointer transition-all ${
            filter === "pending"
              ? "bg-yellow-50 border-yellow-300"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3 md:h-4 md:w-4" />
            대기
          </div>
          <div className="text-xl md:text-2xl font-bold text-yellow-600">
            {stats.pending}
          </div>
        </div>
        <div
          onClick={() => setFilter("assigned")}
          className={`p-3 md:p-4 rounded-lg border cursor-pointer transition-all ${
            filter === "assigned"
              ? "bg-blue-50 border-blue-300"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
            <UserCheck className="h-3 w-3 md:h-4 md:w-4" />
            배정
          </div>
          <div className="text-xl md:text-2xl font-bold text-blue-600">
            {stats.assigned}
          </div>
        </div>
        <div
          onClick={() => setFilter("overdue")}
          className={`p-3 md:p-4 rounded-lg border cursor-pointer transition-all ${
            filter === "overdue"
              ? "bg-red-50 border-red-300"
              : stats.overdue > 0
              ? "bg-red-50 border-red-200 hover:border-red-300"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="text-xs md:text-sm text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
            지연
          </div>
          <div className="text-xl md:text-2xl font-bold text-red-600">
            {stats.overdue}
          </div>
        </div>
        <div
          onClick={() => setFilter("completed")}
          className={`p-3 md:p-4 rounded-lg border cursor-pointer transition-all ${
            filter === "completed"
              ? "bg-green-50 border-green-300"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
            완료
          </div>
          <div className="text-xl md:text-2xl font-bold text-green-600">
            {stats.completed}
          </div>
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
          <span>
            전체 {total}건 중 {(page - 1) * 10 + 1}-{Math.min(page * 10, total)}건 표시
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {tasks.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            출고 대기 항목이 없습니다
          </h3>
          <p className="text-sm text-gray-500">
            완료된 견적서가 있으면 자동으로 출고 대기 목록에 추가됩니다
          </p>
        </div>
      )}

      {/* 모바일: 카드 레이아웃 */}
      <div className="md:hidden space-y-4">
        {tasks.map((task) => {
          const items = (task.document?.content?.items || []) as InventoryItem[];
          const isHighlighted = highlightedTaskId === task.id;
          const isTaskOverdue = isOverdue(task);
          return (
            <div
              key={task.id}
              id={`task-${task.id}`}
              className={`bg-white rounded-lg border overflow-hidden transition-all duration-300 ${
                selectedIds.has(task.id) ? "ring-2 ring-blue-500" : ""
              } ${
                isHighlighted
                  ? "ring-2 ring-yellow-400 bg-yellow-50 animate-pulse"
                  : ""
              } ${
                isTaskOverdue
                  ? "border-red-300 bg-red-50"
                  : task.status === "pending" || task.status === "assigned"
                  ? "border-yellow-200"
                  : task.status === "completed"
                  ? "border-green-200"
                  : "border-gray-200"
              }`}
            >
              {/* 카드 헤더 */}
              <div
                className={`px-4 py-2 flex items-center justify-between ${
                  isTaskOverdue
                    ? "bg-red-100"
                    : task.status === "pending"
                    ? "bg-yellow-50"
                    : task.status === "assigned"
                    ? "bg-blue-50"
                    : task.status === "completed"
                    ? "bg-green-50"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSelect(task.id)}
                    className="p-1 -ml-1"
                  >
                    {selectedIds.has(task.id) ? (
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  {isTaskOverdue && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                      <AlertTriangle className="h-3 w-3" />
                      지연
                    </span>
                  )}
                  {getStatusDisplay(task)}
                  <button
                    onClick={() => handleOpenDocumentModal(task)}
                    className="text-xs text-blue-600 font-medium hover:underline"
                  >
                    {task.document_number}
                  </button>
                </div>
              </div>

              {/* 카드 본문 */}
              <div className="p-4 space-y-3">
                {/* 거래처 & 출고예정일 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    {task.company?.name}
                  </div>
                  <button
                    onClick={() =>
                      handleOpenDateModal(task.id, task.expected_date)
                    }
                    className="flex items-center gap-1 text-sm hover:text-blue-600"
                  >
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-blue-600">
                      {task.expected_date || "미정"}
                    </span>
                    <Edit3 className="h-3 w-3 text-gray-400" />
                  </button>
                </div>

                {/* 물품 목록 */}
                <div className="bg-gray-50 rounded-md p-3">
                  <div className="text-xs text-gray-500 mb-2">물품</div>
                  <div className="space-y-1">
                    {items.map((product, idx) => (
                      <div
                        key={idx}
                        className="text-sm flex items-center justify-between"
                      >
                        <span>
                          <span className="font-medium text-gray-900">
                            {product.name}
                          </span>
                          <span className="text-gray-500 ml-1">
                            {product.spec}
                          </span>
                        </span>
                        <span className="text-blue-600 font-medium">
                          {product.quantity}
                          {product.unit || "개"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 담당자 정보 */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">지정:</span>
                    {task.assigner?.name} {task.assigner?.level}
                  </div>
                  <button
                    onClick={() => handleOpenAssignModal(task.id)}
                    className="flex items-center gap-1 text-gray-900 font-medium hover:text-blue-600"
                  >
                    <UserCheck className="h-4 w-4 text-blue-500" />
                    {task.assignee
                      ? `${task.assignee.name} ${task.assignee.level}`
                      : "미배정"}
                    <Edit3 className="h-3 w-3 text-gray-400" />
                  </button>
                </div>

                {/* 버튼들 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenSpecSheet(task)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Printer className="h-4 w-4" />
                    명세서
                  </button>
                  {(task.status === "pending" || task.status === "assigned") && (
                    <button
                      onClick={() => handleConfirm(task.id)}
                      disabled={isUpdating}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-5 w-5" />
                      )}
                      출고 확인
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 데스크톱: 테이블 레이아웃 */}
      {tasks.length > 0 && (
        <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">
                    <button onClick={handleSelectAll} className="p-1">
                      {tasks.length > 0 &&
                      tasks.every((task) => selectedIds.has(task.id)) ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    문서번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    고객사
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    물품
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    출고예정일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    지정자
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    출고담당
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => {
                  const items = (task.document?.content?.items ||
                    []) as InventoryItem[];
                  const isHighlighted = highlightedTaskId === task.id;
                  const isTaskOverdue = isOverdue(task);
                  return (
                    <tr
                      key={task.id}
                      id={`task-${task.id}`}
                      className={`hover:bg-gray-50 transition-all duration-300 ${
                        selectedIds.has(task.id) ? "bg-blue-50" : ""
                      } ${
                        isHighlighted
                          ? "bg-yellow-100 ring-2 ring-yellow-400 ring-inset animate-pulse"
                          : isTaskOverdue
                          ? "bg-red-50"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleSelect(task.id)}
                          className="p-1"
                        >
                          {selectedIds.has(task.id) ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {isTaskOverdue && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 mr-1">
                              <AlertTriangle className="h-3 w-3" />
                              지연
                            </span>
                          )}
                          {getStatusDisplay(task)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDocumentModal(task)}
                          className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          {task.document_number}
                        </button>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {task.document?.date}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {task.company?.name}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {items.slice(0, 3).map((product, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium text-gray-900">
                                {product.name}
                              </span>
                              <span className="text-gray-500 ml-2">
                                {product.spec}
                              </span>
                              <span className="text-blue-600 ml-2 font-medium">
                                {product.quantity}
                                {product.unit || "개"}
                              </span>
                            </div>
                          ))}
                          {items.length > 3 && (
                            <div className="text-xs text-gray-400">
                              외 {items.length - 3}건
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() =>
                            handleOpenDateModal(task.id, task.expected_date)
                          }
                          className="flex items-center gap-1 text-sm hover:text-blue-600"
                        >
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-blue-600">
                            {task.expected_date || "미정"}
                          </span>
                          <Edit3 className="h-3 w-3 text-gray-400" />
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <User className="h-4 w-4 text-gray-400" />
                          {task.assigner
                            ? `${task.assigner.name} ${task.assigner.level}`
                            : "-"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenAssignModal(task.id)}
                          className="flex items-center gap-1 text-sm text-gray-900 font-medium hover:text-blue-600 transition-colors"
                        >
                          <UserCheck className="h-4 w-4 text-blue-500" />
                          {task.assignee
                            ? `${task.assignee.name} ${task.assignee.level}`
                            : "미배정"}
                          <Edit3 className="h-3 w-3 text-gray-400" />
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenSpecSheet(task)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            명세서
                          </button>
                          {(task.status === "pending" ||
                            task.status === "assigned") && (
                            <>
                              <button
                                onClick={() => handleConfirm(task.id)}
                                disabled={isUpdating}
                                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                )}
                                출고 확인
                              </button>
                              <button
                                onClick={() => handleCancelTask(task.id)}
                                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                취소
                              </button>
                            </>
                          )}
                          {task.status === "completed" && (
                            <span className="text-xs text-gray-400 px-2">
                              {task.completer?.name} 확인
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 담당자 변경 모달 */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-900">출고 담당자 변경</h3>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {users.map((user: { id: string; name: string; level?: string }) => (
                <button
                  key={user.id}
                  onClick={() => handleChangeAssignee(user.id)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">
                      {user.name} {user.level}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 예정일 수정 모달 */}
      {dateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-900">출고 예정일 수정</h3>
              <button
                onClick={() => setDateModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <input
                type="date"
                value={editingDate}
                onChange={(e) => setEditingDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setDateModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateExpectedDate}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdating ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상품명세서 모달 */}
      {specSheetOpen && specSheetPages.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center gap-4">
                <h3 className="font-semibold text-lg text-gray-900">
                  상품명세서
                </h3>
                {specSheetPages.length > 1 && (
                  <span className="text-sm text-gray-500">
                    ({specSheetPages.length}개 명세서)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddPage}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  명세서 추가
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  전체 인쇄 ({specSheetPages.length}장)
                </button>
                <button
                  onClick={() => setSpecSheetOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* 페이지 탭 */}
            {specSheetPages.length > 1 && (
              <div className="flex items-center gap-2 px-6 py-3 border-b bg-white overflow-x-auto">
                {specSheetPages.map((specPage, idx) => (
                  <div
                    key={specPage.id}
                    onClick={() => setCurrentPageIndex(idx)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      idx === currentPageIndex
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <span>명세서 {idx + 1}</span>
                    {specPage.documentNumber && (
                      <span className="text-xs opacity-70">
                        ({specPage.documentNumber})
                      </span>
                    )}
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicatePage(specPage.id);
                        }}
                        className="p-0.5 hover:bg-blue-200 rounded"
                        title="복사"
                      >
                        <Copy className="h-3 w-3 text-gray-400 hover:text-blue-600" />
                      </button>
                      {specSheetPages.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePage(specPage.id);
                          }}
                          className="p-0.5 hover:bg-red-100 rounded"
                          title="삭제"
                        >
                          <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 모달 본문 */}
            <div className="flex-1 overflow-auto p-6">
              {specSheetPages[currentPageIndex] && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 왼쪽: 편집 폼 */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <Edit3 className="h-4 w-4" />
                        편집
                        {specSheetPages.length > 1 && (
                          <span className="text-sm text-gray-500">
                            (명세서 {currentPageIndex + 1}/{specSheetPages.length})
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleDuplicatePage(specSheetPages[currentPageIndex].id)
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                          명세서 복사
                        </button>
                        <button
                          onClick={() =>
                            handleAddField(specSheetPages[currentPageIndex].id)
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          항목 추가
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {specSheetPages[currentPageIndex].fields.map(
                        (field, fieldIndex) => (
                          <div
                            key={field.id}
                            className="flex gap-2 items-start group"
                          >
                            <div className="flex flex-col gap-0.5 pt-1">
                              <button
                                onClick={() =>
                                  handleMoveField(
                                    specSheetPages[currentPageIndex].id,
                                    field.id,
                                    "up"
                                  )
                                }
                                disabled={fieldIndex === 0}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                title="위로 이동"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleMoveField(
                                    specSheetPages[currentPageIndex].id,
                                    field.id,
                                    "down"
                                  )
                                }
                                disabled={
                                  fieldIndex ===
                                  specSheetPages[currentPageIndex].fields.length - 1
                                }
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                title="아래로 이동"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="flex-1 space-y-1">
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) =>
                                  handleUpdateField(
                                    specSheetPages[currentPageIndex].id,
                                    field.id,
                                    "label",
                                    e.target.value
                                  )
                                }
                                placeholder="항목명"
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 font-medium"
                              />
                              <input
                                type="text"
                                value={field.value}
                                onChange={(e) =>
                                  handleUpdateField(
                                    specSheetPages[currentPageIndex].id,
                                    field.id,
                                    "value",
                                    e.target.value
                                  )
                                }
                                placeholder="내용 입력"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <button
                              onClick={() =>
                                handleRemoveField(
                                  specSheetPages[currentPageIndex].id,
                                  field.id
                                )
                              }
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-1"
                              title="삭제"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )
                      )}
                    </div>

                    {specSheetPages.length > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t lg:hidden">
                        <button
                          onClick={() =>
                            setCurrentPageIndex(Math.max(0, currentPageIndex - 1))
                          }
                          disabled={currentPageIndex === 0}
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          이전
                        </button>
                        <span className="text-sm text-gray-500">
                          {currentPageIndex + 1} / {specSheetPages.length}
                        </span>
                        <button
                          onClick={() =>
                            setCurrentPageIndex(
                              Math.min(
                                specSheetPages.length - 1,
                                currentPageIndex + 1
                              )
                            )
                          }
                          disabled={currentPageIndex === specSheetPages.length - 1}
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          다음
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 오른쪽: 미리보기 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
                      <FileText className="h-4 w-4" />
                      미리보기
                    </h4>
                    <div
                      ref={printRef}
                      className="bg-white border border-gray-300 p-6"
                    >
                      <div className="text-center text-xl font-bold mb-6">
                        상 품 명 세 서
                      </div>
                      <table className="w-full border-collapse">
                        <tbody>
                          {specSheetPages[currentPageIndex].fields.map(
                            (field) => (
                              <tr key={field.id}>
                                <th className="border border-gray-400 bg-gray-100 px-4 py-3 text-left w-28">
                                  {field.label}
                                </th>
                                <td className="border border-gray-400 px-4 py-3">
                                  {field.value}
                                </td>
                              </tr>
                            )
                          )}
                          <tr>
                            <th className="border border-gray-400 bg-gray-100 px-4 py-3 text-left">
                              수령업체
                            </th>
                            <td className="border border-gray-400 px-4 py-3">
                              {specSheetPages[currentPageIndex].companyName}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 문서 상세 모달 */}
      <DocumentDetailModal
        task={selectedDocumentTask}
        isOpen={documentModalOpen}
        onClose={() => {
          setDocumentModalOpen(false);
          setSelectedDocumentTask(null);
        }}
      />
    </div>
  );
}
