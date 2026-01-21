import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { logPostOperation } from "@/lib/postLogger";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");
  const category_id = searchParams.get("category_id");
  const category_name = searchParams.get("category"); // 카테고리 이름으로도 필터링 가능
  const search = searchParams.get("search");
  const user_id = searchParams.get("user_id");
  const is_pinned = searchParams.get("is_pinned");
  const sortBy = searchParams.get("sort_by") || "created_at";
  const order = searchParams.get("order") || "desc";

  // 카테고리 이름으로 ID 조회
  let resolvedCategoryId = category_id;
  if (!category_id && category_name) {
    const { data: categoryData } = await supabase
      .from("post_categories")
      .select("id")
      .eq("name", category_name)
      .single();
    resolvedCategoryId = categoryData?.id || null;
  }

  let query = supabase
    .from("posts")
    .select(
      `
      *,
      user:users!posts_user_id_fkey(id, name, level),
      category:post_categories!posts_category_id_fkey(id, name),
      post_comments(count)
    `,
      { count: "exact" }
    )
    .is("deleted_at", null); // 삭제되지 않은 게시글만 조회

  if (resolvedCategoryId) {
    query = query.eq("category_id", resolvedCategoryId);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  if (user_id) {
    query = query.eq("user_id", user_id);
  }

  if (is_pinned === "true") {
    query = query.eq("is_pinned", true);
  }

  // 고정글 우선, 그 다음 정렬 기준
  query = query
    .order("is_pinned", { ascending: false })
    .order(sortBy, { ascending: order === "asc" });

  query = query.range(offset, offset + limit - 1);

  const { data: posts, count, error } = await query;

  if (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 댓글 수 변환 (JOIN으로 가져온 데이터에서 추출)
  const postsWithCommentCount = (posts || []).map((post) => {
    const commentsData = post.post_comments as { count: number }[] | null;
    const commentsCount = commentsData?.[0]?.count ?? 0;

    // post_comments 필드 제거하고 comments_count로 변환
    const { post_comments, ...postData } = post;
    return {
      ...postData,
      comments_count: commentsCount,
    };
  });

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / limit);

  return NextResponse.json({
    posts: postsWithCommentCount,
    total: totalCount,
    page: Math.floor(offset / limit) + 1,
    limit,
    totalPages,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      category_id,
      consultation_id,
      document_id,
      title,
      content,
      is_pinned,
    } = body;

    if (!user_id || !title || !content) {
      return NextResponse.json(
        { error: "필수 필드(user_id, title, content)가 누락되었습니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          user_id,
          category_id: category_id || null,
          consultation_id: consultation_id || null,
          document_id: document_id || null,
          title,
          content,
          is_pinned: is_pinned || false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating post:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 로깅
    await logPostOperation(
      "INSERT",
      data.id,
      null,
      data as Record<string, unknown>,
      user_id
    );

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}
