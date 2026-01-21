import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { notifyApprovalRequest } from "@/lib/notifications";

/**
 * 결재 요청 목록 조회
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");
    const category_id = searchParams.get("category_id");
    const requester_id = searchParams.get("requester_id");
    const approver_id = searchParams.get("approver_id"); // 내가 결재할 문서
    const keyword = searchParams.get("keyword");
    const tab = searchParams.get("tab") || "all"; // all, pending, requested, approved, reference
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    let query = supabase
      .from("approval_requests")
      .select(
        `
        *,
        category:approval_categories!approval_requests_category_id_fkey(id, name),
        requester:users!approval_requests_requester_id_fkey(id, name, level, position),
        requester_team:teams!approval_requests_requester_team_id_fkey(id, name),
        lines:approval_lines(
          id,
          approver_id,
          approver_team,
          line_type,
          line_order,
          status,
          comment,
          acted_at,
          is_required,
          approver:users!approval_lines_approver_id_fkey(id, name, level, position)
        ),
        files:approval_files(id, file_name, file_url, file_size, created_at),
        share_setting:approval_share_settings(id, share_scope)
      `,
        { count: "exact" }
      );

    // 탭별 필터링
    if (tab === "pending" && approver_id) {
      // 내가 결재할 차례인 문서
      const { data: pendingLines } = await supabase
        .from("approval_lines")
        .select("request_id")
        .eq("approver_id", approver_id)
        .eq("status", "pending");

      const pendingRequestIds =
        pendingLines?.map((line) => line.request_id) || [];

      if (pendingRequestIds.length > 0) {
        query = query
          .in("id", pendingRequestIds)
          .eq("status", "pending");
      } else {
        // 결재할 문서 없음
        return NextResponse.json({
          data: [],
          total: 0,
          page: 1,
          limit,
          totalPages: 0,
        });
      }
    } else if (tab === "requested" && requester_id) {
      // 내가 기안한 문서
      query = query.eq("requester_id", requester_id);
    } else if (tab === "approved") {
      // 완료된 문서
      query = query.in("status", ["approved", "rejected"]);
    } else if (tab === "reference" && approver_id) {
      // 참조 문서
      const { data: referenceLines } = await supabase
        .from("approval_lines")
        .select("request_id")
        .eq("approver_id", approver_id)
        .eq("line_type", "reference");

      const referenceRequestIds =
        referenceLines?.map((line) => line.request_id) || [];

      if (referenceRequestIds.length > 0) {
        query = query.in("id", referenceRequestIds);
      } else {
        return NextResponse.json({
          data: [],
          total: 0,
          page: 1,
          limit,
          totalPages: 0,
        });
      }
    }

    // 추가 필터
    if (status && tab === "all") {
      query = query.eq("status", status);
    }

    if (category_id) {
      query = query.eq("category_id", category_id);
    }

    if (keyword) {
      query = query.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`);
    }

    if (start_date) {
      query = query.gte("created_at", start_date);
    }

    if (end_date) {
      query = query.lte("created_at", end_date);
    }

    // 정렬 및 페이지네이션
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error("Error fetching approval requests:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // lines를 line_order 기준으로 정렬
    const sortedData = (data || []).map((request) => ({
      ...request,
      lines: (request.lines || []).sort(
        (a: { line_order: number }, b: { line_order: number }) =>
          a.line_order - b.line_order
      ),
    }));

    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: sortedData,
      total: totalCount,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Error in GET /api/approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch approval requests" },
      { status: 500 }
    );
  }
}

/**
 * 결재 요청 생성
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      category_id,
      title,
      content,
      requester_id,
      requester_team_id,
      requester_department,
      lines,
      files,
      share_scope,
      share_users,
      is_draft, // 임시저장 여부
      related_document_id,
      related_consultation_id,
    } = body;

    // 필수 필드 검증
    if (!category_id || !title || !requester_id) {
      return NextResponse.json(
        { error: "필수 필드(category_id, title, requester_id)가 누락되었습니다." },
        { status: 400 }
      );
    }

    if (!is_draft && (!lines || lines.length === 0)) {
      return NextResponse.json(
        { error: "결재선을 설정해주세요." },
        { status: 400 }
      );
    }

    // 결재 요청 생성
    const { data: request, error: requestError } = await supabase
      .from("approval_requests")
      .insert({
        category_id,
        title,
        content: content || "",
        requester_id,
        requester_team_id: requester_team_id || null,
        requester_department: requester_department || null,
        status: is_draft ? "draft" : "pending",
        current_line_order: 1,
        related_document_id: related_document_id || null,
        related_consultation_id: related_consultation_id || null,
        submitted_at: is_draft ? null : new Date().toISOString(),
      })
      .select()
      .single();

    if (requestError) {
      console.error("Error creating approval request:", requestError);
      return NextResponse.json({ error: requestError.message }, { status: 500 });
    }

    // 결재선 생성
    if (lines && lines.length > 0) {
      const linesData = lines.map(
        (line: {
          approver_id: string;
          approver_team?: string;
          line_type: string;
          line_order: number;
          is_required?: boolean;
        }) => ({
          request_id: request.id,
          approver_id: line.approver_id,
          approver_team: line.approver_team || null,
          line_type: line.line_type,
          line_order: line.line_order,
          is_required: line.is_required !== false,
          status: "pending",
        })
      );

      const { error: linesError } = await supabase
        .from("approval_lines")
        .insert(linesData);

      if (linesError) {
        console.error("Error creating approval lines:", linesError);
        // 롤백: 요청 삭제
        await supabase.from("approval_requests").delete().eq("id", request.id);
        return NextResponse.json({ error: linesError.message }, { status: 500 });
      }
    }

    // 첨부파일 연결 (이미 업로드된 파일 ID 목록)
    if (files && files.length > 0) {
      const filesData = files.map(
        (file: {
          file_name: string;
          file_url: string;
          file_size?: number;
          file_type?: string;
        }) => ({
          request_id: request.id,
          user_id: requester_id,
          file_name: file.file_name,
          file_url: file.file_url,
          file_size: file.file_size || null,
          file_type: file.file_type || null,
        })
      );

      const { error: filesError } = await supabase
        .from("approval_files")
        .insert(filesData);

      if (filesError) {
        console.error("Error creating approval files:", filesError);
      }
    }

    // 공유 설정
    const { error: shareSettingError } = await supabase
      .from("approval_share_settings")
      .insert({
        request_id: request.id,
        share_scope: share_scope || "partial",
      });

    if (shareSettingError) {
      console.error("Error creating share setting:", shareSettingError);
    }

    // 일부 공유 시 공유 대상 추가
    if (share_scope === "partial" && share_users && share_users.length > 0) {
      const sharesData = share_users.map((userId: string) => ({
        request_id: request.id,
        user_id: userId,
        share_type: "view",
        shared_by: requester_id,
      }));

      const { error: sharesError } = await supabase
        .from("approval_shares")
        .insert(sharesData);

      if (sharesError) {
        console.error("Error creating approval shares:", sharesError);
      }
    }

    // 히스토리 기록
    await supabase.from("approval_history").insert({
      request_id: request.id,
      user_id: requester_id,
      action: is_draft ? "created" : "submitted",
      action_detail: is_draft ? "임시저장" : "결재 상신",
      new_data: { title, category_id, lines_count: lines?.length || 0 },
    });

    // 알림 발송 (결재자들에게) - 임시저장이 아닌 경우에만
    if (!is_draft && lines && lines.length > 0) {
      // 카테고리명 조회
      const { data: categoryData } = await supabase
        .from("approval_categories")
        .select("name")
        .eq("id", category_id)
        .single();

      const approverIds = lines
        .filter((line: { line_type: string }) => line.line_type === "approval")
        .map((line: { approver_id: string }) => line.approver_id);

      if (approverIds.length > 0) {
        try {
          await notifyApprovalRequest({
            approvalId: request.id,
            approverIds,
            requesterId: requester_id,
            title,
            categoryName: categoryData?.name || "기타",
          });
        } catch (notifyError) {
          console.error("알림 발송 오류:", notifyError);
        }
      }
    }

    // 생성된 요청 조회 (관계 데이터 포함)
    const { data: createdRequest, error: fetchError } = await supabase
      .from("approval_requests")
      .select(
        `
        *,
        category:approval_categories!approval_requests_category_id_fkey(id, name),
        requester:users!approval_requests_requester_id_fkey(id, name, level, position),
        lines:approval_lines(
          id,
          approver_id,
          line_type,
          line_order,
          status,
          is_required,
          approver:users!approval_lines_approver_id_fkey(id, name, level, position)
        )
      `
      )
      .eq("id", request.id)
      .single();

    if (fetchError) {
      return NextResponse.json(request, { status: 201 });
    }

    return NextResponse.json(createdRequest, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/approvals:", error);
    return NextResponse.json(
      { error: "Failed to create approval request" },
      { status: 500 }
    );
  }
}
