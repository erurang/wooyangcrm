"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";

import { useUserDetail } from "@/hooks/useUserDetail";
import { useUserSalesSummary } from "@/hooks/reports/useUserSalesSummary";
import { useUserTransactions } from "@/hooks/reports/userDetail/useUserTransactions";
import { useUserDocumentsCount } from "@/hooks/reports/useUserDocumentsCount";
import { useUserDocumentList } from "@/hooks/reports/userDetail/documents/useUserDocumentList";
import { useLoginLogs } from "@/hooks/dashboard/useLoginLogs";
import { useClientSummary } from "@/hooks/dashboard/useClientSummary";
import { useDateRange } from "@/hooks/dashboard/useDateRange";

import {
  UserDashboardTab,
  UserConsultationTab,
  UserItemsTab,
  UserSalesTab,
  UserPurchaseTab,
  UserTrendsTab,
  UserPerformanceTab,
  UserClientsTab,
  UserTodoTab,
} from "@/components/reports/users/tabs";

import {
  UserProfileCard,
  UserTabNavigation,
  TabType,
} from "@/components/reports/users/detail";
import DateFilterCard from "@/components/dashboard/DateFilterCard";

interface Item {
  name: string;
  spec?: string;
  quantity?: string;
  total: number;
  type?: "sales" | "purchase";
}

interface Company {
  name: string;
  total: number;
}

interface ChartData {
  labels: string[];
  data: number[];
}

interface ClientAnalysis {
  name: string;
  consultations: number;
  estimates: number;
  orders: number;
  totalSales: number;
  totalPurchases: number;
}

// documentsDetails 관련 타입
interface DocumentItem {
  amount: number;
  name?: string;
  spec?: string;
  quantity?: string | number;
}

interface UserDocument {
  document_id: string;
  type: string;
  status: string;
  valid_until?: string;
  items?: DocumentItem[];
}

interface UserConsultation {
  company_name: string;
  company_id: string;
  date: string;
  documents: UserDocument[];
}

interface UserDocumentDetail {
  user_id: string;
  consultations: UserConsultation[];
}

interface AggregateItem {
  name: string;
  total: number;
  [key: string]: string | number | undefined;
}

export default function UserDetailPage() {
  const { id } = useParams();
  const userId = Array.isArray(id) ? id[0] : id || "";

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItemCategory, setSelectedItemCategory] = useState<
    "all" | "sales" | "purchase"
  >("all");

  const {
    dateFilter,
    setDateFilter,
    selectedYear,
    setSelectedYear,
    selectedQuarter,
    setSelectedQuarter,
    selectedMonth,
    setSelectedMonth,
    dateRange,
  } = useDateRange();

  const { startDate, endDate } = dateRange;

  // SWR 데이터 가져오기
  const { user } = useUserDetail(userId);
  const { salesSummary } = useUserSalesSummary([userId], startDate, endDate);
  const { salesCompanies, purchaseCompanies, salesProducts, purchaseProducts } =
    useUserTransactions(userId, startDate, endDate);
  const { documents } = useUserDocumentsCount([userId], startDate, endDate);
  const { documentsDetails } = useUserDocumentList(userId, startDate, endDate);
  const { loginLogs } = useLoginLogs(userId);
  const { followUpClients } = useClientSummary(userId);

  // 만료 예정 견적서 계산
  const today = new Date();
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);

  const expiringDocuments = useMemo(() => {
    return ((documentsDetails as UserDocumentDetail[] | null) ?? [])
      .flatMap((user) => user.consultations ?? [])
      .flatMap((consultation) =>
        (consultation.documents ?? [])
          .filter((doc) => {
            if (doc.type !== "estimate" || !doc.valid_until) return false;
            const validUntil = new Date(doc.valid_until);
            return validUntil >= today && validUntil <= sevenDaysLater;
          })
          .map((doc) => ({
            id: doc.document_id,
            content: { items: doc.items },
            company_name: consultation.company_name,
            valid_until: doc.valid_until || null,
            total_amount: (doc.items ?? []).reduce(
              (sum, item) => sum + (item.amount || 0),
              0
            ),
          }))
      );
  }, [documentsDetails]);

  const userDocuments = documents?.[userId] || {
    estimates: { pending: 0, completed: 0, canceled: 0, total: 0 },
    orders: { pending: 0, completed: 0, canceled: 0, total: 0 },
  };
  const estimates = userDocuments.estimates;

  // 중복 제거 및 총합 계산
  const aggregateData = <T extends AggregateItem>(data: T[], key: keyof T): T[] => {
    return Object.values(
      data.reduce<Record<string, T>>((acc, item) => {
        const keyValue = String(item[key] ?? "");
        const identifier = `${item.name}-${keyValue}`;
        if (!acc[identifier]) {
          acc[identifier] = { ...item };
        } else {
          acc[identifier].total += item.total;
        }
        return acc;
      }, {})
    );
  };

  const aggregatedSalesCompanies = aggregateData(salesCompanies || [], "name") as Company[];
  const aggregatedPurchaseCompanies = aggregateData(purchaseCompanies || [], "name") as Company[];
  const aggregatedSalesProducts = aggregateData(salesProducts || [], "spec") as Item[];
  const aggregatedPurchaseProducts = aggregateData(purchaseProducts || [], "spec") as Item[];

  // 검색 필터링된 아이템 목록
  const filteredItems = useMemo(() => {
    const allItems = [
      ...aggregatedSalesProducts.map((item) => ({
        ...item,
        quantity: item.quantity ?? "",
        type: "sales" as const,
      })),
      ...aggregatedPurchaseProducts.map((item) => ({
        ...item,
        quantity: item.quantity ?? "",
        type: "purchase" as const,
      })),
    ];
    return allItems.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.spec && item.spec.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory =
        selectedItemCategory === "all" || item.type === selectedItemCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedItemCategory, aggregatedSalesProducts, aggregatedPurchaseProducts]);

  // 차트 데이터
  const getChartData = (companies: Company[]): ChartData => {
    const sorted = [...companies].sort((a, b) => b.total - a.total);
    const top5 = sorted.slice(0, 5);
    const otherTotal = sorted.slice(5).reduce((sum, c) => sum + c.total, 0);
    return {
      labels: [...top5.map((c) => c.name), otherTotal > 0 ? "기타" : ""].filter(Boolean),
      data: [...top5.map((c) => c.total), otherTotal > 0 ? otherTotal : 0].filter((v) => v > 0),
    };
  };

  const salesChart = getChartData(aggregatedSalesCompanies);
  const purchaseChart = getChartData(aggregatedPurchaseCompanies);

  const itemsChartData = useMemo(() => {
    const salesData = aggregatedSalesProducts
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((item) => ({ name: item.name, value: item.total, type: "sales" as const }));
    const purchaseData = aggregatedPurchaseProducts
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((item) => ({ name: item.name, value: item.total, type: "purchase" as const }));
    return { salesData, purchaseData };
  }, [aggregatedSalesProducts, aggregatedPurchaseProducts]);

  // 월별 트렌드 데이터
  const monthlyTrendData = useMemo(() => {
    const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    const monthlySales = Array(12).fill(0);
    const monthlyPurchases = Array(12).fill(0);

    const details = documentsDetails as UserDocumentDetail[] | null;
    if (details && details.length > 0) {
      details.forEach((userObj) => {
        (userObj.consultations || []).forEach((consultation) => {
          if (!consultation.date) return;
          const month = new Date(consultation.date).getMonth();
          (consultation.documents || []).forEach((doc) => {
            if (doc.status === "completed") {
              const total = (doc.items || []).reduce(
                (sum, item) => sum + (item.amount || 0),
                0
              );
              if (doc.type === "estimate") monthlySales[month] += total;
              else if (doc.type === "order") monthlyPurchases[month] += total;
            }
          });
        });
      });
    }

    let filteredMonths: string[], filteredSales: number[], filteredPurchases: number[];
    if (dateFilter === "month") {
      filteredMonths = [months[selectedMonth - 1]];
      filteredSales = [monthlySales[selectedMonth - 1]];
      filteredPurchases = [monthlyPurchases[selectedMonth - 1]];
    } else if (dateFilter === "quarter") {
      const startMonth = (selectedQuarter - 1) * 3;
      filteredMonths = months.slice(startMonth, startMonth + 3);
      filteredSales = monthlySales.slice(startMonth, startMonth + 3);
      filteredPurchases = monthlyPurchases.slice(startMonth, startMonth + 3);
    } else {
      filteredMonths = months;
      filteredSales = monthlySales;
      filteredPurchases = monthlyPurchases;
    }
    return { months: filteredMonths, salesData: filteredSales, purchaseData: filteredPurchases };
  }, [documentsDetails, dateFilter, selectedMonth, selectedQuarter]);

  // 완료된 매출 금액
  const completedSales: number = ((documentsDetails as UserDocumentDetail[] | null) ?? [])
    .flatMap((user) => user.consultations ?? [])
    .flatMap((consultation) => consultation.documents ?? [])
    .filter((doc) => doc.status === "completed" && doc.type === "estimate")
    .reduce(
      (sum, doc) =>
        sum + (doc.items ?? []).reduce((subSum, item) => subSum + (item.amount ?? 0), 0),
      0
    );

  // 거래처 분석 데이터
  const clientAnalysisData = useMemo(() => {
    const details = documentsDetails as UserDocumentDetail[] | null;
    const consultationsByClient = (details ?? [])
      .flatMap((user) => user.consultations ?? [])
      .reduce<Record<string, ClientAnalysis>>((acc, consultation) => {
        const companyName = consultation.company_name;
        if (!acc[companyName]) {
          acc[companyName] = {
            name: companyName,
            consultations: 0,
            estimates: 0,
            orders: 0,
            totalSales: 0,
            totalPurchases: 0,
          };
        }
        acc[companyName].consultations += 1;
        (consultation.documents ?? []).forEach((doc) => {
          if (doc.type === "estimate") {
            acc[companyName].estimates += 1;
            if (doc.status === "completed") {
              acc[companyName].totalSales += (doc.items ?? []).reduce(
                (sum, item) => sum + (item.amount || 0),
                0
              );
            }
          } else if (doc.type === "order") {
            acc[companyName].orders += 1;
            if (doc.status === "completed") {
              acc[companyName].totalPurchases += (doc.items ?? []).reduce(
                (sum, item) => sum + (item.amount || 0),
                0
              );
            }
          }
        });
        return acc;
      }, {});
    return Object.values(consultationsByClient);
  }, [documentsDetails]);

  // 성과 지표
  const performanceMetrics = useMemo(() => {
    const details = documentsDetails as UserDocumentDetail[] | null;
    const targetAchievementRate = user?.target ? (completedSales / user.target) * 100 : 0;
    const estimateSuccessRate = estimates?.total > 0 ? (estimates.completed / estimates.total) * 100 : 0;
    const avgTransactionAmount = estimates?.completed > 0 ? completedSales / estimates.completed : 0;
    const totalConsultationsCount = (details ?? []).flatMap((u) => u.consultations ?? []).length;
    const totalEstimates = (details ?? [])
      .flatMap((u) => u.consultations ?? [])
      .flatMap((c) => c.documents ?? [])
      .filter((doc) => doc.type === "estimate").length;
    const consultationToEstimateRate = totalConsultationsCount > 0 ? (totalEstimates / totalConsultationsCount) * 100 : 0;
    return { targetAchievementRate, estimateSuccessRate, avgTransactionAmount, consultationToEstimateRate };
  }, [user, completedSales, estimates, documentsDetails]);

  const totalConsultations = ((documentsDetails as UserDocumentDetail[] | null) ?? []).flatMap((u) => u.consultations ?? []).length;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
          <UserProfileCard user={user} loginLogs={loginLogs} completedSales={completedSales} />
          <DateFilterCard
            dateFilter={dateFilter}
            selectedYear={selectedYear}
            selectedQuarter={selectedQuarter}
            selectedMonth={selectedMonth}
            onDateFilterChange={setDateFilter}
            onYearChange={setSelectedYear}
            onQuarterChange={setSelectedQuarter}
            onMonthChange={setSelectedMonth}
          />
        </div>

        <UserTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "dashboard" && (
          <UserDashboardTab followUpClients={followUpClients} expiringDocuments={expiringDocuments} />
        )}
        {activeTab === "consultation" && <UserConsultationTab documentsDetails={documentsDetails} />}
        {activeTab === "items" && (
          <UserItemsTab
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedItemCategory={selectedItemCategory}
            setSelectedItemCategory={setSelectedItemCategory}
            filteredItems={filteredItems}
            itemsChartData={itemsChartData}
          />
        )}
        {activeTab === "sales" && (
          <UserSalesTab
            salesChart={salesChart}
            itemsChartData={itemsChartData}
            aggregatedSalesCompanies={aggregatedSalesCompanies}
            salesSummary={salesSummary}
            userId={userId}
          />
        )}
        {activeTab === "purchase" && (
          <UserPurchaseTab
            purchaseChart={purchaseChart}
            itemsChartData={itemsChartData}
            aggregatedPurchaseCompanies={aggregatedPurchaseCompanies}
            salesSummary={salesSummary}
            userId={userId}
          />
        )}
        {activeTab === "trends" && <UserTrendsTab monthlyTrendData={monthlyTrendData} />}
        {activeTab === "performance" && (
          <UserPerformanceTab
            performanceMetrics={performanceMetrics}
            userTarget={user?.target}
            completedSales={completedSales}
            estimates={estimates}
            totalConsultations={totalConsultations}
          />
        )}
        {activeTab === "clients" && <UserClientsTab clientAnalysisData={clientAnalysisData} />}
        {activeTab === "todo" && <UserTodoTab userId={userId} />}
      </div>
    </div>
  );
}
