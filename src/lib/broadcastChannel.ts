/**
 * BroadcastChannel 유틸리티
 * 탭/창 간 실시간 데이터 동기화를 위한 메시지 전송
 */

export const CHANNEL_NAME = "wooyang-crm-sync";

export type BroadcastMessageType =
  | "DOCUMENT_CREATED"
  | "DOCUMENT_UPDATED"
  | "DOCUMENT_STATUS_CHANGED"
  | "DOCUMENT_DELETED"
  | "CONSULTATION_UPDATED"
  | "INVENTORY_UPDATED";

export interface BroadcastMessage {
  type: BroadcastMessageType;
  payload: {
    consultationId?: string;
    companyId?: string;
    documentId?: string;
    documentType?: string;
    timestamp: number;
  };
}

/**
 * 메시지 전송
 */
export function broadcastMessage(message: BroadcastMessage): void {
  if (typeof window === "undefined") return;

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(message);
    channel.close();
  } catch (error) {
    // BroadcastChannel이 지원되지 않는 브라우저 대비
    console.warn("BroadcastChannel not supported:", error);
  }
}

/**
 * 문서 생성 알림
 */
export function notifyDocumentCreated(
  consultationId: string,
  companyId: string,
  documentId: string,
  documentType: string
): void {
  broadcastMessage({
    type: "DOCUMENT_CREATED",
    payload: {
      consultationId,
      companyId,
      documentId,
      documentType,
      timestamp: Date.now(),
    },
  });
}

/**
 * 문서 수정 알림
 */
export function notifyDocumentUpdated(
  consultationId: string,
  companyId: string,
  documentId: string,
  documentType: string
): void {
  broadcastMessage({
    type: "DOCUMENT_UPDATED",
    payload: {
      consultationId,
      companyId,
      documentId,
      documentType,
      timestamp: Date.now(),
    },
  });
}

/**
 * 문서 상태 변경 알림
 */
export function notifyDocumentStatusChanged(
  consultationId: string,
  documentId: string
): void {
  broadcastMessage({
    type: "DOCUMENT_STATUS_CHANGED",
    payload: {
      consultationId,
      documentId,
      timestamp: Date.now(),
    },
  });
}
