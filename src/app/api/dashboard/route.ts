import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    /** 📌 1. 이번 달 문서(매출, 매입, 영업 기회) 데이터 가져오기 */
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select(
        "id, type, status, created_at, content, company_id, document_number"
      )
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    if (documentsError)
      throw new Error(`Error fetching documents: ${documentsError.message}`);

    let totalSales = 0,
      totalPurchases = 0,
      expectedSales = 0;

    const salesData = documents.reduce((acc: any, doc) => {
      const dateKey = doc.created_at.split("T")[0];
      if (!acc[dateKey])
        acc[dateKey] = { totalSales: 0, totalPurchases: 0, expectedSales: 0 };

      if (doc.status === "completed") {
        if (doc.type === "estimate") {
          acc[dateKey].totalSales += doc.content.total_amount;
          totalSales += doc.content.total_amount;
        } else if (doc.type === "order") {
          acc[dateKey].totalPurchases += doc.content.total_amount;
          totalPurchases += doc.content.total_amount;
        }
      } else if (doc.status === "pending" && doc.type === "estimate") {
        acc[dateKey].expectedSales += doc.content.total_amount;
        expectedSales += doc.content.total_amount;
      }
      return acc;
    }, {});

    /** 📌 2. 만료 예정 문서 필터링 */
    const expiringDocuments = documents.filter(
      (doc) =>
        doc.type === "estimate" &&
        doc.status === "pending" &&
        new Date(doc.content.valid_until) >= today &&
        new Date(doc.content.valid_until) <= sevenDaysLater
    );

    /** 📌 3. 문서 상태별 개수 계산 */
    const documentStatusCounts = documents.reduce((acc: any, doc) => {
      const key = `${doc.type}-${doc.status}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const formattedDocumentStatusCounts = Object.entries(
      documentStatusCounts
    ).map(([key, count]) => {
      const [type, status] = key.split("-");
      return { type, status, count };
    });

    /** 📌 4. 신규 고객사 개수 (이번 달 생성된 회사만) */
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, created_at")
      .in("id", Array.from(new Set(documents.map((doc) => doc.company_id))));

    if (companiesError)
      throw new Error(`Error fetching companies: ${companiesError.message}`);

    // 이번 달 신규 고객사 필터링
    const newClients = companies
      .filter((company) => new Date(company.created_at) >= startOfMonth)
      .map((company) => company.id);

    // 기존 고객사 리스트
    const existingClients = companies
      .filter((company) => !newClients.includes(company.id))
      .map((company) => company.id);

    /** 📌 5. 신규 상담 개수 */
    const { data: newConsultations, error: newConsultationsError } =
      await supabase
        .from("consultations")
        .select("id,company_id")
        .eq("user_id", userId)
        .gte("created_at", startOfMonth.toISOString());

    if (newConsultationsError)
      throw new Error(
        `Error fetching new consultations: ${newConsultationsError.message}`
      );

    const newConsultationsCount = newConsultations.filter((consultation) =>
      newClients.includes(consultation.company_id)
    ).length;

    const existingConsultationsCount =
      newConsultations.length - newConsultationsCount;

    const newOpportunities = documents.filter(
      (doc) =>
        newClients.includes(doc.company_id) &&
        doc.type === "estimate" &&
        doc.status === "pending"
    );
    const existingOpportunities = documents.filter(
      (doc) =>
        existingClients.includes(doc.company_id) &&
        doc.type === "estimate" &&
        doc.status === "pending"
    );

    const newEstimatesCompleted = documents.filter(
      (doc) =>
        newClients.includes(doc.company_id) &&
        doc.type === "estimate" &&
        doc.status === "completed"
    );
    const existingEstimatesCompleted = documents.filter(
      (doc) =>
        existingClients.includes(doc.company_id) &&
        doc.type === "estimate" &&
        doc.status === "completed"
    );

    /** 📌 6. 신규 영업 기회 및 완료된 견적 총액 계산 */
    const extractTotalAmount = (docs: any[]) =>
      docs.reduce((acc, doc) => acc + (doc.content?.total_amount || 0), 0);

    const newOpportunitiesTotal = extractTotalAmount(newOpportunities);
    const newEstimatesCompletedTotal = extractTotalAmount(
      newEstimatesCompleted
    );

    /** 📌 7. 후속 상담 필요 고객 */
    const { data: followUpClients, error: followUpClientsError } =
      await supabase
        .rpc("get_follow_up_clients", { user_id_param: userId })
        .order("last_consultation", { ascending: false })
        .limit(10);

    if (followUpClientsError)
      throw new Error(
        `Error fetching follow-up clients: ${followUpClientsError.message}`
      );

    /** 📌 8. 주요 고객 (상담 & 매출 TOP 고객) */
    const { data: topClients, error: topClientsError } = await supabase
      .rpc("get_top_clients", { user_id_param: userId })
      .limit(3);

    if (topClientsError)
      throw new Error(`Error fetching top clients: ${topClientsError.message}`);

    /** 📌 9. 최고 매출 고객 */
    const { data: topCustomer, error: topCustomerError } = await supabase.rpc(
      "get_top_revenue_customer",
      {
        user_id_param: userId,
      }
    );

    if (topCustomerError)
      throw new Error(
        `Error fetching top customer: ${topCustomerError.message}`
      );

    /** 📌 10. 최근 상담한 고객 */
    const { data: consultedClients, error: consultedClientsError } =
      await supabase
        .from("consultations")
        .select("company_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

    if (consultedClientsError)
      throw new Error(
        `Error fetching consulted clients: ${consultedClientsError.message}`
      );

    /** 📌 11. 고객사 정보 매핑 */
    const uniqueCompanyIds = Array.from(
      new Set([
        ...newClients,
        ...consultedClients.map((c) => c.company_id),
        ...topClients.map((c: any) => c.company_id), // 주요 고객사의 company_id 추가
      ])
    );

    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .select("id, name")
      .in("id", uniqueCompanyIds);

    if (companyError)
      throw new Error(`Error fetching company names: ${companyError.message}`);

    const companyMap = companyData.reduce((acc, company) => {
      acc[company.id] = company.name;
      return acc;
    }, {} as Record<string, string>);

    /** 📌 12. 최종 데이터 반환 */
    return NextResponse.json({
      salesData,
      expiringDocuments,
      followUpClients,
      documentStatusCounts: formattedDocumentStatusCounts,
      monthlyPerformance: {
        totalSales,
        totalPurchases,
        expectedSales,
        topCustomer,
      },
      new_sales: {
        new_clients_count: newClients.length,
        new_consultations_count: newConsultationsCount,
        new_opportunities: extractTotalAmount(newOpportunities),
        new_estimate_completed: extractTotalAmount(newEstimatesCompleted),
      },
      current_month_performance: {
        total_consultations: existingConsultationsCount,
        total_opportunities: extractTotalAmount(existingOpportunities),
        total_estimate_completed: extractTotalAmount(
          existingEstimatesCompleted
        ),
      },
      clients: topClients.map((client: any) => ({
        ...client,
        company_name: companyMap[client.company_id] || "알 수 없음",
      })),
      consultedClients: consultedClients.map((client) => ({
        ...client,
        company_name: companyMap[client.company_id] || "알 수 없음",
      })),
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
