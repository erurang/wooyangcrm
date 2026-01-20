/**
 * 알림 시스템 유틸리티
 * 알림 생성 및 관리를 위한 중앙화된 함수들
 * PWA 푸시 알림 기능 포함
 */

import { supabase } from "@/lib/supabaseClient";

// VAPID 설정 (동적으로 web-push 로드)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@wooyang.com";

// web-push 인스턴스를 lazy하게 가져오기
let webPushInstance: typeof import("web-push") | null = null;

async function getWebPush() {
  if (!vapidPublicKey || !vapidPrivateKey) {
    return null;
  }
  if (!webPushInstance) {
    try {
      webPushInstance = await import("web-push");
      webPushInstance.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    } catch (e) {
      console.error("web-push 로드 실패:", e);
      return null;
    }
  }
  return webPushInstance;
}

// 알림 타입 정의
export type NotificationType =
  // 문서 관련
  | "document_expiry"       // 문서 만료 임박
  | "estimate_completed"    // 견적서 완료 → 출고 리스트 등록
  | "order_completed"       // 발주서 완료 → 입고 리스트 등록
  // 상담 관련
  | "consultation_followup" // 상담 후속조치
  // 할일 관련
  | "todo_reminder"         // 할일 알림
  // 게시판 관련
  | "post_comment"          // 내 게시글에 댓글
  | "post_mention"          // 멘션됨
  | "post_reply"            // 내 댓글에 대댓글
  // 재고 입출고 관련
  | "inventory_assignment"  // 입출고 담당 지정
  | "inventory_update"      // 입출고 정보 변경 (예정일 등)
  | "inventory_complete"    // 입출고 확인 완료
  | "inventory_cancel"      // 입출고 취소
  | "inbound_assignment"    // 입고 담당 지정
  | "inbound_date_change"   // 입고 예정일 변경
  | "inbound_confirmed"     // 입고 확인 완료
  | "inbound_canceled"      // 입고 취소
  | "outbound_assignment"   // 출고 담당 지정
  | "outbound_date_change"  // 출고 예정일 변경
  | "outbound_confirmed"    // 출고 확인 완료
  | "outbound_canceled"     // 출고 취소
  // 작업지시 관련
  | "work_order_assignment"   // 작업지시 담당자 지정
  | "work_order_unassignment" // 작업지시 담당 해제
  | "work_order_comment"      // 작업지시 댓글
  | "work_order_update"       // 작업지시 내용 수정
  | "work_order_status"       // 작업지시 상태 변경
  | "work_order_deadline"     // 작업지시 기한/일자 변경
  | "work_order_progress"     // 작업지시 진행 상황
  | "work_order_completed"    // 작업지시 완료
  | "work_order_file"         // 작업지시 파일 추가
  // 시스템
  | "system";

// 관련 항목 타입
export type RelatedType =
  | "document"
  | "consultation"
  | "todo"
  | "post"
  | "inventory_task"
  | "work_order"
  | "inbound"
  | "outbound";

// 알림 카테고리 정의 (타입별로 그룹핑)
export const NOTIFICATION_TYPE_TO_CATEGORY: Record<NotificationType, string> = {
  // 문서 관련
  document_expiry: "documents",
  estimate_completed: "documents",
  order_completed: "documents",
  // 상담 관련
  consultation_followup: "consultations",
  // 할일 관련
  todo_reminder: "todos",
  // 게시판 관련
  post_comment: "board",
  post_mention: "board",
  post_reply: "board",
  // 재고 입출고 관련
  inventory_assignment: "inventory",
  inventory_update: "inventory",
  inventory_complete: "inventory",
  inventory_cancel: "inventory",
  inbound_assignment: "inventory",
  inbound_date_change: "inventory",
  inbound_confirmed: "inventory",
  inbound_canceled: "inventory",
  outbound_assignment: "inventory",
  outbound_date_change: "inventory",
  outbound_confirmed: "inventory",
  outbound_canceled: "inventory",
  // 작업지시 관련
  work_order_assignment: "workOrders",
  work_order_unassignment: "workOrders",
  work_order_comment: "workOrders",
  work_order_update: "workOrders",
  work_order_status: "workOrders",
  work_order_deadline: "workOrders",
  work_order_progress: "workOrders",
  work_order_completed: "workOrders",
  work_order_file: "workOrders",
  // 시스템
  system: "system",
};

// PWA 푸시 알림을 보낼 알림 타입들 (work_order_progress 제외)
const PUSH_ENABLED_TYPES: Set<NotificationType> = new Set([
  // 문서 관련
  "document_expiry",
  "estimate_completed",
  "order_completed",
  // 상담 관련
  "consultation_followup",
  // 할일 관련
  "todo_reminder",
  // 게시판 관련
  "post_comment",
  "post_mention",
  "post_reply",
  // 입고 관련
  "inbound_assignment",
  "inbound_date_change",
  "inbound_confirmed",
  "inbound_canceled",
  // 출고 관련
  "outbound_assignment",
  "outbound_date_change",
  "outbound_confirmed",
  "outbound_canceled",
  // 작업지시 관련 (work_order_progress 제외)
  "work_order_assignment",
  "work_order_unassignment",
  "work_order_comment",
  "work_order_update",
  "work_order_status",
  "work_order_deadline",
  "work_order_completed",
  "work_order_file",
  // 시스템
  "system",
]);

/**
 * PWA 푸시 알림을 보낼지 여부 확인
 */
function shouldSendPush(type: NotificationType): boolean {
  return PUSH_ENABLED_TYPES.has(type);
}

/**
 * 사용자에게 PWA 푸시 알림 발송
 */
async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url?: string,
  tag?: string
): Promise<{ sent: boolean; error?: string }> {
  const webPush = await getWebPush();
  if (!webPush) {
    return { sent: false, error: "VAPID not configured" };
  }

  try {
    // 사용자의 푸시 구독 정보 조회
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (!subscriptions || subscriptions.length === 0) {
      return { sent: false, error: "No subscription" };
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      url: url || "/",
      tag: tag || "notification",
    });

    // 모든 구독에 푸시 발송
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webPush.sendNotification(pushSubscription, payload);
          return { success: true };
        } catch (err: unknown) {
          const error = err as { statusCode?: number };
          // 410 Gone 또는 404 - 구독 만료됨
          if (error.statusCode === 410 || error.statusCode === 404) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
          return { success: false };
        }
      })
    );

    const successCount = results.filter(
      (r) => r.status === "fulfilled" && (r.value as { success: boolean }).success
    ).length;

    return { sent: successCount > 0 };
  } catch (e) {
    console.error("푸시 발송 오류:", e);
    return { sent: false, error: String(e) };
  }
}

/**
 * 여러 사용자에게 PWA 푸시 알림 발송
 */
async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  url?: string,
  tag?: string
): Promise<{ sent: number; failed: number }> {
  if (userIds.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // VAPID 설정 확인
  const webPush = await getWebPush();
  if (!webPush) {
    return { sent: 0, failed: userIds.length };
  }

  const results = await Promise.allSettled(
    userIds.map((userId) => sendPushToUser(userId, title, body, url, tag))
  );

  let sent = 0;
  let failed = 0;
  results.forEach((r) => {
    if (r.status === "fulfilled" && r.value.sent) {
      sent++;
    } else {
      failed++;
    }
  });

  return { sent, failed };
}

// 사용자별 알림 설정 캐시 (1분 TTL)
const settingsCache = new Map<string, { settings: Record<string, boolean>; timestamp: number }>();
const CACHE_TTL = 60000; // 1분

/**
 * 사용자의 알림 설정 조회 (캐시 지원)
 */
export async function getUserNotificationSettings(userId: string): Promise<Record<string, boolean>> {
  // 캐시 확인
  const cached = settingsCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.settings;
  }

  try {
    const { data, error } = await supabase
      .from("notification_settings")
      .select("settings")
      .eq("user_id", userId)
      .single();

    // 설정이 없거나 에러 시 기본값 (모든 알림 활성화)
    const settings = (error || !data?.settings) ? {
      documents: true,
      board: true,
      inventory: true,
      workOrders: true,
      consultations: true,
      todos: true,
      system: true,
    } : data.settings;

    // 캐시 저장
    settingsCache.set(userId, { settings, timestamp: Date.now() });

    return settings;
  } catch {
    // 에러 시 기본값 반환
    return {
      documents: true,
      board: true,
      inventory: true,
      workOrders: true,
      consultations: true,
      todos: true,
      system: true,
    };
  }
}

/**
 * 사용자가 특정 알림 타입을 수신하도록 설정했는지 확인
 */
export async function shouldSendNotification(userId: string, type: NotificationType): Promise<boolean> {
  const category = NOTIFICATION_TYPE_TO_CATEGORY[type];
  if (!category) return true; // 알 수 없는 타입은 발송

  const settings = await getUserNotificationSettings(userId);
  return settings[category] !== false; // 기본값 true
}

/**
 * 알림 발송 전 필터링 (여러 사용자)
 * - 설정이 꺼진 사용자들을 제외하고 반환
 */
export async function filterRecipientsByPreference(
  userIds: string[],
  type: NotificationType
): Promise<string[]> {
  if (!userIds.length) return [];

  const results = await Promise.all(
    userIds.map(async (userId) => {
      const shouldSend = await shouldSendNotification(userId, type);
      return shouldSend ? userId : null;
    })
  );

  return results.filter((id): id is string => id !== null);
}

// 알림 생성 파라미터
export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: RelatedType;
}

// 여러 사용자에게 알림 생성 파라미터
export interface CreateBulkNotificationParams {
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: RelatedType;
}

/**
 * 단일 알림 생성 (사용자 설정 확인 후 발송 + PWA 푸시)
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  relatedId,
  relatedType,
}: CreateNotificationParams): Promise<boolean> {
  try {
    // 사용자가 해당 알림 유형을 수신하도록 설정했는지 확인
    const shouldSend = await shouldSendNotification(userId, type);
    if (!shouldSend) {
      console.log(`알림 스킵 (사용자 설정): userId=${userId}, type=${type}`);
      return true; // 설정으로 인한 스킵은 성공으로 처리
    }

    // 1. DB 알림 생성
    const { error } = await supabase
      .from("notifications")
      .insert([{
        user_id: userId,
        type,
        title,
        message,
        related_id: relatedId || null,
        related_type: relatedType || null,
        read: false,
      }]);

    if (error) {
      console.error("알림 생성 실패:", error);
      return false;
    }

    // 2. PWA 푸시 발송 (해당 타입이 푸시 대상인 경우)
    if (shouldSendPush(type)) {
      const url = relatedType && relatedId ? getNotificationUrl(relatedType, relatedId) : "/";
      await sendPushToUser(userId, title, message, url, type);
    }

    return true;
  } catch (e) {
    console.error("알림 생성 예외:", e);
    return false;
  }
}

/**
 * 알림 타입에 따른 이동 URL 생성
 */
function getNotificationUrl(relatedType: RelatedType, relatedId: string): string {
  switch (relatedType) {
    case "document":
      return `/documents/${relatedId}`;
    case "consultation":
      return `/consultations`;
    case "todo":
      return `/`;
    case "post":
      // postId:commentId 형식 처리
      const postId = relatedId.includes(":") ? relatedId.split(":")[0] : relatedId;
      return `/board/${postId}`;
    case "work_order":
      return `/production/work-orders/${relatedId}`;
    case "inbound":
      return `/inventory?tab=inbound`;
    case "outbound":
      return `/inventory?tab=outbound`;
    default:
      return "/";
  }
}

/**
 * 여러 사용자에게 동일한 알림 생성 (사용자 설정 필터링 적용 + PWA 푸시)
 */
export async function createBulkNotifications({
  userIds,
  type,
  title,
  message,
  relatedId,
  relatedType,
}: CreateBulkNotificationParams): Promise<boolean> {
  if (!userIds.length) return true;

  try {
    // 알림 수신을 원하는 사용자만 필터링
    const filteredUserIds = await filterRecipientsByPreference(userIds, type);

    if (!filteredUserIds.length) {
      console.log(`모든 사용자가 알림 수신 거부: type=${type}`);
      return true; // 설정으로 인한 스킵은 성공으로 처리
    }

    // 1. DB 알림 생성
    const notifications = filteredUserIds.map((userId) => ({
      user_id: userId,
      type,
      title,
      message,
      related_id: relatedId || null,
      related_type: relatedType || null,
      read: false,
    }));

    const { error } = await supabase
      .from("notifications")
      .insert(notifications);

    if (error) {
      console.error("일괄 알림 생성 실패:", error);
      return false;
    }

    // 2. PWA 푸시 발송 (해당 타입이 푸시 대상인 경우)
    if (shouldSendPush(type)) {
      const url = relatedType && relatedId ? getNotificationUrl(relatedType, relatedId) : "/";
      await sendPushToUsers(filteredUserIds, title, message, url, type);
    }

    return true;
  } catch (e) {
    console.error("일괄 알림 생성 예외:", e);
    return false;
  }
}

/**
 * 사용자 이름 조회
 */
export async function getUserName(userId: string): Promise<string> {
  const { data } = await supabase
    .from("users")
    .select("name")
    .eq("id", userId)
    .single();
  return data?.name || "사용자";
}

/**
 * 여러 사용자 이름 조회
 */
export async function getUserNames(userIds: string[]): Promise<Record<string, string>> {
  if (!userIds.length) return {};

  const { data } = await supabase
    .from("users")
    .select("id, name")
    .in("id", userIds);

  const result: Record<string, string> = {};
  data?.forEach((user) => {
    result[user.id] = user.name;
  });
  return result;
}

// ================================
// 견적서/발주서 관련 알림
// ================================

/**
 * 견적서 완료 시 출고 리스트 등록 알림
 */
export async function notifyEstimateCompleted(params: {
  documentNumber: string;
  documentId: string;
  userId: string;
  companyName: string;
}): Promise<void> {
  const { documentNumber, documentId, userId, companyName } = params;

  await createNotification({
    userId,
    type: "estimate_completed",
    title: "견적서 완료 - 출고 등록",
    message: `견적서 "${documentNumber}" (${companyName})가 완료되어 출고 리스트에 등록되었습니다.`,
    relatedId: documentId,
    relatedType: "document",
  });
}

/**
 * 발주서 완료 시 입고 리스트 등록 알림
 */
export async function notifyOrderCompleted(params: {
  documentNumber: string;
  documentId: string;
  userId: string;
  companyName: string;
}): Promise<void> {
  const { documentNumber, documentId, userId, companyName } = params;

  await createNotification({
    userId,
    type: "order_completed",
    title: "발주서 완료 - 입고 등록",
    message: `발주서 "${documentNumber}" (${companyName})가 완료되어 입고 리스트에 등록되었습니다.`,
    relatedId: documentId,
    relatedType: "document",
  });
}

// ================================
// 입고 관련 알림
// ================================

/**
 * 입고 담당자 지정 알림
 */
export async function notifyInboundAssignment(params: {
  taskId: string;
  assigneeId: string;
  assignerId: string;
  documentNumber: string;
  companyName: string;
  expectedDate?: string;
}): Promise<void> {
  const { taskId, assigneeId, assignerId, documentNumber, companyName, expectedDate } = params;
  const assignerName = await getUserName(assignerId);

  let message = `${assignerName}님이 입고 작업을 배정했습니다.\n`;
  message += `• 문서번호: ${documentNumber}\n`;
  message += `• 거래처: ${companyName}`;
  if (expectedDate) {
    message += `\n• 예정일: ${expectedDate}`;
  }

  await createNotification({
    userId: assigneeId,
    type: "inbound_assignment",
    title: "입고 담당 배정",
    message,
    relatedId: taskId,
    relatedType: "inbound",
  });
}

/**
 * 입고 예정일 변경 알림 (담당자에게)
 */
export async function notifyInboundDateChange(params: {
  taskId: string;
  assigneeId: string;
  changerId: string;
  documentNumber: string;
  oldDate: string;
  newDate: string;
}): Promise<void> {
  const { taskId, assigneeId, changerId, documentNumber, oldDate, newDate } = params;
  const changerName = await getUserName(changerId);

  await createNotification({
    userId: assigneeId,
    type: "inbound_date_change",
    title: "입고 예정일 변경",
    message: `${changerName}님이 입고 예정일을 변경했습니다.\n• 문서번호: ${documentNumber}\n• 변경: ${oldDate} → ${newDate}`,
    relatedId: taskId,
    relatedType: "inbound",
  });
}

/**
 * 입고 확인 완료 알림 (지정자에게)
 */
export async function notifyInboundConfirmed(params: {
  taskId: string;
  assignerId: string;
  confirmerId: string;
  documentNumber: string;
  companyName: string;
}): Promise<void> {
  const { taskId, assignerId, confirmerId, documentNumber, companyName } = params;
  const confirmerName = await getUserName(confirmerId);

  await createNotification({
    userId: assignerId,
    type: "inbound_confirmed",
    title: "입고 확인 완료",
    message: `${confirmerName}님이 입고를 확인했습니다.\n• 문서번호: ${documentNumber}\n• 거래처: ${companyName}`,
    relatedId: taskId,
    relatedType: "inbound",
  });
}

/**
 * 입고 취소 알림 (지정자/담당자에게)
 */
export async function notifyInboundCanceled(params: {
  taskId: string;
  recipientIds: string[];
  cancelerId: string;
  documentNumber: string;
  companyName: string;
  reason?: string;
}): Promise<void> {
  const { taskId, recipientIds, cancelerId, documentNumber, companyName, reason } = params;
  const cancelerName = await getUserName(cancelerId);

  let message = `${cancelerName}님이 입고를 취소했습니다.\n• 문서번호: ${documentNumber}\n• 거래처: ${companyName}`;
  if (reason) {
    message += `\n• 사유: ${reason}`;
  }

  await createBulkNotifications({
    userIds: recipientIds.filter(id => id !== cancelerId),
    type: "inbound_canceled",
    title: "입고 취소",
    message,
    relatedId: taskId,
    relatedType: "inbound",
  });
}

// ================================
// 출고 관련 알림
// ================================

/**
 * 출고 담당자 지정 알림
 */
export async function notifyOutboundAssignment(params: {
  taskId: string;
  assigneeId: string;
  assignerId: string;
  documentNumber: string;
  companyName: string;
  expectedDate?: string;
}): Promise<void> {
  const { taskId, assigneeId, assignerId, documentNumber, companyName, expectedDate } = params;
  const assignerName = await getUserName(assignerId);

  let message = `${assignerName}님이 출고 작업을 배정했습니다.\n`;
  message += `• 문서번호: ${documentNumber}\n`;
  message += `• 거래처: ${companyName}`;
  if (expectedDate) {
    message += `\n• 예정일: ${expectedDate}`;
  }

  await createNotification({
    userId: assigneeId,
    type: "outbound_assignment",
    title: "출고 담당 배정",
    message,
    relatedId: taskId,
    relatedType: "outbound",
  });
}

/**
 * 출고 예정일 변경 알림 (담당자에게)
 */
export async function notifyOutboundDateChange(params: {
  taskId: string;
  assigneeId: string;
  changerId: string;
  documentNumber: string;
  oldDate: string;
  newDate: string;
}): Promise<void> {
  const { taskId, assigneeId, changerId, documentNumber, oldDate, newDate } = params;
  const changerName = await getUserName(changerId);

  await createNotification({
    userId: assigneeId,
    type: "outbound_date_change",
    title: "출고 예정일 변경",
    message: `${changerName}님이 출고 예정일을 변경했습니다.\n• 문서번호: ${documentNumber}\n• 변경: ${oldDate} → ${newDate}`,
    relatedId: taskId,
    relatedType: "outbound",
  });
}

/**
 * 출고 확인 완료 알림 (지정자에게)
 */
export async function notifyOutboundConfirmed(params: {
  taskId: string;
  assignerId: string;
  confirmerId: string;
  documentNumber: string;
  companyName: string;
}): Promise<void> {
  const { taskId, assignerId, confirmerId, documentNumber, companyName } = params;
  const confirmerName = await getUserName(confirmerId);

  await createNotification({
    userId: assignerId,
    type: "outbound_confirmed",
    title: "출고 확인 완료",
    message: `${confirmerName}님이 출고를 확인했습니다.\n• 문서번호: ${documentNumber}\n• 거래처: ${companyName}`,
    relatedId: taskId,
    relatedType: "outbound",
  });
}

/**
 * 출고 취소 알림 (지정자/담당자에게)
 */
export async function notifyOutboundCanceled(params: {
  taskId: string;
  recipientIds: string[];
  cancelerId: string;
  documentNumber: string;
  companyName: string;
  reason?: string;
}): Promise<void> {
  const { taskId, recipientIds, cancelerId, documentNumber, companyName, reason } = params;
  const cancelerName = await getUserName(cancelerId);

  let message = `${cancelerName}님이 출고를 취소했습니다.\n• 문서번호: ${documentNumber}\n• 거래처: ${companyName}`;
  if (reason) {
    message += `\n• 사유: ${reason}`;
  }

  await createBulkNotifications({
    userIds: recipientIds.filter(id => id !== cancelerId),
    type: "outbound_canceled",
    title: "출고 취소",
    message,
    relatedId: taskId,
    relatedType: "outbound",
  });
}

// ================================
// 작업지시 관련 알림
// ================================

/**
 * 작업지시 담당자 지정 알림
 */
export async function notifyWorkOrderAssignment(params: {
  workOrderId: string;
  assigneeId: string;
  assignerId: string;
  title: string;
  deadline?: string;
}): Promise<void> {
  const { workOrderId, assigneeId, assignerId, title, deadline } = params;
  const assignerName = await getUserName(assignerId);

  let message = `${assignerName}님이 작업지시를 배정했습니다.\n• 제목: ${title}`;
  if (deadline) {
    message += `\n• 마감일: ${deadline}`;
  }

  await createNotification({
    userId: assigneeId,
    type: "work_order_assignment",
    title: "작업지시 배정",
    message,
    relatedId: workOrderId,
    relatedType: "work_order",
  });
}

/**
 * 작업지시 댓글 알림
 */
export async function notifyWorkOrderComment(params: {
  workOrderId: string;
  recipientIds: string[];
  commenterId: string;
  workOrderTitle: string;
  commentPreview: string;
}): Promise<void> {
  const { workOrderId, recipientIds, commenterId, workOrderTitle, commentPreview } = params;
  const commenterName = await getUserName(commenterId);

  const preview = commentPreview.length > 50 ? commentPreview.slice(0, 50) + "..." : commentPreview;

  await createBulkNotifications({
    userIds: recipientIds.filter(id => id !== commenterId),
    type: "work_order_comment",
    title: "작업지시 댓글",
    message: `${commenterName}님이 "${workOrderTitle}" 작업지시에 댓글을 남겼습니다.\n"${preview}"`,
    relatedId: workOrderId,
    relatedType: "work_order",
  });
}

/**
 * 작업지시 파일 추가 알림
 */
export async function notifyWorkOrderFile(params: {
  workOrderId: string;
  recipientIds: string[];
  uploaderId: string;
  workOrderTitle: string;
  fileName: string;
}): Promise<void> {
  const { workOrderId, recipientIds, uploaderId, workOrderTitle, fileName } = params;
  const uploaderName = await getUserName(uploaderId);

  await createBulkNotifications({
    userIds: recipientIds.filter(id => id !== uploaderId),
    type: "work_order_file",
    title: "작업지시 파일 추가",
    message: `${uploaderName}님이 "${workOrderTitle}" 작업지시에 파일을 추가했습니다.\n• 파일명: ${fileName}`,
    relatedId: workOrderId,
    relatedType: "work_order",
  });
}

/**
 * 작업지시 일자 변경 알림
 */
export async function notifyWorkOrderDeadlineChange(params: {
  workOrderId: string;
  recipientIds: string[];
  changerId: string;
  workOrderTitle: string;
  oldDate: string;
  newDate: string;
}): Promise<void> {
  const { workOrderId, recipientIds, changerId, workOrderTitle, oldDate, newDate } = params;
  const changerName = await getUserName(changerId);

  await createBulkNotifications({
    userIds: recipientIds.filter(id => id !== changerId),
    type: "work_order_deadline",
    title: "작업지시 일자 변경",
    message: `${changerName}님이 "${workOrderTitle}" 작업지시의 일자를 변경했습니다.\n• 변경: ${oldDate} → ${newDate}`,
    relatedId: workOrderId,
    relatedType: "work_order",
  });
}

/**
 * 작업지시 내용 변경 알림
 */
export async function notifyWorkOrderUpdate(params: {
  workOrderId: string;
  recipientIds: string[];
  updaterId: string;
  workOrderTitle: string;
  changes: string;
}): Promise<void> {
  const { workOrderId, recipientIds, updaterId, workOrderTitle, changes } = params;
  const updaterName = await getUserName(updaterId);

  await createBulkNotifications({
    userIds: recipientIds.filter(id => id !== updaterId),
    type: "work_order_update",
    title: "작업지시 내용 변경",
    message: `${updaterName}님이 "${workOrderTitle}" 작업지시 내용을 수정했습니다.\n${changes}`,
    relatedId: workOrderId,
    relatedType: "work_order",
  });
}

// ================================
// 게시판 관련 알림
// ================================

/**
 * 게시글에 댓글 알림 (게시글 작성자에게)
 */
export async function notifyPostComment(params: {
  postId: string;
  commentId: string;
  postAuthorId: string;
  commenterId: string;
  postTitle: string;
  commentPreview: string;
}): Promise<void> {
  const { postId, commentId, postAuthorId, commenterId, postTitle, commentPreview } = params;

  // 본인 댓글은 알림 X
  if (postAuthorId === commenterId) return;

  const commenterName = await getUserName(commenterId);
  const preview = commentPreview.length > 50 ? commentPreview.slice(0, 50) + "..." : commentPreview;

  await createNotification({
    userId: postAuthorId,
    type: "post_comment",
    title: "새 댓글",
    message: `${commenterName}님이 "${postTitle}" 게시글에 댓글을 남겼습니다.\n"${preview}"`,
    relatedId: `${postId}:${commentId}`,
    relatedType: "post",
  });
}

/**
 * 멘션 알림
 */
export async function notifyPostMention(params: {
  postId: string;
  commentId: string;
  mentionedUserId: string;
  mentionerId: string;
  postTitle: string;
  isInComment: boolean;
}): Promise<void> {
  const { postId, commentId, mentionedUserId, mentionerId, postTitle, isInComment } = params;

  // 본인 멘션은 알림 X
  if (mentionedUserId === mentionerId) return;

  const mentionerName = await getUserName(mentionerId);
  const location = isInComment ? "댓글" : "게시글";

  await createNotification({
    userId: mentionedUserId,
    type: "post_mention",
    title: "멘션됨",
    message: `${mentionerName}님이 "${postTitle}" ${location}에서 회원님을 언급했습니다.`,
    relatedId: `${postId}:${commentId}`,
    relatedType: "post",
  });
}

/**
 * 대댓글 알림 (원 댓글 작성자에게)
 */
export async function notifyPostReply(params: {
  postId: string;
  replyId: string;
  parentCommentAuthorId: string;
  replierId: string;
  postTitle: string;
  replyPreview: string;
}): Promise<void> {
  const { postId, replyId, parentCommentAuthorId, replierId, postTitle, replyPreview } = params;

  // 본인 대댓글은 알림 X
  if (parentCommentAuthorId === replierId) return;

  const replierName = await getUserName(replierId);
  const preview = replyPreview.length > 50 ? replyPreview.slice(0, 50) + "..." : replyPreview;

  await createNotification({
    userId: parentCommentAuthorId,
    type: "post_reply",
    title: "대댓글 알림",
    message: `${replierName}님이 "${postTitle}" 게시글의 회원님 댓글에 답글을 남겼습니다.\n"${preview}"`,
    relatedId: `${postId}:${replyId}`,
    relatedType: "post",
  });
}
