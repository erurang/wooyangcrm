import { supabase } from "@/lib/supabaseClient";

export const supabasefetchConsultationFiles = async (
  consultationId: string
  // userId: string
) => {
  const { data, error } = await supabase
    .from("consultation_files")
    .select("id, file_url,user_id, file_name ") // ✅ file_url과 id를 가져옴
    .eq("consultation_id", consultationId);
  // .eq("user_id", userId);

  if (error) {
    console.error("❌ 파일 목록 불러오기 실패:", error.message);
    return [];
  }

  // ✅ 파일 경로를 올바르게 가져오고, Signed URL 생성
  const filesWithSignedUrls = await Promise.all(
    data.map(async (file) => {
      // 🔹 file_url이 전체 URL이 아니라 상대 경로라면, 올바르게 처리해야 함
      const filePath = file.file_url.startsWith("consultations/")
        ? file.file_url
        : `consultations/${file.file_url}`;

      // ✅ Signed URL 생성 (10분 유효)
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("consultation_files") // ✅ 올바른 버킷 이름 확인
          .createSignedUrl(filePath, 60 * 5);

      if (signedUrlError) {
        console.error("❌ Signed URL 생성 실패:", signedUrlError.message);
        return null;
      }

      return {
        id: file.id, // ✅ 고유한 파일 ID 추가
        name: file.file_name || "unknown_file", // ✅ 파일명 추출
        url: signedUrlData.signedUrl, // ✅ Signed URL 반환
        filePath: filePath, // ✅ 원본 파일 경로 저장
        user_id: file.user_id,
      };
    })
  );

  return filesWithSignedUrls.filter(
    (file): file is NonNullable<typeof file> => !!file
  ); // 🔥 `null` 제거 및 타입 보장
};
