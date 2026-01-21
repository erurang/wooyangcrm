"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useContactDetails } from "@/hooks/manage/contacts/detail/useContactDetails";

import {
  ContactHeader,
  ContactDateFilter,
  ContactTabNavigation,
  OverviewTab,
  ConsultationsTab,
  DocumentsTab,
  AnalyticsTab,
} from "@/components/manage/contacts/detail";
import type { ContactTabType } from "@/components/manage/contacts/detail";

// 담당자 상세 관련 타입
interface ContactDocumentItem {
  name: string;
  spec?: string;
  amount: number;
  quantity?: string | number;
}

interface ContactDocument {
  document_id: string;
  type: string;
  status: string;
  items?: ContactDocumentItem[];
}

interface ContactConsultation {
  consultation_id: string;
  date: string;
  content: string;
  documents: ContactDocument[];
}

interface ProductSummary {
  name: string;
  spec?: string;
  amount: number;
  count: number;
}

export default function ContactDetailClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const contactId = Array.isArray(params.id) ? params.id[0] : params.id || "";

  // Get URL parameters or use defaults
  const initialDateFilter =
    (searchParams.get("dateFilter") as "year" | "quarter" | "month") || "month";
  const initialYear = Number.parseInt(
    searchParams.get("year") || new Date().getFullYear().toString(),
    10
  );
  const initialQuarter = Number.parseInt(
    searchParams.get("quarter") || "1",
    10
  );
  const initialMonth = Number.parseInt(
    searchParams.get("month") || (new Date().getMonth() + 1).toString(),
    10
  );
  const initialTab =
    (searchParams.get("tab") as ContactTabType) || "overview";

  // State for filters and tabs
  const [dateFilter, setDateFilter] = useState<"year" | "quarter" | "month">(
    initialDateFilter
  );
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(initialQuarter);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [activeTab, setActiveTab] = useState<ContactTabType>(initialTab);
  const [documentFilter, setDocumentFilter] = useState<
    "all" | "estimate" | "order"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "completed" | "canceled"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Calculate date range based on filters
  const { startDate, endDate } = useMemo(() => {
    let start: string;
    let end: string;

    if (dateFilter === "year") {
      start = `${selectedYear}-01-01`;
      end = `${selectedYear}-12-31`;
    } else if (dateFilter === "quarter") {
      const startMonth = (selectedQuarter - 1) * 3 + 1;
      start = `${selectedYear}-${String(startMonth).padStart(2, "0")}-01`;
      const endMonth = startMonth + 2;
      const lastDay = new Date(selectedYear, endMonth, 0).getDate();
      end = `${selectedYear}-${String(endMonth).padStart(2, "0")}-${String(
        lastDay
      ).padStart(2, "0")}`;
    } else {
      start = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      end = `${selectedYear}-${String(selectedMonth).padStart(
        2,
        "0"
      )}-${String(lastDay).padStart(2, "0")}`;
    }

    return { startDate: start, endDate: end };
  }, [dateFilter, selectedYear, selectedQuarter, selectedMonth]);

  // Fetch contact data
  const { contactData, isLoading, error } = useContactDetails(
    contactId,
    startDate,
    endDate
  );

  // Process data for display (must be before early returns due to hooks rules)
  const consultations = (contactData?.consultations ?? []) as ContactConsultation[];
  const documents = useMemo(
    () => consultations.flatMap((c) => c.documents ?? []),
    [consultations]
  );

  // Calculate sales and purchase amounts by status
  const amountsByStatus = useMemo(() => {
    const calculateAmount = (status: string, type: string) =>
      documents
        .filter((doc) => doc.status === status && doc.type === type)
        .reduce(
          (sum, doc) =>
            sum +
            (doc.items ?? []).reduce(
              (subSum, item) => subSum + (item.amount ?? 0),
              0
            ),
          0
        );

    const confirmedSales = calculateAmount("completed", "estimate");
    const confirmedPurchases = calculateAmount("completed", "order");
    const pendingSales = calculateAmount("pending", "estimate");
    const pendingPurchases = calculateAmount("pending", "order");
    const canceledSales = calculateAmount("canceled", "estimate");
    const canceledPurchases = calculateAmount("canceled", "order");

    return {
      confirmedSales,
      confirmedPurchases,
      pendingSales,
      pendingPurchases,
      canceledSales,
      canceledPurchases,
      totalSales: confirmedSales + pendingSales + canceledSales,
      totalPurchases: confirmedPurchases + pendingPurchases + canceledPurchases,
    };
  }, [documents]);

  const {
    confirmedSales,
    confirmedPurchases,
    pendingSales,
    pendingPurchases,
    canceledSales,
    canceledPurchases,
    totalSales,
    totalPurchases,
  } = amountsByStatus;

  // Get top products by sales amount
  const topProducts = useMemo(() => {
    const allProducts = documents
      .filter((doc) => doc.type === "estimate")
      .flatMap((doc) => doc.items ?? [])
      .reduce<Record<string, ProductSummary>>((acc, item) => {
        const key = `${item.name}-${item.spec ?? ""}`;
        if (!acc[key]) {
          acc[key] = { name: item.name, spec: item.spec, amount: 0, count: 0 };
        }
        acc[key].amount += item.amount ?? 0;
        acc[key].count += 1;
        return acc;
      }, {});

    return Object.values(allProducts)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [documents]);

  // Get consultation trend data
  const { trendMonths, trendData } = useMemo(() => {
    const consultationsByMonth: Record<string, number> = {};

    consultations.forEach((consultation) => {
      const date = new Date(consultation.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!consultationsByMonth[monthKey]) {
        consultationsByMonth[monthKey] = 0;
      }
      consultationsByMonth[monthKey] += 1;
    });

    const months = Object.keys(consultationsByMonth).sort();
    const data = months.map((month) => consultationsByMonth[month]);

    return { trendMonths: months, trendData: data };
  }, [consultations]);

  // Early returns after all hooks
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            오류가 발생했습니다
          </h3>
          <p className="text-red-600">
            {error instanceof Error ? error.message : String(error)}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  if (!contactData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-yellow-700 mb-2">
            데이터를 찾을 수 없습니다
          </h3>
          <p className="text-yellow-600">
            요청하신 담당자 정보를 찾을 수 없습니다.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen p-6">
      <ContactHeader contactData={contactData} />

      <ContactDateFilter
        dateFilter={dateFilter}
        selectedYear={selectedYear}
        selectedQuarter={selectedQuarter}
        selectedMonth={selectedMonth}
        startDate={startDate}
        endDate={endDate}
        onDateFilterChange={setDateFilter}
        onYearChange={setSelectedYear}
        onQuarterChange={setSelectedQuarter}
        onMonthChange={setSelectedMonth}
      />

      <ContactTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "overview" && (
        <OverviewTab
          totalSales={totalSales}
          totalPurchases={totalPurchases}
          confirmedSales={confirmedSales}
          confirmedPurchases={confirmedPurchases}
          pendingSales={pendingSales}
          pendingPurchases={pendingPurchases}
          canceledSales={canceledSales}
          canceledPurchases={canceledPurchases}
          consultationsCount={consultations.length}
          documentsCount={documents.length}
          estimatesCount={
            documents.filter((doc) => doc.type === "estimate").length
          }
          ordersCount={
            documents.filter((doc) => doc.type === "order").length
          }
          dateFilter={dateFilter}
          consultations={consultations}
          onViewAllConsultations={() => setActiveTab("consultations")}
        />
      )}

      {activeTab === "consultations" && (
        <ConsultationsTab
          consultations={consultations}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      )}

      {activeTab === "documents" && (
        <DocumentsTab
          documents={documents}
          documentFilter={documentFilter}
          statusFilter={statusFilter}
          onDocumentFilterChange={setDocumentFilter}
          onStatusFilterChange={setStatusFilter}
        />
      )}

      {activeTab === "analytics" && (
        <AnalyticsTab
          topProducts={topProducts}
          trendMonths={trendMonths}
          trendData={trendData}
          confirmedSales={confirmedSales}
          confirmedPurchases={confirmedPurchases}
          pendingSales={pendingSales}
          pendingPurchases={pendingPurchases}
          canceledSales={canceledSales}
          canceledPurchases={canceledPurchases}
          totalSales={totalSales}
          totalPurchases={totalPurchases}
        />
      )}
    </div>
  );
}
