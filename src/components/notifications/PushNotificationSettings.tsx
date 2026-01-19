"use client";

import { useState, useEffect } from "react";
import { usePushNotification } from "@/hooks/usePushNotification";
import { Bell, BellOff, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface PushNotificationSettingsProps {
  userId?: string;
  compact?: boolean;
}

/**
 * 푸시 알림 설정 컴포넌트
 * - 알림 권한 요청
 * - 구독/구독 해제
 * - 테스트 알림 발송
 */
export default function PushNotificationSettings({
  userId,
  compact = false,
}: PushNotificationSettingsProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotification(userId);

  const [testSent, setTestSent] = useState(false);

  // 테스트 알림 발송
  const handleTestNotification = async () => {
    const result = await sendTestNotification();
    if (result) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  // 지원하지 않는 브라우저
  if (!isSupported) {
    if (compact) return null;
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-700">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">
            이 브라우저는 푸시 알림을 지원하지 않습니다.
          </span>
        </div>
      </div>
    );
  }

  // 컴팩트 모드 - 헤더나 사이드바에서 사용
  if (compact) {
    return (
      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading || permission === "denied"}
        className={`p-2 rounded-lg transition-colors ${
          isSubscribed
            ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
        } ${permission === "denied" ? "opacity-50 cursor-not-allowed" : ""}`}
        title={
          permission === "denied"
            ? "알림이 차단되었습니다"
            : isSubscribed
            ? "알림 끄기"
            : "알림 켜기"
        }
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
      </button>
    );
  }

  // 전체 설정 모드
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`p-2 rounded-lg ${
            isSubscribed ? "bg-blue-100" : "bg-slate-100"
          }`}
        >
          {isSubscribed ? (
            <Bell className="w-6 h-6 text-blue-600" />
          ) : (
            <BellOff className="w-6 h-6 text-slate-500" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">푸시 알림</h3>
          <p className="text-sm text-slate-500">
            중요한 업데이트를 실시간으로 받아보세요
          </p>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* 권한 상태 */}
      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">알림 권한</span>
          <span
            className={`text-sm font-medium ${
              permission === "granted"
                ? "text-green-600"
                : permission === "denied"
                ? "text-red-600"
                : "text-yellow-600"
            }`}
          >
            {permission === "granted"
              ? "허용됨"
              : permission === "denied"
              ? "차단됨"
              : "미설정"}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-slate-600">구독 상태</span>
          <span
            className={`text-sm font-medium ${
              isSubscribed ? "text-green-600" : "text-slate-500"
            }`}
          >
            {isSubscribed ? "활성화" : "비활성화"}
          </span>
        </div>
      </div>

      {/* 차단된 경우 안내 */}
      {permission === "denied" && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            알림이 브라우저에서 차단되었습니다.
            <br />
            브라우저 설정에서 이 사이트의 알림을 허용해주세요.
          </p>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="space-y-2">
        {permission === "default" ? (
          <button
            onClick={requestPermission}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                알림 권한 요청
              </>
            )}
          </button>
        ) : permission === "granted" ? (
          <>
            <button
              onClick={isSubscribed ? unsubscribe : subscribe}
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                isSubscribed
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  처리 중...
                </>
              ) : isSubscribed ? (
                <>
                  <BellOff className="w-4 h-4" />
                  알림 끄기
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  알림 켜기
                </>
              )}
            </button>

            {isSubscribed && (
              <button
                onClick={handleTestNotification}
                disabled={isLoading || testSent}
                className="w-full py-2.5 px-4 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {testSent ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    테스트 알림 전송됨
                  </>
                ) : (
                  "테스트 알림 보내기"
                )}
              </button>
            )}
          </>
        ) : null}
      </div>

      {/* 안내 텍스트 */}
      <p className="mt-4 text-xs text-slate-400 text-center">
        알림을 통해 새로운 상담, 주문, 공지사항 등을 받아볼 수 있습니다.
      </p>
    </div>
  );
}
