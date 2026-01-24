import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import {
  logApiCall,
  getIpFromRequest,
  getUserAgentFromRequest,
  logConsultationOperation,
  logUserActivity,
} from "@/lib/apiLogger";

// 알림 생성 함수
async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedId: string,
  relatedType: string
) {
  try {
    const { error } = await supabase.from("notifications").insert([
      {
        user_id: userId,
        type,
        title,
        message,
        related_id: relatedId,
        related_type: relatedType,
        read: false,
      },
    ]);

    if (error) {
      console.error("알림 생성 실패:", error);
    }
  } catch (e) {
    console.error("알림 생성 예외:", e);
  }
}

/**
 * GET /api/consultations
 * - companyId가 있으면: 회사별 상담 목록 (페이지네이션, 검색, 하이라이트)
 * - companyId가 없으면: 전체 상담 목록 (페이지네이션, 키워드 검색, 필터)
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = req.nextUrl;
  const companyId = searchParams.get("companyId");

  try {
    // 회사별 상담 목록 조회
    if (companyId) {
      let page = searchParams.get("page");
      const search = searchParams.get("search") || "";
      const highlightId = searchParams.get("highlightId");

      if (!page) {
        return NextResponse.json(
          { message: "Missing required parameter: page" },
          { status: 400 }
        );
      }

      const consultationsPerPage = 4;
      let pageNumber = parseInt(page, 10);

      // 하이라이트 ID가 있으면 해당 상담이 있는 페이지 찾기
      if (highlightId && !search) {
        const { data: targetConsultation } = await supabase
          .from("consultations")
          .select("created_at")
          .eq("id", highlightId)
          .eq("company_id", companyId)
          .single();

        if (targetConsultation) {
          const { count: newerCount } = await supabase
            .from("consultations")
            .select("id", { count: "exact", head: true })
            .eq("company_id", companyId)
            .gt("created_at", targetConsultation.created_at);

          const position = (newerCount || 0) + 1;
          pageNumber = Math.ceil(position / consultationsPerPage);
        }
      }

      const from = (pageNumber - 1) * consultationsPerPage;
      const to = pageNumber * consultationsPerPage - 1;

      let query = supabase
        .from("consultations")
        .select(
          "id, date, title, content, contact_method, follow_up_date, user_id, documents(id, type, document_number, status), created_at",
          { count: "exact" }
        )
        .eq("company_id", companyId)
        .range(from, to)
        .order("created_at", { ascending: false });

      if (search) {
        const searchTerms = search
          .split(",")
          .map((term) => term.trim())
          .filter((term) => term.length > 0);

        searchTerms.forEach((term) => {
          query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%`);
        });
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return NextResponse.json({
        consultations: data,
        totalPages: count ? Math.ceil(count / consultationsPerPage) : 1,
        currentPage: pageNumber,
      });
    }

    // 전체 상담 목록 조회 (기존 로직)
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const keyword = searchParams.get("keyword");
    const status = searchParams.get("status");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const sortBy = searchParams.get("sort_by") || "created_at";
    const order = searchParams.get("order") || "desc";

    let query = supabase.from("consultations").select("*", { count: "exact" });

    if (keyword) {
      query = query.ilike("content", `%${keyword}%`);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (startDate && endDate) {
      query = query.gte("date", startDate).lte("date", endDate);
    }

    query = query.order(sortBy, { ascending: order === "asc" });
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      logApiCall({
        endpoint: "/api/consultations",
        method: "GET",
        statusCode: 500,
        responseTimeMs: Date.now() - startTime,
        ipAddress: getIpFromRequest(req),
        userAgent: getUserAgentFromRequest(req),
        errorMessage: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / limit);

    logApiCall({
      endpoint: "/api/consultations",
      method: "GET",
      statusCode: 200,
      responseTimeMs: Date.now() - startTime,
      ipAddress: getIpFromRequest(req),
      userAgent: getUserAgentFromRequest(req),
    });

    return NextResponse.json({
      data,
      totalCount: count,
      totalPages,
      limit,
      offset,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch consultations",
        error: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/consultations
 * 상담 등록
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const {
      company_id,
      content,
      follow_up_date,
      user_id,
      date,
      title,
      contact_method,
    } = body;

    if (!company_id || !content || !user_id) {
      logApiCall({
        userId: user_id || null,
        endpoint: "/api/consultations",
        method: "POST",
        statusCode: 400,
        responseTimeMs: Date.now() - startTime,
        ipAddress: getIpFromRequest(req),
        userAgent: getUserAgentFromRequest(req),
        errorMessage: "필수 값 누락",
      });
      return NextResponse.json({ error: "필수 값이 없습니다." }, { status: 400 });
    }

    const { data: insertedConsultation, error: insertError } = await supabase
      .from("consultations")
      .insert([
        {
          date,
          company_id,
          content,
          follow_up_date: follow_up_date || null,
          user_id,
          title: title || null,
          contact_method: contact_method || "email",
        },
      ])
      .select("*")
      .single();

    if (insertError || !insertedConsultation) {
      throw new Error("상담 내역 추가 실패");
    }

    // 감사 로그 기록
    await logConsultationOperation(
      "INSERT",
      insertedConsultation.id,
      null,
      insertedConsultation as Record<string, unknown>,
      user_id
    );

    await logUserActivity({
      userId: user_id,
      action: "상담 등록",
      actionType: "crud",
      targetType: "consultation",
      targetId: insertedConsultation.id,
      targetName: title || content.substring(0, 50),
    });

    logApiCall({
      userId: user_id,
      endpoint: "/api/consultations",
      method: "POST",
      statusCode: 201,
      responseTimeMs: Date.now() - startTime,
      ipAddress: getIpFromRequest(req),
      userAgent: getUserAgentFromRequest(req),
    });

    return NextResponse.json(
      {
        consultation_id: insertedConsultation.id,
        message: "상담 내역 추가 완료",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

/**
 * PATCH /api/consultations
 * 상담 수정
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      consultation_id,
      content,
      follow_up_date,
      user_id,
      contact_id,
      updated_by,
      title,
      contact_method,
    } = body;

    if (!consultation_id || !content || !user_id || !contact_id) {
      return NextResponse.json({ error: "필수 값이 없습니다." }, { status: 400 });
    }

    // 기존 상담 정보 조회
    const { data: oldConsultation } = await supabase
      .from("consultations")
      .select("user_id, follow_up_date, company_id, companies(name)")
      .eq("id", consultation_id)
      .single();

    const oldUserId = oldConsultation?.user_id;
    const oldFollowUpDate = oldConsultation?.follow_up_date;
    const companyName =
      (oldConsultation?.companies as { name?: string } | null)?.name || "거래처";

    // 상담-담당자 업데이트
    const { error: contactUpdateError } = await supabase
      .from("contacts_consultations")
      .update({ contact_id })
      .eq("consultation_id", consultation_id);

    if (contactUpdateError) {
      console.error(
        "[ConsultationUpdate] Contact update error:",
        contactUpdateError
      );
      return NextResponse.json(
        { error: "담당자 업데이트 실패", details: contactUpdateError.message },
        { status: 500 }
      );
    }

    // 상담 내역 업데이트
    const updateData: Record<string, unknown> = { content, user_id };
    const newFollowUpDate =
      follow_up_date && follow_up_date.trim() !== "" ? follow_up_date : null;
    updateData.follow_up_date = newFollowUpDate;

    if (title !== undefined) {
      updateData.title = title || null;
    }
    if (contact_method !== undefined) {
      updateData.contact_method = contact_method || "email";
    }

    const { error: consultationUpdateError } = await supabase
      .from("consultations")
      .update(updateData)
      .eq("id", consultation_id);

    if (consultationUpdateError) {
      console.error(
        "[ConsultationUpdate] Consultation update error:",
        consultationUpdateError
      );
      return NextResponse.json(
        { error: "상담 내역 수정 실패", details: consultationUpdateError.message },
        { status: 500 }
      );
    }

    // 알림 전송
    if (oldUserId && user_id !== oldUserId) {
      let updaterName = "누군가";
      if (updated_by) {
        const { data: updater } = await supabase
          .from("users")
          .select("name")
          .eq("id", updated_by)
          .single();
        updaterName = updater?.name || "누군가";
      }

      await createNotification(
        user_id,
        "consultation_followup",
        "상담 배정",
        `${updaterName}님이 "${companyName}" 상담을 회원님에게 배정했습니다.`,
        consultation_id,
        "consultation"
      );
    }

    if (newFollowUpDate && newFollowUpDate !== oldFollowUpDate) {
      if (updated_by && updated_by !== user_id) {
        const { data: updater } = await supabase
          .from("users")
          .select("name")
          .eq("id", updated_by)
          .single();

        await createNotification(
          user_id,
          "consultation_followup",
          "후속조치 날짜 설정",
          `${updater?.name || "누군가"}님이 "${companyName}" 상담의 후속조치 날짜를 ${newFollowUpDate}로 설정했습니다.`,
          consultation_id,
          "consultation"
        );
      }
    }

    // 감사 로그 및 활동 로그 기록
    const changedBy = updated_by || user_id;
    await logConsultationOperation(
      "UPDATE",
      consultation_id,
      oldConsultation as Record<string, unknown>,
      updateData,
      changedBy
    );

    await logUserActivity({
      userId: changedBy,
      action: "상담 수정",
      actionType: "crud",
      targetType: "consultation",
      targetId: consultation_id,
      targetName: title || companyName,
    });

    return NextResponse.json({ message: "상담 내역 수정 완료" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}
