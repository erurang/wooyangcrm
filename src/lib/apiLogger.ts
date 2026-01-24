import { supabase } from "@/lib/supabaseClient";
import { NextRequest } from "next/server";

interface ApiLogData {
  userId?: string | null;
  endpoint: string;
  method: string;
  statusCode?: number;
  responseTimeMs?: number;
  requestBody?: Record<string, unknown>;
  responseSummary?: string;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
}

// =============================================
// 테이블별 CRUD 로깅 (logs 테이블 - 감사 로그)
// =============================================

type OperationType = "INSERT" | "UPDATE" | "DELETE";

/**
 * 범용 CRUD 작업 로깅 (logs 테이블에 기록)
 * 감사 로그용 - 데이터 변경 이력 추적
 */
export async function logCrudOperation(
  tableName: string,
  operation: OperationType,
  recordId: string,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
  changedBy: string
): Promise<void> {
  try {
    await supabase.from("logs").insert({
      table_name: tableName,
      operation,
      record_id: recordId,
      old_data: oldData,
      new_data: newData,
      changed_by: changedBy,
    });
  } catch (error) {
    console.error(`Failed to log ${tableName} operation:`, error);
  }
}

// 테이블별 편의 함수
export const logConsultationOperation = (
  operation: OperationType,
  recordId: string,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
  changedBy: string
) => logCrudOperation("consultations", operation, recordId, oldData, newData, changedBy);

export const logCompanyOperation = (
  operation: OperationType,
  recordId: string,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
  changedBy: string
) => logCrudOperation("companies", operation, recordId, oldData, newData, changedBy);

export const logDocumentOperation = (
  operation: OperationType,
  recordId: string,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
  changedBy: string
) => logCrudOperation("documents", operation, recordId, oldData, newData, changedBy);

export const logContactOperation = (
  operation: OperationType,
  recordId: string,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
  changedBy: string
) => logCrudOperation("contacts", operation, recordId, oldData, newData, changedBy);

/**
 * API 호출을 로깅합니다
 */
export async function logApiCall(data: ApiLogData): Promise<void> {
  try {
    await supabase.from("api_logs").insert({
      user_id: data.userId || null,
      endpoint: data.endpoint,
      method: data.method,
      status_code: data.statusCode,
      response_time_ms: data.responseTimeMs,
      request_body: data.requestBody,
      response_summary: data.responseSummary,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      error_message: data.errorMessage,
    });
  } catch (error) {
    // 로깅 실패는 무시 (메인 기능에 영향을 주지 않도록)
    console.error("Failed to log API call:", error);
  }
}

/**
 * Request에서 IP 주소 추출
 */
export function getIpFromRequest(request: NextRequest | Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

/**
 * Request에서 User Agent 추출
 */
export function getUserAgentFromRequest(request: NextRequest | Request): string {
  return request.headers.get("user-agent") || "unknown";
}

/**
 * API 로깅 래퍼 - API 핸들러를 감싸서 자동으로 로깅
 */
export function withApiLogging<T>(
  handler: (request: NextRequest, context?: T) => Promise<Response>
) {
  return async (request: NextRequest, context?: T): Promise<Response> => {
    const startTime = Date.now();
    const endpoint = new URL(request.url).pathname;
    const method = request.method;
    const ipAddress = getIpFromRequest(request);
    const userAgent = getUserAgentFromRequest(request);

    // userId는 헤더나 쿼리에서 추출 시도
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") || request.headers.get("x-user-id");

    let response: Response;
    let errorMessage: string | undefined;

    try {
      response = await handler(request, context);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Unknown error";
      response = new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const responseTimeMs = Date.now() - startTime;

    // 비동기로 로깅 (응답 지연 방지)
    logApiCall({
      userId,
      endpoint,
      method,
      statusCode: response.status,
      responseTimeMs,
      ipAddress,
      userAgent,
      errorMessage,
      responseSummary: response.status >= 400 ? `Error: ${response.status}` : "Success",
    });

    return response;
  };
}

// =============================================
// 사용자 활동 로깅
// =============================================

interface ActivityLogData {
  userId: string;
  action: string;
  actionType: "auth" | "crud" | "view" | "export" | "admin";
  targetType?: string;
  targetId?: string;
  targetName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 사용자 활동을 로깅합니다
 */
export async function logUserActivity(data: ActivityLogData): Promise<void> {
  try {
    await supabase.from("user_activity_logs").insert({
      user_id: data.userId,
      action: data.action,
      action_type: data.actionType,
      target_type: data.targetType,
      target_id: data.targetId,
      target_name: data.targetName,
      details: data.details,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
    });
  } catch (error) {
    console.error("Failed to log user activity:", error);
  }
}

// =============================================
// 세션 관리
// =============================================

interface SessionData {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

function parseUserAgent(userAgent: string): { deviceType: string; browser: string; os: string } {
  let deviceType = "desktop";
  let browser = "unknown";
  let os = "unknown";

  // Device type detection
  if (/mobile/i.test(userAgent)) {
    deviceType = "mobile";
  } else if (/tablet|ipad/i.test(userAgent)) {
    deviceType = "tablet";
  }

  // Browser detection
  if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) {
    browser = "Chrome";
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = "Safari";
  } else if (/firefox/i.test(userAgent)) {
    browser = "Firefox";
  } else if (/edge/i.test(userAgent)) {
    browser = "Edge";
  }

  // OS detection
  if (/windows/i.test(userAgent)) {
    os = "Windows";
  } else if (/macintosh|mac os/i.test(userAgent)) {
    os = "macOS";
  } else if (/linux/i.test(userAgent)) {
    os = "Linux";
  } else if (/android/i.test(userAgent)) {
    os = "Android";
  } else if (/iphone|ipad/i.test(userAgent)) {
    os = "iOS";
  }

  return { deviceType, browser, os };
}

/**
 * 사용자 세션 시작 (로그인 시)
 */
export async function startUserSession(data: SessionData): Promise<string | null> {
  try {
    const { deviceType, browser, os } = parseUserAgent(data.userAgent || "");

    const { data: session, error } = await supabase
      .from("user_sessions")
      .insert({
        user_id: data.userId,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        device_type: deviceType,
        browser,
        os,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) throw error;
    return session?.id || null;
  } catch (error) {
    console.error("Failed to start user session:", error);
    return null;
  }
}

/**
 * 사용자 세션 종료 (로그아웃 시)
 */
export async function endUserSession(userId: string): Promise<void> {
  try {
    await supabase
      .from("user_sessions")
      .update({
        logout_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("user_id", userId)
      .eq("is_active", true);
  } catch (error) {
    console.error("Failed to end user session:", error);
  }
}

/**
 * 세션 활동 시간 업데이트
 */
export async function updateSessionActivity(userId: string): Promise<void> {
  try {
    await supabase
      .from("user_sessions")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_active", true);
  } catch (error) {
    console.error("Failed to update session activity:", error);
  }
}
