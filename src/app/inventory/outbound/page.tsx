"use client";

import { useState, useRef } from "react";
import { Package, CheckCircle, Clock, Building2, FileText, User, Calendar, UserCheck, Printer, X, Edit3, Plus, Trash2, Square, CheckSquare, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, GripVertical, Copy } from "lucide-react";
import dayjs from "dayjs";

// 더미 데이터
const dummyOutboundItems = [
  {
    id: "1",
    document_number: "EST-2025-0042",
    date: "2025-01-17",
    company_name: "삼성전자",
    items: [
      { name: "알루미늄 판", spec: "10x20x30mm", quantity: 100 },
      { name: "스테인리스 파이프", spec: "50A", quantity: 50 },
    ],
    status: "pending",
    requested_date: "2025-01-20",
    assigned_by: "김영업 대리",
    assigned_to: "박출고 주임",
    confirmed_at: null as string | null,
  },
  {
    id: "2",
    document_number: "EST-2025-0041",
    date: "2025-01-16",
    company_name: "LG화학",
    items: [
      { name: "동파이프", spec: "25A", quantity: 200 },
    ],
    status: "pending",
    requested_date: "2025-01-18",
    assigned_by: "이상담 과장",
    assigned_to: "박출고 주임",
    confirmed_at: null as string | null,
  },
  {
    id: "3",
    document_number: "EST-2025-0040",
    date: "2025-01-15",
    company_name: "현대중공업",
    items: [
      { name: "알루미늄 판", spec: "10x20x30mm", quantity: 50 },
      { name: "철판", spec: "5T", quantity: 30 },
      { name: "앵글", spec: "50x50x5", quantity: 100 },
    ],
    status: "confirmed",
    requested_date: "2025-01-16",
    assigned_by: "김영업 대리",
    assigned_to: "최물류 대리",
    confirmed_at: "2025-01-16 09:30",
  },
  {
    id: "4",
    document_number: "EST-2025-0039",
    date: "2025-01-14",
    company_name: "포스코",
    items: [
      { name: "스테인리스 판", spec: "3T", quantity: 80 },
    ],
    status: "confirmed",
    requested_date: "2025-01-15",
    assigned_by: "이상담 과장",
    assigned_to: "박출고 주임",
    confirmed_at: "2025-01-15 14:20",
  },
];

// 담당자 목록 (더미)
const staffList = [
  "박출고 주임",
  "최물류 대리",
  "김창고 사원",
  "이배송 과장",
];

interface SpecSheetField {
  id: string;
  label: string;
  value: string;
}

// 기본 필드 템플릿
const getDefaultFields = (item: typeof dummyOutboundItems[0]): SpecSheetField[] => {
  const productNames = item.items.map((p) => p.name).join(", ");
  const specs = item.items.map((p) => p.spec).join(", ");
  const quantities = item.items.map((p) => `${p.quantity}개`).join(", ");

  return [
    { id: "1", label: "수신", value: item.company_name },
    { id: "2", label: "발주번호", value: item.document_number },
    { id: "3", label: "품명", value: productNames },
    { id: "4", label: "규격", value: specs },
    { id: "5", label: "수량", value: quantities },
    { id: "6", label: "발송일자", value: item.requested_date },
    { id: "7", label: "박스 No.", value: "" },
  ];
};

// 다중 명세서 타입
interface SpecSheetPage {
  id: string;
  itemId: string;
  documentNumber: string;
  companyName: string;
  fields: SpecSheetField[];
}

export default function OutboundPage() {
  const [items, setItems] = useState(dummyOutboundItems);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed">("all");

  // 체크박스 선택
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 담당자 변경 모달
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // 상품명세서 모달 (다중 페이지 지원)
  const [specSheetOpen, setSpecSheetOpen] = useState(false);
  const [specSheetPages, setSpecSheetPages] = useState<SpecSheetPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);

  const handleConfirm = (id: string) => {
    const now = dayjs().format("YYYY-MM-DD HH:mm");
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: "confirmed", confirmed_at: now }
          : item
      )
    );
  };

  const handleOpenAssignModal = (id: string) => {
    setSelectedItemId(id);
    setAssignModalOpen(true);
  };

  const handleChangeAssignee = (newAssignee: string) => {
    if (selectedItemId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedItemId
            ? { ...item, assigned_to: newAssignee }
            : item
        )
      );
    }
    setAssignModalOpen(false);
    setSelectedItemId(null);
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
    const filteredIds = filteredItems.map((item) => item.id);
    const allSelected = filteredIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIds));
    }
  };

  // 단일 아이템 명세서 열기
  const handleOpenSpecSheet = (item: typeof dummyOutboundItems[0]) => {
    const page: SpecSheetPage = {
      id: Date.now().toString(),
      itemId: item.id,
      documentNumber: item.document_number,
      companyName: item.company_name,
      fields: getDefaultFields(item),
    };
    setSpecSheetPages([page]);
    setCurrentPageIndex(0);
    setSpecSheetOpen(true);
  };

  // 선택된 아이템들 일괄 명세서 열기
  const handleOpenBulkSpecSheet = () => {
    if (selectedIds.size === 0) return;

    const pages: SpecSheetPage[] = items
      .filter((item) => selectedIds.has(item.id))
      .map((item) => ({
        id: Date.now().toString() + item.id,
        itemId: item.id,
        documentNumber: item.document_number,
        companyName: item.company_name,
        fields: getDefaultFields(item),
      }));

    setSpecSheetPages(pages);
    setCurrentPageIndex(0);
    setSpecSheetOpen(true);
  };

  const handleUpdateField = (pageId: string, fieldId: string, key: "label" | "value", newValue: string) => {
    setSpecSheetPages((prev) =>
      prev.map((page) =>
        page.id === pageId
          ? {
              ...page,
              fields: page.fields.map((field) =>
                field.id === fieldId ? { ...field, [key]: newValue } : field
              ),
            }
          : page
      )
    );
  };

  const handleAddField = (pageId: string) => {
    const newId = Date.now().toString();
    setSpecSheetPages((prev) =>
      prev.map((page) =>
        page.id === pageId
          ? { ...page, fields: [...page.fields, { id: newId, label: "항목", value: "" }] }
          : page
      )
    );
  };

  const handleRemoveField = (pageId: string, fieldId: string) => {
    setSpecSheetPages((prev) =>
      prev.map((page) =>
        page.id === pageId
          ? { ...page, fields: page.fields.filter((field) => field.id !== fieldId) }
          : page
      )
    );
  };

  const handleMoveField = (pageId: string, fieldId: string, direction: "up" | "down") => {
    setSpecSheetPages((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;

        const fields = [...page.fields];
        const currentIndex = fields.findIndex((f) => f.id === fieldId);
        if (currentIndex === -1) return page;

        const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= fields.length) return page;

        // Swap
        [fields[currentIndex], fields[newIndex]] = [fields[newIndex], fields[currentIndex]];

        return { ...page, fields };
      })
    );
  };

  // 명세서 페이지 추가 (빈 페이지)
  const handleAddPage = () => {
    const newPage: SpecSheetPage = {
      id: Date.now().toString(),
      itemId: "",
      documentNumber: "",
      companyName: "",
      fields: [
        { id: "1", label: "수신", value: "" },
        { id: "2", label: "발주번호", value: "" },
        { id: "3", label: "품명", value: "" },
        { id: "4", label: "규격", value: "" },
        { id: "5", label: "수량", value: "" },
        { id: "6", label: "발송일자", value: "" },
        { id: "7", label: "박스 No.", value: "" },
      ],
    };
    setSpecSheetPages((prev) => [...prev, newPage]);
    setCurrentPageIndex(specSheetPages.length);
  };

  // 명세서 페이지 삭제
  const handleRemovePage = (pageId: string) => {
    setSpecSheetPages((prev) => {
      const newPages = prev.filter((p) => p.id !== pageId);
      if (currentPageIndex >= newPages.length) {
        setCurrentPageIndex(Math.max(0, newPages.length - 1));
      }
      return newPages;
    });
  };

  // 명세서 페이지 복사
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
        id: Date.now().toString() + field.id, // 새 ID 부여
      })),
    };

    const pageIndex = specSheetPages.findIndex((p) => p.id === pageId);
    setSpecSheetPages((prev) => {
      const newPages = [...prev];
      newPages.splice(pageIndex + 1, 0, newPage); // 원본 바로 뒤에 삽입
      return newPages;
    });
    setCurrentPageIndex(pageIndex + 1); // 복사된 페이지로 이동
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // 2개씩 묶어서 A4 한 장에 출력
    const generateSpecSheetHtml = (page: SpecSheetPage) => `
      <div class="spec-sheet">
        <div class="header">상 품 명 세 서</div>
        <table>
          <tbody>
            ${page.fields.map((field) => `
              <tr>
                <th>${field.label}</th>
                <td>${field.value}</td>
              </tr>
            `).join("")}
            <tr>
              <th>납품업체</th>
              <td>
                <div class="company-info">
                  <div class="logo">
                    <div style="font-size: 14px;">wooyang 우양신소재</div>
                    <div style="font-size: 10px; color: #666;">Advanced material Co.</div>
                  </div>
                  <div style="font-size: 11px; color: #444;">
                    경북 구미시 산동읍 첨단기업3로 81
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    // 2개씩 페이지로 묶기
    const pages: string[] = [];
    for (let i = 0; i < specSheetPages.length; i += 2) {
      const sheet1 = specSheetPages[i];
      const sheet2 = specSheetPages[i + 1];

      pages.push(`
        <div class="a4-page ${i > 0 ? 'page-break' : ''}">
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
              min-height: 297mm;
              padding: 10mm;
              display: flex;
              flex-direction: column;
              gap: 10mm;
            }
            .page-break { page-break-before: always; }
            .spec-sheet {
              flex: 1;
              border: 1px solid #ccc;
              padding: 8mm;
              display: flex;
              flex-direction: column;
            }
            .spec-sheet.empty { border: none; }
            .header { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f5f5f5; width: 90px; }
            .company-info { display: flex; align-items: center; gap: 15px; }
            .logo { font-weight: bold; color: #1e40af; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .page-break { page-break-before: always; }
              .a4-page {
                width: 100%;
                min-height: auto;
                height: 100vh;
                padding: 5mm;
              }
            }
          </style>
        </head>
        <body>
          ${pages.join("")}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const confirmedCount = items.filter((i) => i.status === "confirmed").length;

  return (
    <div className="p-4 md:p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-6 w-6 md:h-7 md:w-7 text-blue-600" />
          출고 관리
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          완료된 견적서 기준으로 출고 확인을 진행합니다
        </p>
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
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
        <div
          onClick={() => setFilter("all")}
          className={`p-3 md:p-4 rounded-lg border cursor-pointer transition-all ${
            filter === "all"
              ? "bg-blue-50 border-blue-300"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="text-xs md:text-sm text-gray-500">전체</div>
          <div className="text-xl md:text-2xl font-bold text-gray-900">{items.length}</div>
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
          <div className="text-xl md:text-2xl font-bold text-yellow-600">{pendingCount}</div>
        </div>
        <div
          onClick={() => setFilter("confirmed")}
          className={`p-3 md:p-4 rounded-lg border cursor-pointer transition-all ${
            filter === "confirmed"
              ? "bg-green-50 border-green-300"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
            완료
          </div>
          <div className="text-xl md:text-2xl font-bold text-green-600">{confirmedCount}</div>
        </div>
      </div>

      {/* 모바일: 카드 레이아웃 */}
      <div className="md:hidden space-y-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-lg border overflow-hidden ${
              selectedIds.has(item.id) ? "ring-2 ring-blue-500" : ""
            } ${item.status === "pending" ? "border-yellow-200" : "border-green-200"}`}
          >
            {/* 카드 헤더 */}
            <div className={`px-4 py-2 flex items-center justify-between ${
              item.status === "pending" ? "bg-yellow-50" : "bg-green-50"
            }`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleSelect(item.id)}
                  className="p-1 -ml-1"
                >
                  {selectedIds.has(item.id) ? (
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {item.status === "pending" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    <Clock className="h-3 w-3" />
                    대기
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3" />
                    출고됨
                  </span>
                )}
                <span className="text-xs text-blue-600 font-medium">
                  {item.document_number}
                </span>
              </div>
              {item.confirmed_at && (
                <span className="text-[10px] text-gray-500">
                  {item.confirmed_at}
                </span>
              )}
            </div>

            {/* 카드 본문 */}
            <div className="p-4 space-y-3">
              {/* 거래처 & 출고요청일 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  {item.company_name}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span className="font-medium text-orange-600">{item.requested_date}</span>
                </div>
              </div>

              {/* 물품 목록 */}
              <div className="bg-gray-50 rounded-md p-3">
                <div className="text-xs text-gray-500 mb-2">물품</div>
                <div className="space-y-1">
                  {item.items.map((product, idx) => (
                    <div key={idx} className="text-sm flex items-center justify-between">
                      <span>
                        <span className="font-medium text-gray-900">{product.name}</span>
                        <span className="text-gray-500 ml-1">{product.spec}</span>
                      </span>
                      <span className="text-blue-600 font-medium">{product.quantity}개</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 담당자 정보 */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">지정:</span>
                  {item.assigned_by}
                </div>
                <button
                  onClick={() => handleOpenAssignModal(item.id)}
                  className="flex items-center gap-1 text-gray-900 font-medium hover:text-blue-600"
                >
                  <UserCheck className="h-4 w-4 text-blue-500" />
                  {item.assigned_to}
                  <Edit3 className="h-3 w-3 text-gray-400" />
                </button>
              </div>

              {/* 버튼들 */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenSpecSheet(item)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  명세서
                </button>
                {item.status === "pending" && (
                  <button
                    onClick={() => handleConfirm(item.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-5 w-5" />
                    출고 확인
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 데스크톱: 테이블 레이아웃 */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">
                  <button onClick={handleSelectAll} className="p-1">
                    {filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id)) ? (
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
                  거래처
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  물품
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  출고요청일
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
              {filteredItems.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${selectedIds.has(item.id) ? "bg-blue-50" : ""}`}>
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    <button onClick={() => handleToggleSelect(item.id)} className="p-1">
                      {selectedIds.has(item.id) ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {item.status === "pending" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3" />
                        대기
                      </span>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3" />
                          출고됨
                        </span>
                        {item.confirmed_at && (
                          <div className="text-[10px] text-gray-400 mt-1">
                            {item.confirmed_at}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-blue-600 font-medium">
                      <FileText className="h-4 w-4" />
                      {item.document_number}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {item.date}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      {item.company_name}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {item.items.map((product, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium text-gray-900">
                            {product.name}
                          </span>
                          <span className="text-gray-500 ml-2">
                            {product.spec}
                          </span>
                          <span className="text-blue-600 ml-2 font-medium">
                            {product.quantity}개
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span className="font-medium text-orange-600">
                        {item.requested_date}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <User className="h-4 w-4 text-gray-400" />
                      {item.assigned_by}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleOpenAssignModal(item.id)}
                      className="flex items-center gap-1 text-sm text-gray-900 font-medium hover:text-blue-600 transition-colors"
                    >
                      <UserCheck className="h-4 w-4 text-blue-500" />
                      {item.assigned_to}
                      <Edit3 className="h-3 w-3 text-gray-400" />
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenSpecSheet(item)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        명세서
                      </button>
                      {item.status === "pending" ? (
                        <button
                          onClick={() => handleConfirm(item.id)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          출고 확인
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 px-2">확인됨</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
            <div className="p-4 space-y-2">
              {staffList.map((staff) => (
                <button
                  key={staff}
                  onClick={() => handleChangeAssignee(staff)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{staff}</span>
                  </div>
                </button>
              ))}
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
                <h3 className="font-semibold text-lg text-gray-900">상품명세서</h3>
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
                {specSheetPages.map((page, idx) => (
                  <div
                    key={page.id}
                    onClick={() => setCurrentPageIndex(idx)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      idx === currentPageIndex
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <span>명세서 {idx + 1}</span>
                    {page.documentNumber && (
                      <span className="text-xs opacity-70">({page.documentNumber})</span>
                    )}
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicatePage(page.id);
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
                            handleRemovePage(page.id);
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
                          onClick={() => handleDuplicatePage(specSheetPages[currentPageIndex].id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                          명세서 복사
                        </button>
                        <button
                          onClick={() => handleAddField(specSheetPages[currentPageIndex].id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          항목 추가
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {specSheetPages[currentPageIndex].fields.map((field, fieldIndex) => (
                        <div key={field.id} className="flex gap-2 items-start group">
                          {/* 순서 이동 버튼 */}
                          <div className="flex flex-col gap-0.5 pt-1">
                            <button
                              onClick={() => handleMoveField(specSheetPages[currentPageIndex].id, field.id, "up")}
                              disabled={fieldIndex === 0}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              title="위로 이동"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveField(specSheetPages[currentPageIndex].id, field.id, "down")}
                              disabled={fieldIndex === specSheetPages[currentPageIndex].fields.length - 1}
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
                              onChange={(e) => handleUpdateField(specSheetPages[currentPageIndex].id, field.id, "label", e.target.value)}
                              placeholder="항목명"
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 font-medium"
                            />
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => handleUpdateField(specSheetPages[currentPageIndex].id, field.id, "value", e.target.value)}
                              placeholder="내용 입력"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveField(specSheetPages[currentPageIndex].id, field.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-1"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* 페이지 네비게이션 (모바일) */}
                    {specSheetPages.length > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t lg:hidden">
                        <button
                          onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
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
                          onClick={() => setCurrentPageIndex(Math.min(specSheetPages.length - 1, currentPageIndex + 1))}
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
                    <div ref={printRef} className="bg-white border border-gray-300 p-6">
                      <div className="text-center text-xl font-bold mb-6">상 품 명 세 서</div>
                      <table className="w-full border-collapse">
                        <tbody>
                          {specSheetPages[currentPageIndex].fields.map((field) => (
                            <tr key={field.id}>
                              <th className="border border-gray-400 bg-gray-100 px-4 py-3 text-left w-28">
                                {field.label}
                              </th>
                              <td className="border border-gray-400 px-4 py-3">{field.value}</td>
                            </tr>
                          ))}
                          <tr>
                            <th className="border border-gray-400 bg-gray-100 px-4 py-3 text-left">납품업체</th>
                            <td className="border border-gray-400 px-4 py-3">
                              <div className="flex items-center gap-4">
                                <div className="font-bold text-blue-800">
                                  <div className="text-lg">wooyang 우양신소재</div>
                                  <div className="text-xs text-gray-500">Advanced material Co.</div>
                                </div>
                                <div className="text-sm text-gray-600">
                                  경북 구미시 산동읍 첨단기업3로 81
                                </div>
                              </div>
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
    </div>
  );
}
