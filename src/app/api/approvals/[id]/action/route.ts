import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import {
  notifyApprovalApproved,
  notifyApprovalRejected,
  notifyApprovalDelegated,
  notifyApprovalWithdrawn,
} from "@/lib/notifications";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 결재 액션 처리 (승인/반려/위임/회수)
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      action, // approve, reject, delegate, withdraw
      user_id, // 액션 수행자
      comment, // 결재 의견
      delegated_to, // 위임 대상 (위임 시)
      delegated_reason, // 위임 사유
    } = body;

    if (!action || !user_id) {
      return NextResponse.json(
        { error: "action과 user_id가 필요합니다." },
        { status: 400 }
      );
    }

    // 결재 요청 조회
    const { data: request, error: requestError } = await supabase
      .from("approval_requests")
      .select(
        `
        *,
        requester_id,
        title,
        lines:approval_lines(
          id,
          approver_id,
          line_type,
          line_order,
          status,
          is_required,
          delegated_to
        )
      `
      )
      .eq("id", id)
      .single();

    if (requestError || !request) {
      return NextResponse.json(
        { error: "결재 문서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 액션별 처리
    switch (action) {
      case "approve":
        return handleApprove(id, request, user_id, comment);

      case "reject":
        return handleReject(id, request, user_id, comment);

      case "delegate":
        if (!delegated_to) {
          return NextResponse.json(
            { error: "위임 대상(delegated_to)이 필요합니다." },
            { status: 400 }
          );
        }
        return handleDelegate(
          id,
          request,
          user_id,
          delegated_to,
          delegated_reason
        );

      case "withdraw":
        return handleWithdraw(id, request, user_id);

      default:
        return NextResponse.json(
          { error: "유효하지 않은 action입니다." },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in POST /api/approvals/[id]/action:", error);
    return NextResponse.json(
      { error: "Failed to process approval action" },
      { status: 500 }
    );
  }
}

/**
 * 승인 처리
 */
async function handleApprove(
  requestId: string,
  request: {
    status: string;
    current_line_order: number;
    requester_id?: string;
    title?: string;
    lines: Array<{
      id: string;
      approver_id: string;
      line_type: string;
      line_order: number;
      status: string;
      is_required: boolean;
      delegated_to?: string;
    }>;
  },
  userId: string,
  comment?: string
) {
  // 상태 확인
  if (request.status !== "pending") {
    return NextResponse.json(
      { error: "진행 중인 결재만 승인할 수 있습니다." },
      { status: 400 }
    );
  }

  // 현재 결재 순서의 결재선 찾기
  const currentLine = request.lines.find(
    (line) =>
      line.line_order === request.current_line_order &&
      line.status === "pending" &&
      (line.approver_id === userId || line.delegated_to === userId)
  );

  if (!currentLine) {
    return NextResponse.json(
      { error: "결재 권한이 없거나 이미 처리된 결재입니다." },
      { status: 403 }
    );
  }

  // 결재선 상태 업데이트
  const { error: lineUpdateError } = await supabase
    .from("approval_lines")
    .update({
      status: "approved",
      comment: comment || null,
      acted_at: new Date().toISOString(),
    })
    .eq("id", currentLine.id);

  if (lineUpdateError) {
    console.error("Error updating approval line:", lineUpdateError);
    return NextResponse.json({ error: lineUpdateError.message }, { status: 500 });
  }

  // 다음 결재자 확인
  const sortedLines = request.lines.sort((a, b) => a.line_order - b.line_order);
  const nextLine = sortedLines.find(
    (line) =>
      line.line_order > request.current_line_order &&
      line.status === "pending" &&
      line.line_type === "approval" // 결재 타입만 체크 (참조는 건너뜀)
  );

  let requestUpdate: Record<string, unknown> = {};

  if (nextLine) {
    // 다음 결재자로 이동
    requestUpdate = {
      current_line_order: nextLine.line_order,
    };
  } else {
    // 모든 결재 완료 - 최종 승인
    requestUpdate = {
      status: "approved",
      completed_at: new Date().toISOString(),
    };
  }

  const { error: requestUpdateError } = await supabase
    .from("approval_requests")
    .update(requestUpdate)
    .eq("id", requestId);

  if (requestUpdateError) {
    console.error("Error updating approval request:", requestUpdateError);
    return NextResponse.json(
      { error: requestUpdateError.message },
      { status: 500 }
    );
  }

  // 히스토리 기록
  await supabase.from("approval_history").insert({
    request_id: requestId,
    user_id: userId,
    action: nextLine ? "approved" : "approved",
    action_detail: nextLine
      ? `${request.current_line_order}차 결재 승인`
      : "최종 승인",
    new_data: { comment, line_order: request.current_line_order },
  });

  // 알림 발송 (기안자에게)
  if (request.requester_id && request.title) {
    try {
      await notifyApprovalApproved({
        approvalId: requestId,
        requesterId: request.requester_id,
        approverId: userId,
        title: request.title,
        isCompleted: !nextLine,
        comment,
      });
    } catch (notifyError) {
      console.error("알림 발송 오류:", notifyError);
    }
  }

  return NextResponse.json({
    success: true,
    message: nextLine ? "승인되었습니다." : "최종 승인되었습니다.",
    is_final: !nextLine,
  });
}

/**
 * 반려 처리
 */
async function handleReject(
  requestId: string,
  request: {
    status: string;
    current_line_order: number;
    requester_id?: string;
    title?: string;
    lines: Array<{
      id: string;
      approver_id: string;
      line_order: number;
      status: string;
      delegated_to?: string;
    }>;
  },
  userId: string,
  comment?: string
) {
  // 상태 확인
  if (request.status !== "pending") {
    return NextResponse.json(
      { error: "진행 중인 결재만 반려할 수 있습니다." },
      { status: 400 }
    );
  }

  // 반려 시 의견 필수
  if (!comment || comment.trim() === "") {
    return NextResponse.json(
      { error: "반려 사유를 입력해주세요." },
      { status: 400 }
    );
  }

  // 현재 결재자 확인
  const currentLine = request.lines.find(
    (line) =>
      line.line_order === request.current_line_order &&
      line.status === "pending" &&
      (line.approver_id === userId || line.delegated_to === userId)
  );

  if (!currentLine) {
    return NextResponse.json(
      { error: "결재 권한이 없거나 이미 처리된 결재입니다." },
      { status: 403 }
    );
  }

  // 결재선 상태 업데이트
  const { error: lineUpdateError } = await supabase
    .from("approval_lines")
    .update({
      status: "rejected",
      comment: comment,
      acted_at: new Date().toISOString(),
    })
    .eq("id", currentLine.id);

  if (lineUpdateError) {
    console.error("Error updating approval line:", lineUpdateError);
    return NextResponse.json({ error: lineUpdateError.message }, { status: 500 });
  }

  // 요청 상태를 반려로 변경
  const { error: requestUpdateError } = await supabase
    .from("approval_requests")
    .update({
      status: "rejected",
      completed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (requestUpdateError) {
    console.error("Error updating approval request:", requestUpdateError);
    return NextResponse.json(
      { error: requestUpdateError.message },
      { status: 500 }
    );
  }

  // 히스토리 기록
  await supabase.from("approval_history").insert({
    request_id: requestId,
    user_id: userId,
    action: "rejected",
    action_detail: `반려: ${comment}`,
    new_data: { comment, line_order: request.current_line_order },
  });

  // 알림 발송 (기안자에게)
  if (request.requester_id && request.title && comment) {
    try {
      await notifyApprovalRejected({
        approvalId: requestId,
        requesterId: request.requester_id,
        rejecterId: userId,
        title: request.title,
        reason: comment,
      });
    } catch (notifyError) {
      console.error("알림 발송 오류:", notifyError);
    }
  }

  return NextResponse.json({
    success: true,
    message: "반려되었습니다.",
  });
}

/**
 * 위임 처리
 */
async function handleDelegate(
  requestId: string,
  request: {
    status: string;
    current_line_order: number;
    title?: string;
    lines: Array<{
      id: string;
      approver_id: string;
      line_order: number;
      status: string;
      delegated_to?: string;
    }>;
  },
  userId: string,
  delegatedTo: string,
  delegatedReason?: string
) {
  // 상태 확인
  if (request.status !== "pending") {
    return NextResponse.json(
      { error: "진행 중인 결재만 위임할 수 있습니다." },
      { status: 400 }
    );
  }

  // 현재 결재자 확인
  const currentLine = request.lines.find(
    (line) =>
      line.line_order === request.current_line_order &&
      line.status === "pending" &&
      line.approver_id === userId
  );

  if (!currentLine) {
    return NextResponse.json(
      { error: "위임 권한이 없거나 이미 처리된 결재입니다." },
      { status: 403 }
    );
  }

  // 자기 자신에게 위임 불가
  if (delegatedTo === userId) {
    return NextResponse.json(
      { error: "자기 자신에게 위임할 수 없습니다." },
      { status: 400 }
    );
  }

  // 위임 대상 존재 확인
  const { data: delegatedUser, error: userError } = await supabase
    .from("users")
    .select("id, name")
    .eq("id", delegatedTo)
    .single();

  if (userError || !delegatedUser) {
    return NextResponse.json(
      { error: "위임 대상을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 결재선 위임 정보 업데이트
  const { error: lineUpdateError } = await supabase
    .from("approval_lines")
    .update({
      delegated_to: delegatedTo,
      delegated_reason: delegatedReason || null,
    })
    .eq("id", currentLine.id);

  if (lineUpdateError) {
    console.error("Error updating approval line:", lineUpdateError);
    return NextResponse.json({ error: lineUpdateError.message }, { status: 500 });
  }

  // 히스토리 기록
  await supabase.from("approval_history").insert({
    request_id: requestId,
    user_id: userId,
    action: "delegated",
    action_detail: `${delegatedUser.name}에게 위임`,
    new_data: {
      delegated_to: delegatedTo,
      delegated_reason: delegatedReason,
      line_order: request.current_line_order,
    },
  });

  // 알림 발송 (위임받은 자에게)
  if (request.title) {
    try {
      await notifyApprovalDelegated({
        approvalId: requestId,
        delegatedToId: delegatedTo,
        delegatorId: userId,
        title: request.title,
        reason: delegatedReason,
      });
    } catch (notifyError) {
      console.error("알림 발송 오류:", notifyError);
    }
  }

  return NextResponse.json({
    success: true,
    message: `${delegatedUser.name}님에게 위임되었습니다.`,
  });
}

/**
 * 회수 처리 (기안자가 진행 중인 결재 취소)
 */
async function handleWithdraw(
  requestId: string,
  request: {
    status: string;
    requester_id?: string;
    title?: string;
    lines: Array<{
      id: string;
      approver_id: string;
      status: string;
    }>;
  },
  userId: string
) {
  // 상태 확인
  if (request.status !== "pending") {
    return NextResponse.json(
      { error: "진행 중인 결재만 회수할 수 있습니다." },
      { status: 400 }
    );
  }

  // 기안자 확인 (실제로는 requester_id 체크 필요)
  // 여기서는 별도의 requester_id 조회 필요
  const { data: fullRequest } = await supabase
    .from("approval_requests")
    .select("requester_id")
    .eq("id", requestId)
    .single();

  if (fullRequest?.requester_id !== userId) {
    return NextResponse.json(
      { error: "기안자만 회수할 수 있습니다." },
      { status: 403 }
    );
  }

  // 요청 상태를 회수로 변경
  const { error: requestUpdateError } = await supabase
    .from("approval_requests")
    .update({
      status: "withdrawn",
      completed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (requestUpdateError) {
    console.error("Error updating approval request:", requestUpdateError);
    return NextResponse.json(
      { error: requestUpdateError.message },
      { status: 500 }
    );
  }

  // 모든 결재선 상태 초기화
  await supabase
    .from("approval_lines")
    .update({ status: "skipped" })
    .eq("request_id", requestId)
    .eq("status", "pending");

  // 히스토리 기록
  await supabase.from("approval_history").insert({
    request_id: requestId,
    user_id: userId,
    action: "withdrawn",
    action_detail: "결재 회수",
  });

  // 알림 발송 (결재자들에게)
  if (request.title) {
    const approverIds = request.lines
      .filter((line) => line.status === "pending")
      .map((line) => line.approver_id);

    if (approverIds.length > 0) {
      try {
        await notifyApprovalWithdrawn({
          approvalId: requestId,
          approverIds,
          requesterId: userId,
          title: request.title,
        });
      } catch (notifyError) {
        console.error("알림 발송 오류:", notifyError);
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: "회수되었습니다.",
  });
}
