import { supabase } from "@/lib/supabaseClient";

export interface WorkOrderCommentFile {
  id: string;
  comment_id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  created_at: string;
  signedUrl?: string;
}

const sanitizeFileName = (fileName: string) => {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
};

// 작업지시 댓글 파일 업로드
export const uploadWorkOrderCommentFile = async (
  file: File,
  commentId: string,
  userId: string
): Promise<WorkOrderCommentFile | null> => {
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}_${sanitizeFileName(file.name)}`;
  const filePath = `work-order-comments/${userId}/${commentId}/${uniqueFileName}`;

  // Supabase 스토리지에 파일 업로드
  const { error } = await supabase.storage
    .from("work_order_files")
    .upload(filePath, file);

  if (error) {
    console.error("작업지시 댓글 파일 업로드 실패:", error.message);
    return null;
  }

  // DB에 파일 정보 저장
  const { data: insertData, error: dbError } = await supabase
    .from("work_order_comment_files")
    .insert({
      comment_id: commentId,
      user_id: userId,
      file_url: filePath,
      file_name: file.name,
    })
    .select()
    .single();

  if (dbError) {
    console.error("DB 저장 실패:", dbError.message);
    return null;
  }

  // Signed URL 생성
  const { data: urlData } = await supabase.storage
    .from("work_order_files")
    .createSignedUrl(filePath, 3600);

  return {
    ...insertData,
    signedUrl: urlData?.signedUrl || "",
  };
};

// 작업지시 댓글 파일 목록 조회
export const fetchWorkOrderCommentFiles = async (
  commentId: string
): Promise<WorkOrderCommentFile[]> => {
  const { data: files, error } = await supabase
    .from("work_order_comment_files")
    .select("*")
    .eq("comment_id", commentId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("작업지시 댓글 파일 목록 조회 실패:", error.message);
    return [];
  }

  // Signed URL 생성
  const filesWithUrls = await Promise.all(
    (files || []).map(async (file) => {
      const { data: urlData } = await supabase.storage
        .from("work_order_files")
        .createSignedUrl(file.file_url, 3600);

      return {
        ...file,
        signedUrl: urlData?.signedUrl || "",
      };
    })
  );

  return filesWithUrls;
};

// 작업지시 댓글 파일 삭제
export const deleteWorkOrderCommentFile = async (
  fileId: string,
  filePath: string
): Promise<boolean> => {
  // 스토리지에서 삭제
  const { error: storageError } = await supabase.storage
    .from("work_order_files")
    .remove([filePath]);

  if (storageError) {
    console.error("스토리지 파일 삭제 실패:", storageError.message);
    return false;
  }

  // DB에서 삭제
  const { error: dbError } = await supabase
    .from("work_order_comment_files")
    .delete()
    .eq("id", fileId);

  if (dbError) {
    console.error("DB 파일 삭제 실패:", dbError.message);
    return false;
  }

  return true;
};

// 여러 댓글의 파일 한번에 조회
export const fetchFilesForComments = async (
  commentIds: string[]
): Promise<Record<string, WorkOrderCommentFile[]>> => {
  if (commentIds.length === 0) return {};

  const { data: files, error } = await supabase
    .from("work_order_comment_files")
    .select("*")
    .in("comment_id", commentIds)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("댓글 파일 일괄 조회 실패:", error.message);
    return {};
  }

  // 댓글별로 그룹화하고 Signed URL 생성
  const filesByComment: Record<string, WorkOrderCommentFile[]> = {};

  await Promise.all(
    (files || []).map(async (file) => {
      const { data: urlData } = await supabase.storage
        .from("work_order_files")
        .createSignedUrl(file.file_url, 3600);

      const fileWithUrl = {
        ...file,
        signedUrl: urlData?.signedUrl || "",
      };

      if (!filesByComment[file.comment_id]) {
        filesByComment[file.comment_id] = [];
      }
      filesByComment[file.comment_id].push(fileWithUrl);
    })
  );

  return filesByComment;
};
