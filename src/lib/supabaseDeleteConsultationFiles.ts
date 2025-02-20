import { supabase } from "@/lib/supabaseClient";

export const supabaseDeleteConsultationFiles = async (
  fileId: string, // ✅ 파일 ID로 삭제
  filePath: string // ✅ 파일 경로로 스토리지에서 삭제
): Promise<boolean> => {
  try {
    console.log("삭제 요청 파일 ID:", fileId);
    console.log("삭제 요청 파일 경로:", filePath);

    // ✅ Supabase 스토리지에서 파일 삭제
    const { error: storageError } = await supabase.storage
      .from("consultation_files") // ✅ 버킷 이름
      .remove([filePath]); // ✅ 올바른 파일 경로 전달

    if (storageError) {
      console.error("파일 삭제 실패 (스토리지):", storageError.message);
      return false;
    }

    // ✅ Supabase DB에서 파일 삭제
    const { error: dbError } = await supabase
      .from("consultation_files")
      .delete()
      .eq("id", fileId.toString()); // ✅ ID를 문자열로 변환 후 삭제

    if (dbError) {
      console.error("파일 삭제 실패 (DB):", dbError.message);
      return false;
    }

    console.log("파일 삭제 성공 (스토리지 & DB):", filePath);
    return true;
  } catch (error) {
    console.error("파일 삭제 중 오류 발생:", error);
    return false;
  }
};
