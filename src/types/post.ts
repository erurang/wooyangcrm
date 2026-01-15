// 게시판 관련 타입 정의

/**
 * 게시글 카테고리
 */
export interface PostCategory {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
}

/**
 * 기본 게시글
 */
export interface Post {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  category_id?: string;
  consultation_id?: string;
  document_id?: string;
  title: string;
  content: string;
  view_count: number;
  is_pinned: boolean;
}

/**
 * 작성자 정보가 포함된 게시글
 */
export interface PostWithAuthor extends Post {
  user: { id: string; name: string; level?: string };
  category?: { id: string; name: string };
  comments_count: number;
}

/**
 * 게시글 댓글
 */
export interface PostComment {
  id: string;
  created_at: string;
  updated_at?: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  user: { id: string; name: string; level?: string };
}

/**
 * 게시글 첨부파일
 */
export interface PostFile {
  id: string;
  created_at: string;
  post_id: string;
  user_id?: string;
  file_url: string;
  file_name: string;
}

/**
 * 게시글 생성 데이터
 */
export interface CreatePostData {
  user_id: string;
  category_id?: string;
  consultation_id?: string;
  document_id?: string;
  title: string;
  content: string;
  is_pinned?: boolean;
}

/**
 * 게시글 수정 데이터
 */
export interface UpdatePostData {
  category_id?: string;
  consultation_id?: string;
  document_id?: string;
  title?: string;
  content?: string;
  is_pinned?: boolean;
}

/**
 * 댓글 생성 데이터
 */
export interface CreateCommentData {
  user_id: string;
  content: string;
  parent_id?: string;
}

/**
 * 게시글 목록 필터
 */
export interface PostListFilter {
  category_id?: string;
  search?: string;
  user_id?: string;
  is_pinned?: boolean;
  page?: number;
  limit?: number;
}

/**
 * 페이지네이션 응답
 */
export interface PostListResponse {
  posts: PostWithAuthor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
