import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface DocumentItem {
  name: string;
  spec?: string;
  quantity: string | number;
  unit_price: number;
  amount: number;
  unit?: string;
}

interface DocumentDetail {
  id: string;
  type: string;
  documentNumber: string;
  totalAmount: number;
  status: string;
  items: DocumentItem[];
}

interface DailyReportItem {
  no: number;
  companyName: string;
  companyId: string;
  title: string;
  content: string;
  consultationId: string;
  consultationDate: string;
  authorName?: string;
  documents: DocumentDetail[];
  note: string;
}

interface DailyReportData {
  date: string;
  dateEnd?: string;
  dayOfWeek: string;
  author: string;
  authorId: string;
  items: DailyReportItem[];
  viewMode: "daily" | "weekly" | "monthly";
}

/**
 * GET /api/reports/daily - 업무일지 데이터 조회
 * Query params:
 * - date: 시작 날짜 (YYYY-MM-DD)
 * - userId: 사용자 ID
 * - mode: 조회 모드 (daily | weekly | monthly)
 * - allUsers: 전체 사용자 조회 여부 (true면 userId 무시, 관리자용)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const userId = searchParams.get("userId");
  const mode = (searchParams.get("mode") || "daily") as "daily" | "weekly" | "monthly";
  const allUsers = searchParams.get("allUsers") === "true";

  if (!date) {
    return NextResponse.json(
      { error: "date가 필요합니다." },
      { status: 400 }
    );
  }

  if (!allUsers && !userId) {
    return NextResponse.json(
      { error: "userId가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    // 날짜 범위 계산
    const startDate = new Date(date);
    let endDate = new Date(date);
    let dayOfWeekStr = "";

    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

    if (mode === "daily") {
      dayOfWeekStr = dayNames[startDate.getDay()];
    } else if (mode === "weekly") {
      // 주간: 해당 주의 월요일부터 일요일까지
      const dayOfWeek = startDate.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate.setDate(startDate.getDate() + mondayOffset);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      dayOfWeekStr = "주간";
    } else if (mode === "monthly") {
      // 월간: 해당 월의 1일부터 마지막일까지
      startDate.setDate(1);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      dayOfWeekStr = "월간";
    }

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // 1. 사용자 정보 조회 (allUsers가 아닐 때만)
    let authorName = "전체";
    let authorId = "";

    if (!allUsers && userId) {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, name")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        return NextResponse.json(
          { error: "사용자를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      authorName = user.name;
      authorId = user.id;
    }

    // 2. 상담 기록 조회 (회사 정보 및 daily_note 포함)
    let consultQuery = supabase
      .from("consultations")
      .select(`
        id,
        content,
        title,
        company_id,
        date,
        daily_note,
        user_id,
        users!inner (
          id,
          name,
          level,
          team:teams (
            name
          )
        ),
        companies!inner (
          id,
          name
        )
      `)
      .gte("date", startDateStr)
      .lte("date", endDateStr)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true });

    if (!allUsers && userId) {
      consultQuery = consultQuery.eq("user_id", userId);
    }

    const { data: consultations, error: consultError } = await consultQuery;

    if (consultError) {
      console.error("상담 조회 오류:", consultError);
      throw consultError;
    }

    // 3. 해당 기간에 생성된 문서 조회
    let docQuery = supabase
      .from("documents")
      .select(`
        id,
        type,
        consultation_id,
        document_number,
        total_amount,
        status,
        content
      `)
      .gte("created_at", `${startDateStr}T00:00:00`)
      .lt("created_at", `${endDateStr}T23:59:59`);

    if (!allUsers && userId) {
      docQuery = docQuery.eq("user_id", userId);
    }

    const { data: documents, error: docError } = await docQuery;

    if (docError) {
      console.error("문서 조회 오류:", docError);
    }

    // 4. 상담별 문서 정보 매핑
    const documentsByConsultation = new Map<string, DocumentDetail[]>();

    documents?.forEach((doc) => {
      if (doc.consultation_id) {
        const existing = documentsByConsultation.get(doc.consultation_id) || [];
        const content = doc.content as { items?: DocumentItem[] } | null;
        const items = content?.items || [];

        existing.push({
          id: doc.id,
          type: doc.type,
          documentNumber: doc.document_number || "",
          totalAmount: doc.total_amount || 0,
          status: doc.status || "pending",
          items,
        });

        documentsByConsultation.set(doc.consultation_id, existing);
      }
    });

    // 5. 업무일지 항목 생성
    const items: DailyReportItem[] = consultations?.map((consultation, index) => {
      const company = consultation.companies as unknown as { id: string; name: string } | null;
      const user = consultation.users as unknown as {
        id: string;
        name: string;
        level?: string;
        team?: { name: string } | null;
      } | null;

      // 전체 사용자 조회 시 작성자 정보: "팀명 이름 직급" 형식
      let authorInfo: string | undefined;
      if (allUsers && user) {
        const parts = [];
        if (user.team?.name) parts.push(user.team.name);
        parts.push(user.name);
        if (user.level) parts.push(user.level);
        authorInfo = parts.join(" ");
      }

      return {
        no: index + 1,
        companyName: company?.name || "알 수 없음",
        companyId: consultation.company_id,
        title: consultation.title || "",
        content: consultation.content || "",
        consultationId: consultation.id,
        consultationDate: consultation.date || "",
        authorName: authorInfo,
        documents: documentsByConsultation.get(consultation.id) || [],
        note: consultation.daily_note || "",
      };
    }) || [];

    const reportData: DailyReportData = {
      date: startDateStr,
      dateEnd: mode !== "daily" ? endDateStr : undefined,
      dayOfWeek: dayOfWeekStr,
      author: authorName,
      authorId: authorId,
      items,
      viewMode: mode,
    };

    return NextResponse.json(reportData, { status: 200 });
  } catch (error) {
    console.error("업무일지 조회 오류:", error);
    return NextResponse.json(
      { error: "업무일지 데이터를 불러오는 데 실패했습니다." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reports/daily - 상담 비고(daily_note) 수정
 * Body:
 * - consultationId: 상담 ID
 * - note: 비고 내용
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { consultationId, note } = body;

    if (!consultationId) {
      return NextResponse.json(
        { error: "consultationId가 필요합니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("consultations")
      .update({ daily_note: note || "" })
      .eq("id", consultationId);

    if (error) {
      console.error("비고 업데이트 오류:", error);
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("비고 업데이트 오류:", error);
    return NextResponse.json(
      { error: "비고를 저장하는 데 실패했습니다." },
      { status: 500 }
    );
  }
}
