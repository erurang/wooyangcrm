// Dashboard data processing utilities

import type {
  DashboardUserData,
  DashboardConsultation,
  DashboardDocument,
  DashboardDocumentItem,
  AggregatedItem,
  ClientAnalysis,
  ChartData,
  CompanyTotal,
  AllDocumentTotals,
  PerformanceMetrics,
  MonthlyTrendData,
  ExpiringDocument,
  DashboardUser,
  DocumentCounts,
} from "@/types/dashboard";

// 중복 제거 및 총합 계산 함수 (generic)
export function aggregateData<T extends { name: string; total: number }>(
  data: T[],
  key: keyof T
): T[] {
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
}

// 차트 데이터 정리 (상위 5개 + 기타)
export const getChartData = (companies: CompanyTotal[]): ChartData => {
  const sorted = [...companies].sort((a, b) => b.total - a.total);
  const top5 = sorted.slice(0, 5);
  const otherTotal = sorted.slice(5).reduce((sum, c) => sum + c.total, 0);

  return {
    labels: [...top5.map((c) => c.name), otherTotal > 0 ? "기타" : ""].filter(
      Boolean
    ),
    data: [
      ...top5.map((c) => c.total),
      otherTotal > 0 ? otherTotal : 0,
    ].filter((v) => v > 0),
  };
};

// 문서 상세 데이터에서 금액 합계 계산 (단일 status/type용 - 하위 호환)
export const calculateDocumentTotals = (
  documentsDetails: DashboardUserData[],
  status: string,
  type: string
): number => {
  return (documentsDetails ?? [])
    .flatMap((user: DashboardUserData) => user.consultations ?? [])
    .flatMap((consultation: DashboardConsultation) => consultation.documents ?? [])
    .filter((doc: DashboardDocument) => doc.status === status && doc.type === type)
    .reduce(
      (sum: number, doc: DashboardDocument) =>
        sum +
        (doc.items ?? []).reduce(
          (subSum: number, item: DashboardDocumentItem) => subSum + (item.amount ?? 0),
          0
        ),
      0
    );
};

// 모든 문서 금액 및 카운트를 단일 순회로 계산 (최적화)
export const calculateAllDocumentTotals = (
  documentsDetails: DashboardUserData[]
): AllDocumentTotals => {
  const totals = {
    completedSales: 0,
    completedPurchases: 0,
    pendingSales: 0,
    pendingPurchases: 0,
    canceledSales: 0,
    canceledPurchases: 0,
  };
  const counts: { estimates: DocumentCounts; orders: DocumentCounts } = {
    estimates: { pending: 0, completed: 0, canceled: 0, total: 0 },
    orders: { pending: 0, completed: 0, canceled: 0, total: 0 },
  };

  (documentsDetails ?? []).forEach((userObj: DashboardUserData) => {
    (userObj.consultations ?? []).forEach((consultation: DashboardConsultation) => {
      (consultation.documents ?? []).forEach((doc: DashboardDocument) => {
        const docTotal = (doc.items ?? []).reduce(
          (sum: number, item: DashboardDocumentItem) => sum + (item.amount ?? 0),
          0
        );

        if (doc.type === "estimate") {
          counts.estimates.total++;
          if (doc.status === "pending") {
            counts.estimates.pending++;
            totals.pendingSales += docTotal;
          } else if (doc.status === "completed") {
            counts.estimates.completed++;
            totals.completedSales += docTotal;
          } else if (doc.status === "canceled") {
            counts.estimates.canceled++;
            totals.canceledSales += docTotal;
          }
        } else if (doc.type === "order") {
          counts.orders.total++;
          if (doc.status === "pending") {
            counts.orders.pending++;
            totals.pendingPurchases += docTotal;
          } else if (doc.status === "completed") {
            counts.orders.completed++;
            totals.completedPurchases += docTotal;
          } else if (doc.status === "canceled") {
            counts.orders.canceled++;
            totals.canceledPurchases += docTotal;
          }
        }
      });
    });
  });

  return { ...totals, ...counts };
};

// 거래처 분석 데이터 생성
export const generateClientAnalysisData = (
  documentsDetails: DashboardUserData[]
): ClientAnalysis[] => {
  const consultationsByClient = (documentsDetails ?? [])
    .flatMap((user: DashboardUserData) => user.consultations ?? [])
    .reduce((acc: Record<string, ClientAnalysis>, consultation: DashboardConsultation) => {
      const companyId = consultation.company_id;
      const companyName = consultation.company_name;
      if (!acc[companyId]) {
        acc[companyId] = {
          id: companyId,
          name: companyName,
          consultations: 0,
          estimates: 0,
          orders: 0,
          totalSales: 0,
          totalPurchases: 0,
        };
      }
      acc[companyId].consultations += 1;

      (consultation.documents ?? []).forEach((doc: DashboardDocument) => {
        if (doc.type === "estimate") {
          acc[companyId].estimates += 1;
          if (doc.status === "completed") {
            const docTotal = (doc.items ?? []).reduce(
              (sum: number, item: DashboardDocumentItem) => sum + (item.amount || 0),
              0
            );
            acc[companyId].totalSales += docTotal;
          }
        } else if (doc.type === "order") {
          acc[companyId].orders += 1;
          if (doc.status === "completed") {
            const docTotal = (doc.items ?? []).reduce(
              (sum: number, item: DashboardDocumentItem) => sum + (item.amount || 0),
              0
            );
            acc[companyId].totalPurchases += docTotal;
          }
        }
      });

      return acc;
    }, {});

  return Object.values(consultationsByClient);
};

// 성과 지표 계산
export const calculatePerformanceMetrics = (
  user: DashboardUser | null,
  completedSales: number,
  estimates: DocumentCounts,
  documentsDetails: DashboardUserData[]
): PerformanceMetrics => {
  const targetAchievementRate = user?.target
    ? (completedSales / user.target) * 100
    : 0;

  const estimateSuccessRate =
    estimates?.total > 0 ? (estimates.completed / estimates.total) * 100 : 0;

  const avgTransactionAmount =
    estimates?.completed > 0 ? completedSales / estimates.completed : 0;

  // 완료된 견적서별 거래 금액 추출
  const completedEstimateAmounts = (documentsDetails ?? [])
    .flatMap((userObj: DashboardUserData) => userObj.consultations ?? [])
    .flatMap((consultation: DashboardConsultation) => consultation.documents ?? [])
    .filter((doc: DashboardDocument) => doc.type === "estimate" && doc.status === "completed")
    .map((doc: DashboardDocument) =>
      (doc.items ?? []).reduce(
        (sum: number, item: DashboardDocumentItem) => sum + (item.amount ?? 0),
        0
      )
    )
    .filter((amount: number) => amount > 0);

  // 실제 최소/최대 거래 금액 계산
  const minTransactionAmount =
    completedEstimateAmounts.length > 0
      ? Math.min(...completedEstimateAmounts)
      : 0;
  const maxTransactionAmount =
    completedEstimateAmounts.length > 0
      ? Math.max(...completedEstimateAmounts)
      : 0;

  const totalConsultations = (documentsDetails ?? []).flatMap(
    (userObj: DashboardUserData) => userObj.consultations ?? []
  ).length;
  const totalEstimates = (documentsDetails ?? [])
    .flatMap((userObj: DashboardUserData) => userObj.consultations ?? [])
    .flatMap((consultation: DashboardConsultation) => consultation.documents ?? [])
    .filter((doc: DashboardDocument) => doc.type === "estimate").length;

  const consultationToEstimateRate =
    totalConsultations > 0 ? (totalEstimates / totalConsultations) * 100 : 0;

  return {
    targetAchievementRate,
    estimateSuccessRate,
    avgTransactionAmount,
    minTransactionAmount,
    maxTransactionAmount,
    consultationToEstimateRate,
  };
};

// 월별 트렌드 데이터 생성
export const generateMonthlyTrendData = (
  documentsDetails: DashboardUserData[],
  dateFilter: string,
  selectedMonth: number,
  selectedQuarter: number
): MonthlyTrendData => {
  const months = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월",
  ];

  const monthlySales = Array(12).fill(0);
  const monthlyPurchases = Array(12).fill(0);

  if (documentsDetails && documentsDetails.length > 0) {
    documentsDetails.forEach((userObj: DashboardUserData) => {
      (userObj.consultations || []).forEach((consultation: DashboardConsultation) => {
        if (!consultation.date) return;

        const consultDate = new Date(consultation.date);
        const month = consultDate.getMonth();

        (consultation.documents || []).forEach((doc: DashboardDocument) => {
          if (doc.status === "completed") {
            const total = (doc.items || []).reduce(
              (sum: number, item: DashboardDocumentItem) => sum + (item.amount || 0),
              0
            );

            if (doc.type === "estimate") {
              monthlySales[month] += total;
            } else if (doc.type === "order") {
              monthlyPurchases[month] += total;
            }
          }
        });
      });
    });
  }

  let filteredMonths: string[] = [];
  let filteredSales: number[] = [];
  let filteredPurchases: number[] = [];

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

  return {
    months: filteredMonths,
    salesData: filteredSales,
    purchaseData: filteredPurchases,
  };
};

// 만료 예정 견적서 계산
export const getExpiringDocuments = (
  documentsDetails: DashboardUserData[],
  today: Date,
  sevenDaysLater: Date
): ExpiringDocument[] => {
  return (documentsDetails ?? [])
    .flatMap((user: DashboardUserData) => user.consultations ?? [])
    .flatMap((consultation: DashboardConsultation) =>
      (consultation.documents ?? [])
        .filter((doc: DashboardDocument) => {
          if (doc.type !== "estimate" || !doc.valid_until) return false;
          const validUntil = new Date(doc.valid_until);
          return validUntil >= today && validUntil <= sevenDaysLater;
        })
        .map((doc: DashboardDocument) => ({
          id: doc.document_id,
          company_name: consultation.company_name,
          valid_until: doc.valid_until!,
          total_amount: (doc.items ?? []).reduce(
            (sum: number, item: DashboardDocumentItem) => sum + (item.amount || 0),
            0
          ),
        }))
    );
};

// 날짜 포맷팅
export function formatDate(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// 상태 텍스트
export const getStatusText = (status: string): string => {
  switch (status) {
    case "pending":
      return "진행 중";
    case "completed":
      return "완료됨";
    case "canceled":
      return "취소됨";
    default:
      return "알 수 없음";
  }
};

// 문서 타입 라벨
export function getDocTypeLabel(type: string): string {
  switch (type) {
    case "estimate":
      return "견적서";
    case "order":
      return "발주서";
    case "requestQuote":
      return "의뢰서";
    default:
      return "기타 문서";
  }
}

// 상태 색상
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "pending":
      return "text-amber-600 bg-amber-50";
    case "completed":
      return "text-emerald-600 bg-emerald-50";
    case "canceled":
      return "text-rose-600 bg-rose-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

// 기간 표시 텍스트 생성
export const formatPeriodLabel = (
  dateFilter: "year" | "quarter" | "month",
  selectedYear: number,
  selectedQuarter: number,
  selectedMonth: number
): string => {
  if (dateFilter === "year") {
    return `${selectedYear}년`;
  } else if (dateFilter === "quarter") {
    return `${selectedYear}년 ${selectedQuarter}분기`;
  } else {
    return `${selectedYear}년 ${selectedMonth}월`;
  }
};
