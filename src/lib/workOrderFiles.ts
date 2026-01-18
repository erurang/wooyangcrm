import { supabase } from "@/lib/supabaseClient";

const sanitizeFileName = (fileName: string) => {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
};

export interface WorkOrderFile {
  id: string;
  work_order_id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
  user?: {
    id: string;
    name: string;
  };
  public_url?: string;
}

// 파일 업로드 - consultation_files 버킷 사용 (work_orders/ 경로)
export const uploadWorkOrderFile = async (
  file: File,
  workOrderId: string,
  userId: string
): Promise<{ id: string; name: string; url: string; path: string } | null> => {
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}_${sanitizeFileName(file.name)}`;
  const filePath = `work_orders/${workOrderId}/${uniqueFileName}`;

  // Supabase 스토리지에 파일 업로드 (consultation_files 버킷 사용)
  const { error: uploadError } = await supabase.storage
    .from("consultation_files")
    .upload(filePath, file);

  if (uploadError) {
    console.error("파일 업로드 실패:", uploadError.message);
    return null;
  }

  // DB에 파일 정보 저장
  const { data, error: dbError } = await supabase
    .from("work_order_files")
    .insert([
      {
        work_order_id: workOrderId,
        user_id: userId,
        file_url: filePath,
        file_name: file.name,
        file_size: file.size,
      },
    ])
    .select("id, file_name")
    .single();

  if (dbError) {
    console.error("DB 저장 실패:", dbError.message);
    // 업로드된 파일 삭제
    await supabase.storage.from("consultation_files").remove([filePath]);
    return null;
  }

  // Public URL 생성
  const { data: urlData } = supabase.storage
    .from("consultation_files")
    .getPublicUrl(filePath);

  return {
    id: data.id,
    name: data.file_name,
    url: urlData?.publicUrl || "",
    path: filePath,
  };
};

// 파일 목록 조회
export const fetchWorkOrderFiles = async (
  workOrderId: string
): Promise<WorkOrderFile[]> => {
  const { data, error } = await supabase
    .from("work_order_files")
    .select(`
      *,
      user:users!work_order_files_user_id_fkey(id, name)
    `)
    .eq("work_order_id", workOrderId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("파일 목록 조회 실패:", error.message);
    return [];
  }

  // Public URL 추가
  return (data || []).map((file) => {
    const { data: urlData } = supabase.storage
      .from("consultation_files")
      .getPublicUrl(file.file_url);

    return {
      ...file,
      public_url: urlData?.publicUrl || undefined,
    };
  });
};

// 파일 삭제
export const deleteWorkOrderFile = async (
  fileId: string,
  filePath: string
): Promise<boolean> => {
  // Storage에서 파일 삭제
  const { error: storageError } = await supabase.storage
    .from("consultation_files")
    .remove([filePath]);

  if (storageError) {
    console.error("스토리지 파일 삭제 실패:", storageError.message);
  }

  // DB에서 파일 정보 삭제
  const { error } = await supabase
    .from("work_order_files")
    .delete()
    .eq("id", fileId);

  if (error) {
    console.error("DB 파일 정보 삭제 실패:", error.message);
    return false;
  }

  return true;
};

// 파일 다운로드 URL 생성 (signed URL for private files)
export const getWorkOrderFileDownloadUrl = async (
  filePath: string
): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from("consultation_files")
    .createSignedUrl(filePath, 60 * 60); // 1시간 유효

  if (error) {
    console.error("다운로드 URL 생성 실패:", error.message);
    return null;
  }

  return data?.signedUrl || null;
};
