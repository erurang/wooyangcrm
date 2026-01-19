"use client";

import { useState, useEffect, useCallback } from "react";

interface PushSubscriptionState {
  isSupported: boolean;
  permission: NotificationPermission | "default";
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * 푸시 알림 훅
 * - 브라우저 지원 여부 확인
 * - 알림 권한 요청
 * - 푸시 구독 관리
 *
 * @example
 * const { isSupported, permission, subscribe, unsubscribe } = usePushNotification();
 */
export function usePushNotification(userId?: string) {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    permission: "default",
    isSubscribed: false,
    isLoading: true,
    error: null,
  });

  // 지원 여부 및 현재 상태 확인
  useEffect(() => {
    const checkSupport = async () => {
      // 브라우저 지원 확인
      const isSupported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!isSupported) {
        setState((prev) => ({
          ...prev,
          isSupported: false,
          isLoading: false,
        }));
        return;
      }

      // 현재 권한 상태
      const permission = Notification.permission;

      // 구독 상태 확인
      let isSubscribed = false;
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        isSubscribed = subscription !== null;
      } catch (err) {
        console.error("구독 상태 확인 실패:", err);
      }

      setState({
        isSupported: true,
        permission,
        isSubscribed,
        isLoading: false,
        error: null,
      });
    };

    checkSupport();
  }, []);

  // 알림 권한 요청
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: "브라우저가 푸시 알림을 지원하지 않습니다." }));
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));
      return permission === "granted";
    } catch (err) {
      console.error("권한 요청 실패:", err);
      setState((prev) => ({ ...prev, error: "알림 권한 요청에 실패했습니다." }));
      return false;
    }
  }, [state.isSupported]);

  // 푸시 구독
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: "브라우저가 푸시 알림을 지원하지 않습니다." }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // 권한 확인/요청
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        setState((prev) => ({
          ...prev,
          permission,
          isLoading: false,
          error: "알림 권한이 거부되었습니다.",
        }));
        return false;
      }

      // Service Worker 등록 확인
      const registration = await navigator.serviceWorker.ready;

      // VAPID 공개키
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID 공개키가 설정되지 않았습니다.");
      }

      // 기존 구독 확인
      let subscription = await registration.pushManager.getSubscription();

      // 새 구독 생성
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      // 서버에 구독 정보 저장
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("구독 저장에 실패했습니다.");
      }

      setState((prev) => ({
        ...prev,
        permission: "granted",
        isSubscribed: true,
        isLoading: false,
        error: null,
      }));

      return true;
    } catch (err) {
      console.error("푸시 구독 실패:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "구독에 실패했습니다.",
      }));
      return false;
    }
  }, [state.isSupported, userId]);

  // 푸시 구독 해제
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // 서버에서 구독 삭제
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            userId,
          }),
        });

        // 브라우저에서 구독 해제
        await subscription.unsubscribe();
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
        error: null,
      }));

      return true;
    } catch (err) {
      console.error("구독 해제 실패:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "구독 해제에 실패했습니다.",
      }));
      return false;
    }
  }, [userId]);

  // 테스트 알림 발송
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    if (!state.isSubscribed) {
      setState((prev) => ({ ...prev, error: "먼저 알림을 구독해주세요." }));
      return false;
    }

    try {
      const response = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: "테스트 알림",
          body: "푸시 알림이 정상적으로 작동합니다!",
          url: "/",
        }),
      });

      if (!response.ok) {
        throw new Error("알림 발송에 실패했습니다.");
      }

      return true;
    } catch (err) {
      console.error("테스트 알림 실패:", err);
      setState((prev) => ({
        ...prev,
        error: "테스트 알림 발송에 실패했습니다.",
      }));
      return false;
    }
  }, [state.isSubscribed, userId]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

// Base64 URL을 Uint8Array로 변환
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
