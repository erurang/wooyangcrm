import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 결재 요청 상세 조회
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("approval_requests")
      .select(
        `
        *,
        category:approval_categories!approval_requests_category_id_fkey(id, name, description),
        requester:users!approval_requests_requester_id_fkey(id, name, level, position, email),
        requester_team:teams!approval_requests_requester_team_id_fkey(
          id,
          name,
          department:departments!teams_department_id_fkey(id, name)
        ),
        lines:approval_lines(
          id,
          approver_id,
          approver_team,
          line_type,
          line_order,
          status,
          comment,
          acted_at,
          delegated_to,
          delegated_reason,
          is_required,
          approver:users!approval_lines_approver_id_fkey(id, name, level, position),
          delegated_user:users!approval_lines_delegated_to_fkey(id, name, level, position)
        ),
        files:approval_files(
          id,
          file_name,
          file_url,
          file_size,
          file_type,
          description,
          created_at,
          user:users!approval_files_user_id_fkey(id, name)
        ),
        share_setting:approval_share_settings(id, share_scope),
        shares:approval_shares(
          id,
          user_id,
          share_type,
          user:users!approval_shares_user_id_fkey(id, name)
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching approval request:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "결재 문서를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // lines를 line_order 기준으로 정렬
    const sortedData = {
      ...data,
      lines: (data.lines || []).sort(
        (a: { line_order: number }, b: { line_order: number }) =>
          a.line_order - b.line_order
      ),
    };

    // 히스토리 조회
    const { data: history } = await supabase
      .from("approval_history")
      .select(
        `
        id,
        action,
        action_detail,
        created_at,
        user:users!approval_history_user_id_fkey(id, name)
      `
      )
      .eq("request_id", id)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      ...sortedData,
      history: history || [],
    });
  } catch (error) {
    console.error("Error in GET /api/approvals/[id]:", error);
    return NextResponse.json(
      { error: "Failed to fetch approval request" },
      { status: 500 }
    );
  }
}

/**
 * 결재 요청 수정 (임시저장 또는 반려된 문서만)
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      title,
      content,
      category_id,
      lines,
      files,
      share_scope,
      share_users,
      is_submit, // 임시저장에서 상신으로 변경
      user_id, // 요청자 ID (권한 확인용)
    } = body;

    // 기존 요청 조회
    const { data: existingRequest, error: fetchError } = await supabase
      .from("approval_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: "결재 문서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인: 기안자만 수정 가능
    if (existingRequest.requester_id !== user_id) {
      return NextResponse.json(
        { error: "수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 상태 확인: draft 또는 rejected만 수정 가능
    if (!["draft", "rejected"].includes(existingRequest.status)) {
      return NextResponse.json(
        { error: "진행 중인 문서는 수정할 수 없습니다." },
        { status: 400 }
      );
    }

    // 요청 업데이트
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category_id !== undefined) updateData.category_id = category_id;

    if (is_submit) {
      updateData.status = "pending";
      updateData.submitted_at = new Date().toISOString();
      updateData.current_line_order = 1;
    }

    const { error: updateError } = await supabase
      .from("approval_requests")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      console.error("Error updating approval request:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 결재선 업데이트 (기존 삭제 후 새로 생성)
    if (lines && lines.length > 0) {
      // 기존 결재선 삭제
      await supabase.from("approval_lines").delete().eq("request_id", id);

      // 새 결재선 생성
      const linesData = lines.map(
        (line: {
          approver_id: string;
          approver_team?: string;
          line_type: string;
          line_order: number;
          is_required?: boolean;
        }) => ({
          request_id: id,
          approver_id: line.approver_id,
          approver_team: line.approver_team || null,
          line_type: line.line_type,
          line_order: line.line_order,
          is_required: line.is_required !== false,
          status: "pending",
        })
      );

      await supabase.from("approval_lines").insert(linesData);
    }

    // 첨부파일 업데이트
    if (files !== undefined) {
      // 기존 파일 삭제
      await supabase.from("approval_files").delete().eq("request_id", id);

      // 새 파일 추가
      if (files.length > 0) {
        const filesData = files.map(
          (file: {
            file_name: string;
            file_url: string;
            file_size?: number;
            file_type?: string;
          }) => ({
            request_id: id,
            user_id: user_id,
            file_name: file.file_name,
            file_url: file.file_url,
            file_size: file.file_size || null,
            file_type: file.file_type || null,
          })
        );

        await supabase.from("approval_files").insert(filesData);
      }
    }

    // 공유 설정 업데이트
    if (share_scope !== undefined) {
      await supabase
        .from("approval_share_settings")
        .update({ share_scope })
        .eq("request_id", id);

      // 공유 대상 업데이트
      await supabase.from("approval_shares").delete().eq("request_id", id);

      if (share_scope === "partial" && share_users && share_users.length > 0) {
        const sharesData = share_users.map((userId: string) => ({
          request_id: id,
          user_id: userId,
          share_type: "view",
          shared_by: user_id,
        }));

        await supabase.from("approval_shares").insert(sharesData);
      }
    }

    // 히스토리 기록
    await supabase.from("approval_history").insert({
      request_id: id,
      user_id: user_id,
      action: is_submit ? "submitted" : "updated",
      action_detail: is_submit ? "결재 상신" : "문서 수정",
    });

    // 업데이트된 요청 조회
    const { data: updatedRequest } = await supabase
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
          approver:users!approval_lines_approver_id_fkey(id, name, level, position)
        )
      `
      )
      .eq("id", id)
      .single();

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error in PUT /api/approvals/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update approval request" },
      { status: 500 }
    );
  }
}

/**
 * 결재 요청 삭제 (임시저장만)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id가 필요합니다." },
        { status: 400 }
      );
    }

    // 기존 요청 조회
    const { data: existingRequest, error: fetchError } = await supabase
      .from("approval_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: "결재 문서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인
    if (existingRequest.requester_id !== user_id) {
      return NextResponse.json(
        { error: "삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 상태 확인: draft만 삭제 가능
    if (existingRequest.status !== "draft") {
      return NextResponse.json(
        { error: "임시저장 문서만 삭제할 수 있습니다." },
        { status: 400 }
      );
    }

    // 관련 데이터 삭제 (CASCADE로 처리되지만 명시적으로)
    await supabase.from("approval_lines").delete().eq("request_id", id);
    await supabase.from("approval_files").delete().eq("request_id", id);
    await supabase.from("approval_shares").delete().eq("request_id", id);
    await supabase.from("approval_share_settings").delete().eq("request_id", id);
    await supabase.from("approval_history").delete().eq("request_id", id);

    // 요청 삭제
    const { error: deleteError } = await supabase
      .from("approval_requests")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting approval request:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "삭제되었습니다." });
  } catch (error) {
    console.error("Error in DELETE /api/approvals/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete approval request" },
      { status: 500 }
    );
  }
}
