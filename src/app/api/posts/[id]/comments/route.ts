import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  const { data: comments, error } = await supabase
    .from("post_comments")
    .select(
      `
      *,
      user:users!post_comments_user_id_fkey(id, name, level)
    `
    )
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 댓글 파일 및 참조 조회
  const commentIds = (comments || []).map((c) => c.id);
  if (commentIds.length > 0) {
    // 파일 조회
    const { data: files } = await supabase
      .from("post_comment_files")
      .select("*")
      .in("comment_id", commentIds);

    // 참조 조회
    const { data: references } = await supabase
      .from("comment_references")
      .select("*")
      .in("comment_id", commentIds);

    // Signed URL 생성 및 파일 결합
    const filesWithUrls = await Promise.all(
      (files || []).map(async (file) => {
        const { data: urlData } = await supabase.storage
          .from("post_files")
          .createSignedUrl(file.file_url, 3600);
        return {
          ...file,
          url: urlData?.signedUrl || "",
        };
      })
    );

    // 댓글에 파일과 참조 추가
    const commentsWithData = (comments || []).map((comment) => ({
      ...comment,
      files: filesWithUrls
        .filter((f) => f.comment_id === comment.id)
        .map((f) => ({
          id: f.id,
          name: f.file_name,
          url: f.url,
          filePath: f.file_url,
          user_id: f.user_id,
        })),
      references: (references || [])
        .filter((r) => r.comment_id === comment.id)
        .map((r) => ({
          id: r.id,
          reference_type: r.reference_type,
          reference_id: r.reference_id,
          reference_name: r.reference_name,
        })),
    }));

    return NextResponse.json(commentsWithData);
  }

  return NextResponse.json(comments || []);
}

// @멘션 파싱 함수 (이름으로 사용자 ID 찾기)
async function parseMentions(content: string): Promise<string[]> {
  const mentionRegex = /@([^\s@]+)/g;
  const matches = content.match(mentionRegex);
  if (!matches) return [];

  const names = matches.map((m) => m.slice(1)); // @ 제거
  const uniqueNames = [...new Set(names)];

  const { data: users } = await supabase
    .from("users")
    .select("id")
    .in("name", uniqueNames);

  return users?.map((u) => u.id) || [];
}

// 알림 생성 함수
async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedId: string,
  relatedType: string
) {
  console.log("Creating notification:", { userId, type, title, message, relatedId, relatedType });

  const { data, error } = await supabase.from("notifications").insert([
    {
      user_id: userId,
      type,
      title,
      message,
      related_id: relatedId,
      related_type: relatedType,
      read: false,
    },
  ]).select();

  if (error) {
    console.error("Failed to create notification:", error);
  } else {
    console.log("Notification created successfully:", data);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { user_id, content, parent_id } = body;

    if (!user_id || !content) {
      return NextResponse.json(
        { error: "필수 필드(user_id, content)가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 댓글 작성자 정보 조회
    const { data: commenter } = await supabase
      .from("users")
      .select("name")
      .eq("id", user_id)
      .single();

    // 댓글 생성
    const { data, error } = await supabase
      .from("post_comments")
      .insert([
        {
          post_id: id,
          user_id,
          content,
          parent_id: parent_id || null,
        },
      ])
      .select(
        `
        *,
        user:users!post_comments_user_id_fkey(id, name, level)
      `
      )
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 게시글 작성자에게 알림 (본인 댓글이 아닌 경우)
    const { data: post } = await supabase
      .from("posts")
      .select("user_id, title")
      .eq("id", id)
      .single();

    if (post && post.user_id !== user_id) {
      await createNotification(
        post.user_id,
        "post_comment",
        "새 댓글",
        `${commenter?.name || "누군가"}님이 "${post.title}" 게시글에 댓글을 남겼습니다.`,
        id,
        "post"
      );
    }

    // @멘션된 사용자들에게 알림
    const mentionedUserIds = await parseMentions(content);
    for (const mentionedUserId of mentionedUserIds) {
      // 본인과 게시글 작성자(이미 알림 받음) 제외
      if (mentionedUserId !== user_id && mentionedUserId !== post?.user_id) {
        await createNotification(
          mentionedUserId,
          "post_mention",
          "멘션됨",
          `${commenter?.name || "누군가"}님이 댓글에서 회원님을 언급했습니다.`,
          id,
          "post"
        );
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}
