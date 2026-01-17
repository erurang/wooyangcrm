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
  console.log("=== parseMentions 시작 ===");
  console.log("입력 content:", content);

  const mentionRegex = /@([^\s@]+)/g;
  const matches = content.match(mentionRegex);
  console.log("정규식 매치 결과:", matches);

  if (!matches) {
    console.log("멘션 없음");
    return [];
  }

  const names = matches.map((m) => m.slice(1)); // @ 제거
  const uniqueNames = [...new Set(names)];
  console.log("추출된 이름들:", uniqueNames);

  // 이름으로 사용자 검색 (대소문자 구분 없이, 공백 제거)
  const { data: users, error } = await supabase
    .from("users")
    .select("id, name")
    .in("name", uniqueNames);

  console.log("DB 사용자 검색 결과:", users);
  if (error) {
    console.error("사용자 검색 오류:", error);
  }

  const userIds = users?.map((u) => u.id) || [];
  console.log("반환할 사용자 ID들:", userIds);
  console.log("=== parseMentions 끝 ===");

  return userIds;
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
  console.log("=== createNotification 시작 ===");
  console.log("파라미터:", JSON.stringify({ userId, type, title, message, relatedId, relatedType }, null, 2));

  try {
    const insertData = {
      user_id: userId,
      type,
      title,
      message,
      related_id: relatedId,
      related_type: relatedType,
      read: false,
    };

    const { data, error, status, statusText } = await supabase
      .from("notifications")
      .insert([insertData])
      .select();

    console.log("Insert 결과 - status:", status, "statusText:", statusText);

    if (error) {
      console.error("알림 생성 실패:", JSON.stringify(error, null, 2));
    } else {
      console.log("알림 생성 성공:", JSON.stringify(data, null, 2));
    }
    console.log("=== createNotification 끝 ===");
  } catch (e) {
    console.error("알림 생성 예외:", e);
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

    // 새 댓글 ID (하이라이트용)
    const newCommentId = data.id;

    if (post && post.user_id !== user_id) {
      await createNotification(
        post.user_id,
        "post_comment",
        "새 댓글",
        `${commenter?.name || "누군가"}님이 "${post.title}" 게시글에 댓글을 남겼습니다.`,
        `${id}:${newCommentId}`, // postId:commentId 형식으로 저장 (알림 클릭 시 하이라이트용)
        "post"
      );
    }

    // @멘션된 사용자들에게 알림
    const mentionedUserIds = await parseMentions(content);
    console.log("Parsed mentioned user IDs:", mentionedUserIds, "from content:", content);

    for (const mentionedUserId of mentionedUserIds) {
      // 본인 제외 (멘션된 사용자 모두에게 알림)
      if (mentionedUserId !== user_id) {
        console.log("Creating mention notification for user:", mentionedUserId);
        await createNotification(
          mentionedUserId,
          "post_mention",
          "멘션됨",
          `${commenter?.name || "누군가"}님이 "${post?.title || "게시글"}" 댓글에서 회원님을 언급했습니다.`,
          `${id}:${newCommentId}`, // postId:commentId 형식으로 저장 (알림 클릭 시 하이라이트용)
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
