import { supabase } from "@/lib/supabaseClient";

const sanitizeFileName = (fileName: string) => {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
};

/**
 * 결재 첨부파일 업로드
 */
export const uploadApprovalFile = async (
  file: File,
  approvalId: string,
  userId: string
): Promise<{ id: string; name: string; path: string } | null> => {
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}_${sanitizeFileName(file.name)}`;
  const filePath = `approvals/${userId}/${approvalId}/${uniqueFileName}`;

  // Supabase 스토리지에 파일 업로드
  const { error: uploadError } = await supabase.storage
    .from("approval_files")
    .upload(filePath, file);

  if (uploadError) {
    console.error("파일 업로드 실패:", uploadError.message);
    return null;
  }

  // DB에 파일 정보 저장
  const { data: insertData, error: dbError } = await supabase
    .from("approval_files")
    .insert([
      {
        request_id: approvalId,
        user_id: userId,
        file_url: filePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      },
    ])
    .select("id, file_name")
    .single();

  if (dbError) {
    console.error("DB 저장 실패:", dbError.message);
    return null;
  }

  return {
    id: insertData.id,
    name: insertData.file_name,
    path: filePath,
  };
};

/**
 * 결재 첨부파일 목록 조회
 */
export const getApprovalFiles = async (approvalId: string) => {
  const { data, error } = await supabase
    .from("approval_files")
    .select(`
      id,
      file_name,
      file_url,
      file_size,
      file_type,
      created_at,
      user:users(id, name)
    `)
    .eq("request_id", approvalId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("파일 목록 조회 실패:", error.message);
    return [];
  }

  return data || [];
};

/**
 * 결재 첨부파일 삭제
 */
export const deleteApprovalFile = async (
  fileId: string,
  filePath: string
): Promise<boolean> => {
  // 스토리지에서 파일 삭제
  const { error: storageError } = await supabase.storage
    .from("approval_files")
    .remove([filePath]);

  if (storageError) {
    console.error("스토리지 파일 삭제 실패:", storageError.message);
  }

  // DB에서 레코드 삭제
  const { error: dbError } = await supabase
    .from("approval_files")
    .delete()
    .eq("id", fileId);

  if (dbError) {
    console.error("DB 레코드 삭제 실패:", dbError.message);
    return false;
  }

  return true;
};

/**
 * 결재 파일 다운로드 URL 가져오기
 */
export const getApprovalFileUrl = async (filePath: string): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from("approval_files")
    .createSignedUrl(filePath, 3600); // 1시간 유효

  if (error) {
    console.error("다운로드 URL 생성 실패:", error.message);
    return null;
  }

  return data.signedUrl;
};
