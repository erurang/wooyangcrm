import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;

  if (!companyId) {
    return NextResponse.json({ error: "Missing company ID" }, { status: 400 });
  }

  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);

    // 전체 문서 조회 (기간 제한 없이)
    const { data: allDocuments, error: docError } = await supabase
      .from("documents")
      .select("id, type, status, total_amount, date, created_at, content, user_id")
      .eq("company_id", companyId)
      .order("date", { ascending: true });

    if (docError) throw docError;

    // 전체 상담 조회
    const { data: allConsultations, error: consultError } = await supabase
      .from("consultations")
      .select("id, date, contact_method, follow_up_date, user_id, created_at")
      .eq("company_id", companyId)
      .order("date", { ascending: true });

    if (consultError) throw consultError;

    // 담당자 정보
    const { data: contacts, error: contactError } = await supabase
      .from("contacts")
      .select("id, contact_name, department, level, resign")
      .eq("company_id", companyId);

    if (contactError) throw contactError;

    // 사용자 정보 (담당자별 통계용)
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id, name");

    if (userError) throw userError;

    const userMap = new Map(users?.map(u => [u.id, u.name]) || []);

    // ==================== 기본 집계 ====================
    const documents = allDocuments || [];
    const consultations = allConsultations || [];

    // 문서 유형별 집계
    const docStats = {
      estimate: { total: 0, completed: 0, pending: 0, canceled: 0, amount: 0, avgAmount: 0 },
      order: { total: 0, completed: 0, pending: 0, canceled: 0, amount: 0, avgAmount: 0 },
      requestQuote: { total: 0, completed: 0, pending: 0, canceled: 0, amount: 0, avgAmount: 0 },
    };

    // 연도별/분기별/월별 데이터 집계
    const yearlyData: Record<number, { sales: number; purchases: number; consultations: number; documents: number }> = {};
    const quarterlyData: Record<string, { sales: number; purchases: number; consultations: number }> = {};
    const monthlyData: Record<string, {
      month: string;
      estimateAmount: number;
      orderAmount: number;
      estimateCount: number;
      orderCount: number;
      consultationCount: number;
    }> = {};

    // 품목별 매출 집계
    const productStats: Record<string, { name: string; spec: string; totalAmount: number; totalQuantity: number; count: number }> = {};

    // 담당자별 활동 집계
    const userActivity: Record<string, { userId: string; name: string; documents: number; consultations: number; totalAmount: number }> = {};

    // 첫/마지막 거래일
    let firstTransactionDate: string | null = null;
    let lastTransactionDate: string | null = null;

    documents.forEach((doc) => {
      const type = doc.type as keyof typeof docStats;
      const status = doc.status as "completed" | "pending" | "canceled";
      const amount = doc.total_amount || 0;
      const date = doc.date || "";
      const year = date ? parseInt(date.substring(0, 4)) : 0;
      const month = date?.substring(0, 7) || "";
      const quarter = date ? `${year}Q${Math.ceil(parseInt(date.substring(5, 7)) / 3)}` : "";

      // 첫/마지막 거래일
      if (date && status === "completed") {
        if (!firstTransactionDate || date < firstTransactionDate) firstTransactionDate = date;
        if (!lastTransactionDate || date > lastTransactionDate) lastTransactionDate = date;
      }

      // 문서 유형별 집계
      if (docStats[type]) {
        docStats[type].total++;
        if (status && docStats[type][status] !== undefined) {
          docStats[type][status]++;
        }
        if (status === "completed") {
          docStats[type].amount += amount;
        }
      }

      // 연도별 집계
      if (year && status === "completed") {
        if (!yearlyData[year]) {
          yearlyData[year] = { sales: 0, purchases: 0, consultations: 0, documents: 0 };
        }
        yearlyData[year].documents++;
        if (type === "estimate") yearlyData[year].sales += amount;
        if (type === "order") yearlyData[year].purchases += amount;
      }

      // 분기별 집계
      if (quarter && status === "completed") {
        if (!quarterlyData[quarter]) {
          quarterlyData[quarter] = { sales: 0, purchases: 0, consultations: 0 };
        }
        if (type === "estimate") quarterlyData[quarter].sales += amount;
        if (type === "order") quarterlyData[quarter].purchases += amount;
      }

      // 월별 집계
      if (month) {
        if (!monthlyData[month]) {
          monthlyData[month] = { month, estimateAmount: 0, orderAmount: 0, estimateCount: 0, orderCount: 0, consultationCount: 0 };
        }
        if (type === "estimate" && status === "completed") {
          monthlyData[month].estimateAmount += amount;
          monthlyData[month].estimateCount++;
        } else if (type === "order" && status === "completed") {
          monthlyData[month].orderAmount += amount;
          monthlyData[month].orderCount++;
        }
      }

      // 품목별 집계 (content.items에서 추출)
      if (status === "completed" && doc.content) {
        const content = typeof doc.content === "string" ? JSON.parse(doc.content) : doc.content;
        const items = content?.items || [];
        items.forEach((item: any) => {
          const key = `${item.name || ""}|${item.spec || ""}`;
          if (!productStats[key]) {
            productStats[key] = { name: item.name || "", spec: item.spec || "", totalAmount: 0, totalQuantity: 0, count: 0 };
          }
          productStats[key].totalAmount += item.amount || 0;
          productStats[key].totalQuantity += item.quantity || 0;
          productStats[key].count++;
        });
      }

      // 담당자별 활동
      if (doc.user_id) {
        if (!userActivity[doc.user_id]) {
          userActivity[doc.user_id] = { userId: doc.user_id, name: userMap.get(doc.user_id) || "Unknown", documents: 0, consultations: 0, totalAmount: 0 };
        }
        userActivity[doc.user_id].documents++;
        if (status === "completed") {
          userActivity[doc.user_id].totalAmount += amount;
        }
      }
    });

    // 평균 거래 금액 계산
    Object.keys(docStats).forEach((type) => {
      const stat = docStats[type as keyof typeof docStats];
      stat.avgAmount = stat.completed > 0 ? Math.round(stat.amount / stat.completed) : 0;
    });

    // 상담 집계
    const contactMethodStats: Record<string, number> = {};
    let followUpNeeded = 0;
    const todayStr = today.toISOString().split("T")[0];

    consultations.forEach((c) => {
      const method = c.contact_method || "other";
      contactMethodStats[method] = (contactMethodStats[method] || 0) + 1;

      if (c.follow_up_date && c.follow_up_date >= todayStr) {
        followUpNeeded++;
      }

      const date = c.date || "";
      const year = date ? parseInt(date.substring(0, 4)) : 0;
      const month = date?.substring(0, 7) || "";
      const quarter = date ? `${year}Q${Math.ceil(parseInt(date.substring(5, 7)) / 3)}` : "";

      // 연도별 상담
      if (year) {
        if (!yearlyData[year]) {
          yearlyData[year] = { sales: 0, purchases: 0, consultations: 0, documents: 0 };
        }
        yearlyData[year].consultations++;
      }

      // 분기별 상담
      if (quarter) {
        if (!quarterlyData[quarter]) {
          quarterlyData[quarter] = { sales: 0, purchases: 0, consultations: 0 };
        }
        quarterlyData[quarter].consultations++;
      }

      // 월별 상담
      if (month) {
        if (!monthlyData[month]) {
          monthlyData[month] = { month, estimateAmount: 0, orderAmount: 0, estimateCount: 0, orderCount: 0, consultationCount: 0 };
        }
        monthlyData[month].consultationCount++;
      }

      // 담당자별 상담
      if (c.user_id) {
        if (!userActivity[c.user_id]) {
          userActivity[c.user_id] = { userId: c.user_id, name: userMap.get(c.user_id) || "Unknown", documents: 0, consultations: 0, totalAmount: 0 };
        }
        userActivity[c.user_id].consultations++;
      }
    });

    // ==================== 비교 분석 ====================

    // 전년 대비 (YoY)
    const currentYearData = yearlyData[currentYear] || { sales: 0, purchases: 0, consultations: 0, documents: 0 };
    const prevYearData = yearlyData[currentYear - 1] || { sales: 0, purchases: 0, consultations: 0, documents: 0 };

    const yoyComparison = {
      currentYear,
      prevYear: currentYear - 1,
      sales: {
        current: currentYearData.sales,
        previous: prevYearData.sales,
        change: prevYearData.sales > 0 ? ((currentYearData.sales - prevYearData.sales) / prevYearData.sales * 100) : null,
      },
      purchases: {
        current: currentYearData.purchases,
        previous: prevYearData.purchases,
        change: prevYearData.purchases > 0 ? ((currentYearData.purchases - prevYearData.purchases) / prevYearData.purchases * 100) : null,
      },
      consultations: {
        current: currentYearData.consultations,
        previous: prevYearData.consultations,
        change: prevYearData.consultations > 0 ? ((currentYearData.consultations - prevYearData.consultations) / prevYearData.consultations * 100) : null,
      },
    };

    // 전분기 대비 (QoQ)
    const currentQuarterKey = `${currentYear}Q${currentQuarter}`;
    const prevQuarterKey = currentQuarter > 1
      ? `${currentYear}Q${currentQuarter - 1}`
      : `${currentYear - 1}Q4`;

    const currentQData = quarterlyData[currentQuarterKey] || { sales: 0, purchases: 0, consultations: 0 };
    const prevQData = quarterlyData[prevQuarterKey] || { sales: 0, purchases: 0, consultations: 0 };

    const qoqComparison = {
      currentQuarter: currentQuarterKey,
      prevQuarter: prevQuarterKey,
      sales: {
        current: currentQData.sales,
        previous: prevQData.sales,
        change: prevQData.sales > 0 ? ((currentQData.sales - prevQData.sales) / prevQData.sales * 100) : null,
      },
      purchases: {
        current: currentQData.purchases,
        previous: prevQData.purchases,
        change: prevQData.purchases > 0 ? ((currentQData.purchases - prevQData.purchases) / prevQData.purchases * 100) : null,
      },
    };

    // 견적 → 발주 전환율
    const conversionRate = docStats.estimate.completed > 0
      ? (docStats.order.completed / docStats.estimate.completed * 100)
      : 0;

    // ==================== 정렬 및 TOP 데이터 ====================

    // 월별 데이터 정렬
    const sortedMonthlyData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    // 연도별 데이터 정렬
    const sortedYearlyData = Object.entries(yearlyData)
      .map(([year, data]) => ({ year: parseInt(year), ...data }))
      .sort((a, b) => a.year - b.year);

    // 분기별 데이터 정렬
    const sortedQuarterlyData = Object.entries(quarterlyData)
      .map(([quarter, data]) => ({ quarter, ...data }))
      .sort((a, b) => a.quarter.localeCompare(b.quarter));

    // TOP 10 품목 (금액 기준)
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    // 담당자별 활동 정렬 (총액 기준)
    const sortedUserActivity = Object.values(userActivity)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    // 최근 문서 (최신 10개)
    const { data: recentDocs } = await supabase
      .from("documents")
      .select("id, type, document_number, status, total_amount, date")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(10);

    // 담당자 통계
    const activeContacts = contacts?.filter(c => !c.resign).length || 0;
    const resignedContacts = contacts?.filter(c => c.resign).length || 0;
    const departmentStats: Record<string, number> = {};
    contacts?.forEach(c => {
      if (!c.resign && c.department) {
        departmentStats[c.department] = (departmentStats[c.department] || 0) + 1;
      }
    });

    // ==================== 요약 통계 ====================
    const totalMonths = sortedMonthlyData.length || 1;
    const summary = {
      totalSales: docStats.estimate.amount,
      totalPurchases: docStats.order.amount,
      totalDocuments: documents.length,
      totalConsultations: consultations.length,
      totalContacts: activeContacts,
      resignedContacts,
      followUpNeeded,
      avgSalesPerMonth: Math.round(docStats.estimate.amount / totalMonths),
      avgPurchasesPerMonth: Math.round(docStats.order.amount / totalMonths),
      avgSalesPerTransaction: docStats.estimate.avgAmount,
      avgPurchasePerTransaction: docStats.order.avgAmount,
      conversionRate: Math.round(conversionRate * 10) / 10,
      firstTransactionDate,
      lastTransactionDate,
      tradingDays: firstTransactionDate && lastTransactionDate
        ? Math.ceil((new Date(lastTransactionDate).getTime() - new Date(firstTransactionDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    };

    return NextResponse.json({
      summary,
      documentStats: docStats,
      consultationStats: {
        total: consultations.length,
        byMethod: contactMethodStats,
        followUpNeeded,
      },
      contactStats: {
        active: activeContacts,
        resigned: resignedContacts,
        byDepartment: departmentStats,
      },
      yoyComparison,
      qoqComparison,
      yearlyData: sortedYearlyData,
      quarterlyData: sortedQuarterlyData,
      monthlyData: sortedMonthlyData,
      topProducts,
      userActivity: sortedUserActivity,
      recentDocuments: recentDocs || [],
    });
  } catch (error) {
    console.error("Error fetching company stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch company statistics" },
      { status: 500 }
    );
  }
}
