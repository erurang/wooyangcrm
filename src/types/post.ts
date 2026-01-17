// 게시판 관련 타입 정의

/**
 * 참조 타입
 */
export type ReferenceType = "company" | "consultation" | "document";

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
  deleted_at?: string; // 소프트 삭제 시간
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
 * 댓글 첨부파일
 */
export interface CommentFile {
  id: string;
  name: string;
  url: string;
  filePath: string;
  user_id: string;
}

/**
 * 댓글 참조 (간단한 형태)
 */
export interface SimpleCommentReference {
  id: string;
  reference_type: ReferenceType;
  reference_id: string;
  reference_name?: string;
}

/**
 * 게시글 댓글
 */
export interface PostComment {
  id: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string; // 블라인드 처리 시간 (삭제된 댓글)
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  user: { id: string; name: string; level?: string };
  files?: CommentFile[];
  references?: SimpleCommentReference[];
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
  references?: CreateReferenceData[];
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
  references?: CreateReferenceData[];
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
  category?: string; // 카테고리 이름으로 필터링
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

/**
 * 게시글/댓글 참조
 */
export interface PostReference {
  id: string;
  created_at: string;
  post_id: string;
  reference_type: ReferenceType;
  reference_id: string;
  reference_name?: string;
}

/**
 * 참조 생성 데이터
 */
export interface CreateReferenceData {
  reference_type: ReferenceType;
  reference_id: string;
  reference_name?: string;
}

/**
 * 참조 검색 결과 아이템
 */
export interface ReferenceSearchItem {
  id: string;
  name: string;
  type: ReferenceType;
  // 추가 정보 (UI 표시용)
  subtext?: string;
}

/**
 * 참조가 포함된 게시글
 */
export interface PostWithReferences extends PostWithAuthor {
  references: PostReference[];
}

/**
 * 댓글 참조
 */
export interface CommentReference {
  id: string;
  created_at: string;
  comment_id: string;
  reference_type: ReferenceType;
  reference_id: string;
  reference_name?: string;
}

/**
 * 참조가 포함된 댓글
 */
export interface PostCommentWithReferences extends PostComment {
  references?: CommentReference[];
}

/**
 * 게시글 버전 히스토리
 */
export interface PostVersion {
  id: string;
  post_id: string;
  version_number: number;
  title: string;
  content: string;
  category_id?: string;
  edited_by: string;
  edited_at: string;
  user?: { id: string; name: string; level?: string };
}

/**
 * 게시글 조회자
 */
export interface PostViewer {
  id: string;
  user_id: string;
  viewed_at: string;
  user: { id: string; name: string; level?: string };
}

/**
 * 게시글 유저 태그 (참조/공동작성)
 */
export interface PostUserTag {
  id: string;
  created_at: string;
  post_id: string;
  user_id: string;
  tag_type: "reference" | "coauthor"; // 참조 or 공동작성
  user?: { id: string; name: string; level?: string };
}

/**
 * 유저 태그 생성 데이터
 */
export interface CreateUserTagData {
  user_id: string;
  tag_type: "reference" | "coauthor";
}
