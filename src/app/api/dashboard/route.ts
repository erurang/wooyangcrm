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

    /** 📌 7. 후속 상담 필요 고객 */
    const [followUpClientsResult, topClientsResult, topCustomerResult] =
      await Promise.all([
        supabase
          .rpc("get_follow_up_clients", { user_id_param: userId })
          .order("last_consultation", { ascending: false })
          .limit(10),

        supabase.rpc("get_top_clients", { user_id_param: userId }).limit(3),

        supabase.rpc("get_top_revenue_customer", { user_id_param: userId }),
      ]);

    // 🔹 각각의 데이터와 오류 확인
    if (followUpClientsResult.error) {
      throw new Error(
        `Error fetching follow-up clients: ${followUpClientsResult.error.message}`
      );
    }
    if (topClientsResult.error) {
      throw new Error(
        `Error fetching top clients: ${topClientsResult.error.message}`
      );
    }
    if (topCustomerResult.error) {
      throw new Error(
        `Error fetching top customer: ${topCustomerResult.error.message}`
      );
    }

    // 🔹 데이터를 가져와서 사용
    const followUpClients = followUpClientsResult.data;
    const topClients = topClientsResult.data;
    const topCustomer = topCustomerResult.data;

    /** 📌 1️⃣ 최근 상담한 고객 리스트 가져오기 */
    const { data: recentConsultations, error: consultationsError } =
      await supabase
        .from("contacts_consultations")
        .select("contacts(contact_name), created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }) // 최신순 정렬
        .limit(10);

    if (consultationsError)
      throw new Error(
        `Error fetching recent consultations: ${consultationsError.message}`
      );

    const transformed = recentConsultations.map((rc) => ({
      created_at: rc.created_at,
      contact_name: (rc as any).contacts?.contact_name,
    }));

    /** 📌 2️⃣ 최근 문서를 진행한 고객 리스트 가져오기 */
    const { data: recentDocuments, error: documentsError2 } = await supabase
      .from("contacts_documents")
      .select(`created_at, documents(content)`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }) // 최신순 정렬
      .limit(10);

    if (documentsError2)
      throw new Error(
        `Error fetching recent documents: ${documentsError2.message}`
      );

    // 🔹 최종 데이터 가공
    const formattedRecentDocuments = recentDocuments?.map((d) => ({
      company_name: (d as any).documents.content.company_name,
      created_at: d.created_at,
    }));

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
      })),

      recent_consultations: transformed,
      recent_documents: formattedRecentDocuments,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
