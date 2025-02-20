import { supabase } from "@/lib/supabaseClient";

const sanitizeFileName = (fileName: string) => {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
};

export const supabaseUploadFile = async (
  file: File,
  consultationId: string,
  userId: string
) => {
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}_${sanitizeFileName(file.name)}`;
  const filePath = `consultations/${userId}/${consultationId}/${uniqueFileName}`;

  // ✅ Supabase 스토리지에 파일 업로드
  const { data, error } = await supabase.storage
    .from("consultation_files")
    .upload(filePath, file);

  if (error) {
    console.error("파일 업로드 실패:", error.message);
    return null;
  }

  // ✅ Supabase DB에 파일 정보 저장 (file_name 추가)
  const { data: insertData, error: dbError } = await supabase
    .from("consultation_files")
    .insert([
      {
        consultation_id: consultationId,
        user_id: userId,
        file_url: filePath, // 🔹 파일 경로 저장
        file_name: file.name, // 🔹 원래 파일명 저장
      },
    ])
    .select("id, file_name")
    .single();

  if (dbError) {
    console.error("DB 저장 실패:", dbError.message);
    return null;
  }

  console.log("id", insertData);

  return {
    id: insertData.id, // ✅ id 반환
    name: insertData.file_name, // ✅ 저장된 파일명 반환
    path: filePath, // ✅ 파일 경로 반환
  };
};
