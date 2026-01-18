import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { logApiCall, getIpFromRequest, getUserAgentFromRequest } from "@/lib/apiLogger";

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(req.url);

  // 페이지네이션 관련 파라미터
  const limit = parseInt(searchParams.get("limit") || "10"); // 한 페이지당 데이터 수 (기본값: 10)
  const offset = parseInt(searchParams.get("offset") || "0"); // 시작 위치 (기본값: 0)

  // 검색 및 필터링 조건
  const keyword = searchParams.get("keyword"); // 검색 키워드
  const status = searchParams.get("status"); // 상태 필터
  const startDate = searchParams.get("start_date"); // 시작 날짜
  const endDate = searchParams.get("end_date"); // 종료 날짜

  // 정렬 조건
  const sortBy = searchParams.get("sort_by") || "created_at"; // 정렬 기준 (기본값: created_at)
  const order = searchParams.get("order") || "desc"; // 정렬 순서 (기본값: 내림차순)

  let query = supabase.from("consultations").select("*", { count: "exact" }); // 전체 개수 포함

  // 검색 조건 추가
  if (keyword) {
    query = query.ilike("content", `%${keyword}%`); // content 필드에서 키워드 검색
  }

  // 상태 필터 추가
  if (status) {
    query = query.eq("status", status);
  }

  // 날짜 범위 필터 추가
  if (startDate && endDate) {
    query = query.gte("date", startDate).lte("date", endDate);
  }

  // 정렬 추가
  query = query.order(sortBy, { ascending: order === "asc" });

  // 페이지네이션 추가
  query = query.range(offset, offset + limit - 1);

  // 쿼리 실행
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

  return NextResponse.json(
    {
      data, // 현재 페이지의 데이터
      totalCount: count, // 전체 데이터 개수
      totalPages, // 전체 페이지 수 계산
      limit, // 한 페이지당 데이터 수
      offset, // 현재 페이지 시작 위치
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { company_id, contact_id, user_id, date, content, status, priority } =
      body;

    // 필수 필드 검증
    if (!company_id || !contact_id || !user_id || !date || !content) {
      logApiCall({
        userId: user_id || null,
        endpoint: "/api/consultations",
        method: "POST",
        statusCode: 400,
        responseTimeMs: Date.now() - startTime,
        ipAddress: getIpFromRequest(req),
        userAgent: getUserAgentFromRequest(req),
        errorMessage: "필수 필드 누락",
      });
      return NextResponse.json(
        {
          error:
            "필수 필드(company_id, contact_id, user_id, date, content)가 누락되었습니다.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("consultations")
      .insert([
        { company_id, contact_id, user_id, date, content, status, priority },
      ]);

    if (error) {
      logApiCall({
        userId: user_id,
        endpoint: "/api/consultations",
        method: "POST",
        statusCode: 500,
        responseTimeMs: Date.now() - startTime,
        ipAddress: getIpFromRequest(req),
        userAgent: getUserAgentFromRequest(req),
        errorMessage: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logApiCall({
      userId: user_id,
      endpoint: "/api/consultations",
      method: "POST",
      statusCode: 201,
      responseTimeMs: Date.now() - startTime,
      ipAddress: getIpFromRequest(req),
      userAgent: getUserAgentFromRequest(req),
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    logApiCall({
      endpoint: "/api/consultations",
      method: "POST",
      statusCode: 400,
      responseTimeMs: Date.now() - startTime,
      ipAddress: getIpFromRequest(req),
      userAgent: getUserAgentFromRequest(req),
      errorMessage: "Invalid request body",
    });
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}
