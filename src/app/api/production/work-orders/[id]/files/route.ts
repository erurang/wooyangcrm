import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 작업지시 첨부파일 목록 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("work_order_files")
      .select(`
        *,
        user:users!work_order_files_user_id_fkey(id, name)
      `)
      .eq("work_order_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 파일 URL 생성
    const filesWithUrls = await Promise.all(
      (data || []).map(async (file) => {
        const { data: urlData } = supabase.storage
          .from("work_order_files")
          .getPublicUrl(file.file_url);

        return {
          ...file,
          public_url: urlData?.publicUrl || null,
        };
      })
    );

    return NextResponse.json({ files: filesWithUrls });
  } catch (error) {
    console.error("파일 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "파일 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 파일 정보 등록 (업로드는 클라이언트에서 Supabase Storage로 직접)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { file_url, file_name, file_size, user_id } = body;

    if (!file_url || !file_name || !user_id) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("work_order_files")
      .insert([
        {
          work_order_id: id,
          user_id,
          file_url,
          file_name,
          file_size: file_size || null,
        },
      ])
      .select(`
        *,
        user:users!work_order_files_user_id_fkey(id, name)
      `)
      .single();

    if (error) throw error;

    // 활동 로그 기록
    const { data: user } = await supabase
      .from("users")
      .select("name")
      .eq("id", user_id)
      .single();

    const uploaderName = user?.name || "사용자";

    await supabase.from("work_order_logs").insert([
      {
        work_order_id: id,
        user_id,
        action: "file_added",
        new_data: { file_name, file_url },
        description: `${uploaderName}님이 파일 첨부: ${file_name}`,
      },
    ]);

    // 파일 업로드 알림 발송 (지시자 + 담당자들에게)
    const { data: workOrder } = await supabase
      .from("work_orders")
      .select(`
        title,
        requester_id,
        assignees:work_order_assignees(user_id)
      `)
      .eq("id", id)
      .single();

    if (workOrder) {
      const notificationTargets = new Set<string>();

      // 지시자 추가 (업로더 제외)
      if (workOrder.requester_id && workOrder.requester_id !== user_id) {
        notificationTargets.add(workOrder.requester_id);
      }

      // 담당자들 추가 (업로더 제외)
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
        const notifications = Array.from(notificationTargets).map((targetUserId) => ({
          user_id: targetUserId,
          type: "work_order_file",
          title: "작업지시 파일 추가",
          message: `${uploaderName}님이 "${workOrder.title}" 작업지시에 파일을 추가했습니다.\n• 파일명: ${file_name}`,
          related_id: id,
          related_type: "work_order",
          read: false,
        }));

        await supabase.from("notifications").insert(notifications);
      }
    }

    // 파일 URL 생성
    const { data: urlData } = supabase.storage
      .from("work_order_files")
      .getPublicUrl(file_url);

    return NextResponse.json({
      message: "파일이 등록되었습니다",
      file: {
        ...data,
        public_url: urlData?.publicUrl || null,
      },
    });
  } catch (error) {
    console.error("파일 등록 오류:", error);
    return NextResponse.json(
      { error: "파일 등록 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 파일 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("file_id");
    const userId = searchParams.get("user_id");

    if (!fileId) {
      return NextResponse.json(
        { error: "파일 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 파일 정보 조회
    const { data: file } = await supabase
      .from("work_order_files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (!file) {
      return NextResponse.json(
        { error: "파일을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Storage에서 파일 삭제
    await supabase.storage.from("work_order_files").remove([file.file_url]);

    // DB에서 파일 정보 삭제
    const { error } = await supabase
      .from("work_order_files")
      .delete()
      .eq("id", fileId);

    if (error) throw error;

    // 활동 로그 기록
    if (userId) {
      const { data: user } = await supabase
        .from("users")
        .select("name")
        .eq("id", userId)
        .single();

      await supabase.from("work_order_logs").insert([
        {
          work_order_id: id,
          user_id: userId,
          action: "file_removed",
          old_data: { file_name: file.file_name, file_url: file.file_url },
          description: `${user?.name || "사용자"}님이 파일 삭제: ${file.file_name}`,
        },
      ]);
    }

    return NextResponse.json({ message: "파일이 삭제되었습니다" });
  } catch (error) {
    console.error("파일 삭제 오류:", error);
    return NextResponse.json(
      { error: "파일 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
