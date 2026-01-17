import { supabase } from "./supabaseClient";

/**
 * 게시판 작업 로깅 유틸리티
 * logs 테이블에 게시글 관련 작업을 기록합니다.
 */
export async function logPostOperation(
  operation: "INSERT" | "UPDATE" | "DELETE",
  recordId: string,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
  changedBy: string
) {
  try {
    await supabase.from("logs").insert({
      table_name: "posts",
      operation,
      record_id: recordId,
      old_data: oldData,
      new_data: newData,
      changed_by: changedBy,
    });
  } catch (error) {
    // 로깅 실패는 메인 작업에 영향을 주지 않도록 에러만 기록
    console.error("Failed to log post operation:", error);
  }
}

/**
 * 댓글 작업 로깅
 */
export async function logCommentOperation(
  operation: "INSERT" | "UPDATE" | "DELETE",
  recordId: string,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
  changedBy: string
) {
  try {
    await supabase.from("logs").insert({
      table_name: "post_comments",
      operation,
      record_id: recordId,
      old_data: oldData,
      new_data: newData,
      changed_by: changedBy,
    });
  } catch (error) {
    console.error("Failed to log comment operation:", error);
  }
}
