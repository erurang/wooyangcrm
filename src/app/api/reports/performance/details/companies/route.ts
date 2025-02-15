// "c79219a1-7ac0-41bd-92c5-94e665313a7e"
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId");
  const type = searchParams.get("type"); // "order" or "estimate"
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = parseInt(searchParams.get("page") || "1");
  const searchCompany = searchParams.get("search") || "";

  if (!userId || !type || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Missing userId, type, startDate, or endDate" },
      { status: 400 }
    );
  }

  try {
    // 🔹 1️⃣ documents에서 모든 관련 데이터를 가져온다.
    let { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("company_id, created_at, status, type, content")
      // .eq("user_id", userId)
      .eq("type", type)
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false });

    if (documentsError) throw documentsError;

    if (searchCompany && documents !== null) {
      const { data: filteredCompanies, error: filteredCompaniesError } =
        await supabase
          .from("companies")
          .select("id")
          .ilike("name", `%${searchCompany}%`);

      if (filteredCompaniesError) throw filteredCompaniesError;

      const filteredCompanyIds = filteredCompanies.map((c) => c.id);
      documents = documents.filter((doc) =>
        filteredCompanyIds.includes(doc.company_id)
      );
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ data: [], totalPages: 1 }, { status: 200 });
    }

    // 🔹 2️⃣ 데이터를 `company_id` 기준으로 그룹화하고 집계한다.
    const companyStats = new Map();

    documents.forEach((doc) => {
      const companyId = doc.company_id;
      if (!companyStats.has(companyId)) {
        companyStats.set(companyId, {
          companyId,
          companyName: "", // ⬅️ 나중에 채울 값
          lastConsultationDate: "", // ✅ 최신 created_at 값
          lastEstimateDate: "",
          estimateCount: 0,
          cancellationRate: 0,
          orderRate: 0,
          totalSalesAmount: 0,
          lastOrderDate: "",
          orderCount: 0,
          totalPurchaseAmount: 0, // ✅ 발주 총액 추가
        });
      }

      const companyData = companyStats.get(companyId);

      // 🔸 가장 최신 created_at 값을 `lastConsultationDate`로 설정
      if (
        !companyData.lastConsultationDate ||
        new Date(doc.created_at) > new Date(companyData.lastConsultationDate)
      ) {
        companyData.lastConsultationDate = doc.created_at;
      }

      if (type === "estimate") {
        // 🔸 견적일 최신값 계산
        companyData.lastEstimateDate = doc.created_at;
        companyData.estimateCount += 1;

        // 🔸 취소율 계산
        if (doc.status === "canceled") {
          companyData.cancellationRate += 1;
        }

        // 🔸 성공률 및 매출액 계산
        if (doc.status === "completed") {
          companyData.orderRate += 1;
          companyData.totalSalesAmount += doc.content?.total_amount || 0;
        }
      } else if (type === "order") {
        // 🔸 최근 발주일 계산
        companyData.lastOrderDate = doc.created_at;
        companyData.orderCount += 1;

        // 🔸 발주 총액 계산
        if (doc.status === "completed") {
          companyData.totalPurchaseAmount += doc.content?.total_amount || 0;
        }
      }

      companyStats.set(companyId, companyData);
    });

    // 🔹 3️⃣ 취소율 및 성공률 퍼센트 변환
    companyStats.forEach((data) => {
      if (type === "estimate" && data.estimateCount > 0) {
        data.cancellationRate =
          (data.cancellationRate / data.estimateCount) * 100;
        data.orderRate = (data.orderRate / data.estimateCount) * 100;
      }
    });

    // 🔹 4️⃣ `company_id` 기준으로 회사명 가져오기
    const companyIds = Array.from(companyStats.keys());

    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, name")
      .in("id", companyIds);

    if (companiesError) throw companiesError;

    // 🔹 5️⃣ 각 회사 데이터에 `companyName` 추가
    const companyNameMap = new Map(companies.map((c) => [c.id, c.name]));

    companyStats.forEach((company) => {
      company.companyName = companyNameMap.get(company.companyId) || "Unknown";
    });

    // 🔹 6️⃣ 데이터를 회사명 기준으로 정렬하고 페이지네이션 적용
    let companyList = Array.from(companyStats.values());

    // **회사명을 기준으로 오름차순 정렬**
    companyList.sort((a, b) => a.companyName.localeCompare(b.companyName));

    const pageSize = 10; // 페이지당 10개
    const totalPages = Math.ceil(companyList.length / pageSize);
    const paginatedCompanies = companyList.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

    return NextResponse.json(
      { data: paginatedCompanies, totalPages },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching performance data:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
