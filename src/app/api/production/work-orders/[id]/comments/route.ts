import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// VAPID 설정 (동적으로 web-push 로드)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@wooyang.com";

// web-push 인스턴스를 lazy하게 가져오기
let webPushInstance: typeof import("web-push") | null = null;

async function getWebPush() {
  if (!vapidPublicKey || !vapidPrivateKey) {
    return null;
  }
  if (!webPushInstance) {
    try {
      webPushInstance = await import("web-push");
      webPushInstance.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    } catch (e) {
      console.error("web-push 로드 실패:", e);
      return null;
    }
  }
  return webPushInstance;
}

/**
 * PWA 푸시 발송 (여러 사용자, notification_id 매핑 지원)
 */
async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  url: string,
  tag: string,
  notificationIdMap?: Map<string, number>
) {
  const webPush = await getWebPush();
  if (!webPush || userIds.length === 0) return;

  try {
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    if (!subscriptions || subscriptions.length === 0) return;

    for (const sub of subscriptions) {
      const notificationId = notificationIdMap?.get(sub.user_id);
      const payload = JSON.stringify({
        title,
        body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        url,
        tag,
        notificationId,
      });

      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
      } catch (err: unknown) {
        const error = err as { statusCode?: number };
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    }
  } catch (e) {
    console.error("푸시 발송 오류:", e);
  }
}

// GET: 댓글 목록 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("work_order_comments")
      .select(`
        *,
        user:users!work_order_comments_user_id_fkey(id, name)
      `)
      .eq("work_order_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ comments: data || [] });
  } catch (error) {
    console.error("댓글 조회 오류:", error);
    return NextResponse.json(
      { error: "댓글 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 댓글 작성
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_id, content } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "댓글 내용을 입력해주세요" },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: "사용자 정보가 필요합니다" },
        { status: 400 }
      );
    }

    // 댓글 저장
    const { data: comment, error } = await supabase
      .from("work_order_comments")
      .insert({
        work_order_id: id,
        user_id,
        content: content.trim(),
      })
      .select(`
        *,
        user:users!work_order_comments_user_id_fkey(id, name)
      `)
      .single();

    if (error) throw error;

    // 작업지시 정보 및 담당자/지시자 조회
    const { data: workOrder } = await supabase
      .from("work_orders")
      .select(`
        title,
        requester_id,
        requester:users!work_orders_requester_id_fkey(id, name),
        assignees:work_order_assignees(user_id)
      `)
      .eq("id", id)
      .single();

    if (workOrder) {
      // 알림 대상: 지시자 + 모든 담당자 (댓글 작성자 제외)
      const notificationTargets = new Set<string>();

      // 지시자 추가
      if (workOrder.requester_id && workOrder.requester_id !== user_id) {
        notificationTargets.add(workOrder.requester_id);
      }

      // 담당자들 추가
      const assignees = workOrder.assignees as { user_id: string }[] | null;
      if (assignees) {
        assignees.forEach((a) => {
          if (a.user_id !== user_id) {
            notificationTargets.add(a.user_id);
          }
        });
      }

      // 알림 발송
      if (notificationTargets.size > 0) {
        const commenterName = comment.user?.name || "알 수 없음";
        const contentPreview = content.trim().length > 50
          ? content.trim().substring(0, 50) + "..."
          : content.trim();

        const notifTitle = "작업지시 새 댓글";
        const notifMessage = `${commenterName}님이 "${workOrder.title}" 작업지시에 댓글을 남겼습니다.\n"${contentPreview}"`;

        const notifications = Array.from(notificationTargets).map((targetUserId) => ({
          user_id: targetUserId,
          type: "work_order_comment",
          title: notifTitle,
          message: notifMessage,
          related_id: id,
          related_type: "work_order",
          read: false,
        }));

        const { data: createdNotifs } = await supabase
          .from("notifications")
          .insert(notifications)
          .select("id, user_id");

        // notification_id 매핑 생성
        const notificationIdMap = new Map<string, number>();
        createdNotifs?.forEach((n) => {
          notificationIdMap.set(n.user_id, n.id);
        });

        // PWA 푸시 발송 (notification_id 포함)
        await sendPushToUsers(
          Array.from(notificationTargets),
          notifTitle,
          notifMessage,
          `/production?view=${id}`,
          "work_order_comment",
          notificationIdMap
        );
      }
    }

    // 활동 로그 기록
    await supabase.from("work_order_logs").insert({
      work_order_id: id,
      user_id,
      action: "comment_added",
      new_data: { comment_id: comment.id, content: content.trim() },
      description: `댓글 작성: "${content.trim().substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
    });

    return NextResponse.json({
      message: "댓글이 작성되었습니다",
      comment,
    });
  } catch (error) {
    console.error("댓글 작성 오류:", error);
    return NextResponse.json(
      { error: "댓글 작성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 댓글 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("comment_id");
    const userId = searchParams.get("user_id");

    if (!commentId) {
      return NextResponse.json(
        { error: "삭제할 댓글 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 댓글 조회 (권한 확인용)
    const { data: comment } = await supabase
      .from("work_order_comments")
      .select("*, user:users!work_order_comments_user_id_fkey(name)")
      .eq("id", commentId)
      .single();

    if (!comment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 본인 댓글만 삭제 가능
    if (comment.user_id !== userId) {
      return NextResponse.json(
        { error: "본인이 작성한 댓글만 삭제할 수 있습니다" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("work_order_comments")
      .delete()
      .eq("id", commentId);

    if (error) throw error;

    // 활동 로그 기록
    await supabase.from("work_order_logs").insert({
      work_order_id: id,
      user_id: userId,
      action: "comment_deleted",
      old_data: { comment_id: commentId, content: comment.content },
      description: `댓글 삭제됨`,
    });

    return NextResponse.json({ message: "댓글이 삭제되었습니다" });
  } catch (error) {
    console.error("댓글 삭제 오류:", error);
    return NextResponse.json(
      { error: "댓글 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH: 댓글 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { comment_id, user_id, content } = body;

    if (!comment_id) {
      return NextResponse.json(
        { error: "수정할 댓글 ID가 필요합니다" },
        { status: 400 }
      );
    }

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "댓글 내용을 입력해주세요" },
        { status: 400 }
      );
    }

    // 댓글 조회 (권한 확인용)
    const { data: existingComment } = await supabase
      .from("work_order_comments")
      .select("*")
      .eq("id", comment_id)
      .single();

    if (!existingComment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 본인 댓글만 수정 가능
    if (existingComment.user_id !== user_id) {
      return NextResponse.json(
        { error: "본인이 작성한 댓글만 수정할 수 있습니다" },
        { status: 403 }
      );
    }

    const { data: comment, error } = await supabase
      .from("work_order_comments")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", comment_id)
      .select(`
        *,
        user:users!work_order_comments_user_id_fkey(id, name)
      `)
      .single();

    if (error) throw error;

    // 활동 로그 기록
    await supabase.from("work_order_logs").insert({
      work_order_id: id,
      user_id,
      action: "comment_edited",
      old_data: { content: existingComment.content },
      new_data: { content: content.trim() },
      description: `댓글 수정됨`,
    });

    return NextResponse.json({
      message: "댓글이 수정되었습니다",
      comment,
    });
  } catch (error) {
    console.error("댓글 수정 오류:", error);
    return NextResponse.json(
      { error: "댓글 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
