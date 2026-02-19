"use client";

import { useState, useEffect } from "react";
import { usePushNotification } from "@/hooks/usePushNotification";
import { useLoginUser } from "@/context/login";
import { Bell, X } from "lucide-react";

interface NotificationBannerProps {
  dismissKey?: string;
}

/**
 * 알림 권한 요청 배너
 * - 첫 방문 시 또는 알림 미설정 시 표시
 * - 로컬 스토리지에 dismiss 상태 저장
 */
export default function NotificationBanner({
  dismissKey = "notification-banner-dismissed",
}: NotificationBannerProps) {
  const loginUser = useLoginUser();
  const { isSupported, permission, subscribe, isLoading } = usePushNotification(loginUser?.id);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 클라이언트에서만 실행
    const dismissed = localStorage.getItem(dismissKey);
    setIsDismissed(!!dismissed);

    // 지원하고, 권한이 default이고, dismiss하지 않은 경우에만 표시
    if (isSupported && permission === "default" && !dismissed) {
      // 약간의 딜레이 후 표시 (애니메이션 효과)
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, [isSupported, permission, dismissKey]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(dismissKey, "true");
    setTimeout(() => setIsDismissed(true), 300);
  };

  const handleEnable = async () => {
    await subscribe();
    handleDismiss();
  };

  // 표시하지 않는 조건
  if (!isSupported || permission !== "default" || isDismissed) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 transition-all duration-300 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-sky-100 rounded-lg shrink-0">
            <Bell className="w-5 h-5 text-sky-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-800 text-sm">
              알림을 받아보세요
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              새로운 상담, 주문 등의 소식을 실시간으로 받아볼 수 있습니다.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleEnable}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? "처리 중..." : "알림 허용"}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                나중에
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
