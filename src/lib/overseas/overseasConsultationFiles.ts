import { supabase } from "@/lib/supabaseClient";
import { OverseasFileType } from "@/types/overseas";

const sanitizeFileName = (fileName: string) => {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
};

export interface OverseasConsultationFileUploadResult {
  id: string;
  name: string;
  path: string;
  fileType: OverseasFileType;
}

/**
 * 해외상담 파일 업로드
 * description 필드에 file_type 저장
 */
export const uploadOverseasConsultationFile = async (
  file: File,
  consultationId: string,
  userId: string,
  fileType: OverseasFileType
): Promise<OverseasConsultationFileUploadResult | null> => {
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}_${sanitizeFileName(file.name)}`;
  const filePath = `consultations/${userId}/${consultationId}/${uniqueFileName}`;

  // Supabase 스토리지에 파일 업로드
  const { error: uploadError } = await supabase.storage
    .from("consultation_files")
    .upload(filePath, file);

  if (uploadError) {
    console.error("파일 업로드 실패:", uploadError.message);
    return null;
  }

  // DB에 파일 정보 저장 (description에 file_type 저장)
  const { data: insertData, error: dbError } = await supabase
    .from("consultation_files")
    .insert([
      {
        consultation_id: consultationId,
        user_id: userId,
        file_url: filePath,
        file_name: file.name,
        description: fileType, // file_type을 description에 저장
      },
    ])
    .select("id, file_name, description")
    .single();

  if (dbError) {
    console.error("DB 저장 실패:", dbError.message);
    // 업로드된 파일 롤백
    await supabase.storage.from("consultation_files").remove([filePath]);
    return null;
  }

  return {
    id: insertData.id,
    name: insertData.file_name,
    path: filePath,
    fileType: insertData.description as OverseasFileType,
  };
};

export interface OverseasConsultationFileInfo {
  id: string;
  name: string;
  url: string;
  filePath: string;
  fileType: OverseasFileType;
  userId?: string;
}

/**
 * 해외상담 파일 목록 조회 (Signed URL 포함)
 */
export const fetchOverseasConsultationFiles = async (
  consultationId: string
): Promise<OverseasConsultationFileInfo[]> => {
  const { data, error } = await supabase
    .from("consultation_files")
    .select("id, file_url, user_id, file_name, description")
    .eq("consultation_id", consultationId);

  if (error) {
    console.error("파일 목록 불러오기 실패:", error.message);
    return [];
  }

  const filesWithSignedUrls = await Promise.all(
    data.map(async (file) => {
      const filePath = file.file_url.startsWith("consultations/")
        ? file.file_url
        : `consultations/${file.file_url}`;

      // Signed URL 생성 (10분 유효)
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("consultation_files")
          .createSignedUrl(filePath, 60 * 10);

      if (signedUrlError) {
        console.error("Signed URL 생성 실패:", signedUrlError.message);
        return null;
      }

      return {
        id: file.id as string,
        name: (file.file_name || "unknown_file") as string,
        url: signedUrlData.signedUrl,
        filePath: filePath,
        fileType: (file.description as OverseasFileType) || "OTHER",
        userId: file.user_id as string | undefined,
      } as OverseasConsultationFileInfo;
    })
  );

  return filesWithSignedUrls.filter(
    (file): file is OverseasConsultationFileInfo => file !== null
  );
};

/**
 * 해외상담 파일 삭제
 */
export const deleteOverseasConsultationFile = async (
  fileId: string
): Promise<boolean> => {
  // 먼저 파일 정보 조회
  const { data: file, error: fetchError } = await supabase
    .from("consultation_files")
    .select("file_url")
    .eq("id", fileId)
    .single();

  if (fetchError || !file) {
    console.error("파일 정보 조회 실패:", fetchError?.message);
    return false;
  }

  // 스토리지에서 파일 삭제
  const { error: storageError } = await supabase.storage
    .from("consultation_files")
    .remove([file.file_url]);

  if (storageError) {
    console.error("스토리지 파일 삭제 실패:", storageError.message);
  }

  // DB에서 레코드 삭제
  const { error: dbError } = await supabase
    .from("consultation_files")
    .delete()
    .eq("id", fileId);

  if (dbError) {
    console.error("DB 레코드 삭제 실패:", dbError.message);
    return false;
  }

  return true;
};
