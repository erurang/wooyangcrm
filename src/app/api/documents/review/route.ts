import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 문서 현황 분석 (전체 문서 조회 및 분석)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const reviewStatus = searchParams.get("reviewStatus");
    const userId = searchParams.get("userId");
    const companySearch = searchParams.get("companySearch");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // 오늘 날짜
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // 7일 전 날짜 (stale 기준)
    const staleDate = new Date(today);
    staleDate.setDate(staleDate.getDate() - 7);
    const staleDateStr = staleDate.toISOString().split("T")[0];

    // 기본 쿼리
    let query = supabase
      .from("documents")
      .select(`
        *,
        companies (
          id,
          name,
          phone,
          fax
        ),
        users (
          id,
          name,
          level
        ),
        contacts_documents (
          contacts (
            contact_name,
            level
          )
        )
      `, { count: "exact" });

    // reviewStatus에 따라 필터링
    if (reviewStatus === "expired") {
      // 견적서 유효기간 만료 (pending 상태이면서 valid_until < 오늘)
      query = query
        .eq("status", "pending")
        .eq("type", "estimate")
        .lt("valid_until", todayStr);
    } else if (reviewStatus === "canceled") {
      // 취소된 문서
      query = query.eq("status", "canceled");
    } else if (reviewStatus === "stale") {
      // 오래된 진행중 (7일 이상)
      query = query
        .eq("status", "pending")
        .lt("date", staleDateStr);
    } else if (reviewStatus === "pending") {
      // 모든 진행중 문서
      query = query.eq("status", "pending");
    } else if (reviewStatus === "completed") {
      // 완료된 문서
      query = query.eq("status", "completed");
    }
    // else: 전체 문서 (필터 없음)

    // 문서 유형 필터
    if (type && type !== "all") {
      query = query.eq("type", type);
    }

    // 담당자 필터 (documents 테이블의 user_id 컬럼)
    if (userId) {
      query = query.eq("user_id", userId);
    }

    // 거래처 검색
    if (companySearch) {
      query = query.ilike("companies.name", `%${companySearch}%`);
    }

    // 날짜 범위
    if (dateFrom) {
      query = query.gte("date", dateFrom);
    }
    if (dateTo) {
      query = query.lte("date", dateTo);
    }

    // 정렬 및 페이지네이션
    query = query
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: documents, error, count } = await query;

    if (error) {
      console.error("문서 조회 오류:", error);
      throw error;
    }

    // 통계 조회 (별도 쿼리) - userId 필터가 있을 경우 해당 사용자 기준으로
    let statsBaseQuery = supabase.from("documents").select("id", { count: "exact", head: true });

    // 만료 문서 수
    let expiredQuery = supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("type", "estimate")
      .lt("valid_until", todayStr);

    // 취소 문서 수
    let canceledQuery = supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "canceled");

    // 7일 이상 장기 문서 수
    let staleQuery = supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("date", staleDateStr);

    // 진행중 문서 수
    let pendingQuery = supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    // 완료 문서 수
    let completedQuery = supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed");

    const { count: expiredCount } = await expiredQuery;
    const { count: canceledCount } = await canceledQuery;
    const { count: staleCount } = await staleQuery;
    const { count: pendingCount } = await pendingQuery;
    const { count: completedCount } = await completedQuery;

    // 데이터 변환
    const transformedDocuments = (documents || []).map((doc: any) => {
      const userInfo = doc.users || {};
      const contactInfo = doc.contacts_documents?.[0]?.contacts || {};
      const companyInfo = doc.companies || {};

      // 미완료 사유 결정
      let reviewReason = "";
      if (doc.status === "canceled") {
        reviewReason = doc.status_reason?.canceled?.reason || "취소됨";
      } else if (doc.type === "estimate" && doc.valid_until && new Date(doc.valid_until) < today) {
        reviewReason = "유효기간 만료";
      } else if (new Date(doc.date) < staleDate) {
        const daysDiff = Math.floor((today.getTime() - new Date(doc.date).getTime()) / (1000 * 60 * 60 * 24));
        reviewReason = `${daysDiff}일 경과`;
      }

      return {
        id: doc.id,
        type: doc.type,
        status: doc.status,
        document_number: doc.document_number,
        date: doc.date,
        valid_until: doc.valid_until,
        delivery_date: doc.delivery_date,
        delivery_term: doc.delivery_term,
        delivery_place: doc.delivery_place,
        payment_method: doc.payment_method,
        total_amount: doc.total_amount,
        notes: doc.notes,
        content: doc.content, // items 포함
        company_id: companyInfo.id,
        company_name: companyInfo.name || "",
        company_phone: companyInfo.phone || "",
        company_fax: companyInfo.fax || "",
        user_id: doc.user_id,
        user_name: userInfo.name || "퇴사",
        user_level: userInfo.level || "",
        contact_name: contactInfo.contact_name || "",
        contact_level: contactInfo.level || "",
        consultation_id: doc.consultation_id,
        status_reason: doc.status_reason,
        review_reason: reviewReason,
        created_at: doc.created_at,
      };
    });

    return NextResponse.json({
      documents: transformedDocuments,
      total: count || 0,
      stats: {
        total: (pendingCount || 0) + (completedCount || 0) + (canceledCount || 0),
        pending: pendingCount || 0,
        completed: completedCount || 0,
        expired: expiredCount || 0,
        canceled: canceledCount || 0,
        stale: staleCount || 0,
      },
    });
  } catch (error) {
    console.error("문서 현황 조회 오류:", error);
    return NextResponse.json(
      { error: "문서 현황 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
