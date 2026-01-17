import { useEffect, useCallback, useRef } from "react";
import {
  CHANNEL_NAME,
  BroadcastMessage,
  BroadcastMessageType,
} from "@/lib/broadcastChannel";

interface UseBroadcastChannelOptions {
  /**
   * 수신할 메시지 타입 필터 (없으면 모든 메시지 수신)
   */
  messageTypes?: BroadcastMessageType[];
  /**
   * 특정 상담 ID에 관련된 메시지만 수신
   */
  consultationId?: string;
  /**
   * 특정 회사 ID에 관련된 메시지만 수신
   */
  companyId?: string;
  /**
   * 메시지 수신 시 실행할 콜백
   */
  onMessage: (message: BroadcastMessage) => void;
}

/**
 * BroadcastChannel 구독 훅
 * 다른 탭/창에서 보낸 메시지를 수신
 */
export function useBroadcastChannel({
  messageTypes,
  consultationId,
  companyId,
  onMessage,
}: UseBroadcastChannelOptions): void {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const handleMessage = useCallback(
    (event: MessageEvent<BroadcastMessage>) => {
      const message = event.data;

      // 메시지 타입 필터링
      if (messageTypes && !messageTypes.includes(message.type)) {
        return;
      }

      // 상담 ID 필터링
      if (
        consultationId &&
        message.payload.consultationId &&
        message.payload.consultationId !== consultationId
      ) {
        return;
      }

      // 회사 ID 필터링
      if (
        companyId &&
        message.payload.companyId &&
        message.payload.companyId !== companyId
      ) {
        return;
      }

      onMessageRef.current(message);
    },
    [messageTypes, consultationId, companyId]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.addEventListener("message", handleMessage);

      return () => {
        channel.removeEventListener("message", handleMessage);
        channel.close();
      };
    } catch (error) {
      // BroadcastChannel이 지원되지 않는 브라우저 대비
      console.warn("BroadcastChannel not supported:", error);
    }
  }, [handleMessage]);
}
