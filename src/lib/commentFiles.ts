import { supabase } from "@/lib/supabaseClient";

const sanitizeFileName = (fileName: string) => {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
};

// 댓글 파일 업로드
export const uploadCommentFile = async (
  file: File,
  commentId: string,
  userId: string
) => {
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}_${sanitizeFileName(file.name)}`;
  const filePath = `comments/${userId}/${commentId}/${uniqueFileName}`;

  // Supabase 스토리지에 파일 업로드
  const { error } = await supabase.storage
    .from("post_files")
    .upload(filePath, file);

  if (error) {
    console.error("댓글 파일 업로드 실패:", error.message);
    return null;
  }

  // DB에 파일 정보 저장
  const { data: insertData, error: dbError } = await supabase
    .from("post_comment_files")
    .insert([
      {
        comment_id: commentId,
        user_id: userId,
        file_url: filePath,
        file_name: file.name,
      },
    ])
    .select("id, file_name, file_url")
    .single();

  if (dbError) {
    console.error("DB 저장 실패:", dbError.message);
    return null;
  }

  // Signed URL 생성
  const { data: urlData } = await supabase.storage
    .from("post_files")
    .createSignedUrl(filePath, 3600);

  return {
    id: insertData.id,
    name: insertData.file_name,
    path: filePath,
    url: urlData?.signedUrl || "",
  };
};

// 댓글 파일 목록 조회
export const fetchCommentFiles = async (commentId: string) => {
  const { data: files, error } = await supabase
    .from("post_comment_files")
    .select("*")
    .eq("comment_id", commentId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("댓글 파일 목록 조회 실패:", error.message);
    return [];
  }

  // Signed URL 생성
  const filesWithUrls = await Promise.all(
    (files || []).map(async (file) => {
      const { data: urlData } = await supabase.storage
        .from("post_files")
        .createSignedUrl(file.file_url, 3600);

      return {
        id: file.id,
        name: file.file_name,
        filePath: file.file_url,
        url: urlData?.signedUrl || "",
        user_id: file.user_id,
      };
    })
  );

  return filesWithUrls;
};

// 댓글 파일 삭제
export const deleteCommentFile = async (fileId: string, filePath: string) => {
  // 스토리지에서 삭제
  const { error: storageError } = await supabase.storage
    .from("post_files")
    .remove([filePath]);

  if (storageError) {
    console.error("스토리지 파일 삭제 실패:", storageError.message);
    return false;
  }

  // DB에서 삭제
  const { error: dbError } = await supabase
    .from("post_comment_files")
    .delete()
    .eq("id", fileId);

  if (dbError) {
    console.error("DB 파일 삭제 실패:", dbError.message);
    return false;
  }

  return true;
};
