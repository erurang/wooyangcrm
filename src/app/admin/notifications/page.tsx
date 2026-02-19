"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Play,
  Pause,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  Calendar,
  Mail,
  MessageSquare,
  ToggleLeft,
  ToggleRight,
  Send,
  Users,
  X,
  Search,
  Check,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";
import { useGlobalToast } from "@/context/toast";

interface User {
  id: string;
  name: string;
  level: string;
  position: string;
}

interface NotificationTrigger {
  id: string;
  name: string;
  description: string;
  type: "scheduled" | "event";
  enabled: boolean;
  schedule?: string;
  event?: string;
  lastRun?: string;
  nextRun?: string;
  status: "active" | "paused" | "error";
}

export default function NotificationTriggersPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const toast = useGlobalToast();
  const [triggers, setTriggers] = useState<NotificationTrigger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runningTrigger, setRunningTrigger] = useState<string | null>(null);

  // 수동 알림 발송 관련 state
  const [showSendModal, setShowSendModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  // 사용자 목록 로드
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (error) {
        console.error("사용자 목록 로드 실패:", error);
      }
    };
    loadUsers();
  }, []);

  // 알림 발송 함수
  const handleSendNotification = async () => {
    if (selectedUsers.length === 0) {
      toast.error("수신자를 선택해주세요");
      return;
    }
    if (!notificationTitle.trim()) {
      toast.error("알림 제목을 입력해주세요");
      return;
    }
    if (!notificationMessage.trim()) {
      toast.error("알림 내용을 입력해주세요");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_ids: selectedUsers,
          title: notificationTitle,
          message: notificationMessage,
          sender_id: loginUser?.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setShowSendModal(false);
        setSelectedUsers([]);
        setNotificationTitle("");
        setNotificationMessage("");
      } else {
        toast.error(data.error || "알림 발송 실패");
      }
    } catch (error) {
      console.error("알림 발송 에러:", error);
      toast.error("알림 발송 중 오류가 발생했습니다");
    } finally {
      setIsSending(false);
    }
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    const filtered = users.filter(
      (u) =>
        u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (u.position && u.position.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
        (u.level && u.level.toLowerCase().includes(userSearchQuery.toLowerCase()))
    );
    if (selectedUsers.length === filtered.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filtered.map((u) => u.id));
    }
  };

  // 사용자 선택 토글
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // 필터링된 사용자 목록
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.position && u.position.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
      (u.level && u.level.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  useEffect(() => {
    const loadTriggers = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setTriggers([
        {
          id: "1",
          name: "일일 리마인더",
          description: "마감 예정 문서 및 후속 상담 알림",
          type: "scheduled",
          enabled: true,
          schedule: "매일 오전 9:00",
          lastRun: "2025-01-18 09:00",
          nextRun: "2025-01-19 09:00",
          status: "active",
        },
        {
          id: "2",
          name: "주간 리포트",
          description: "주간 업무 현황 요약 메일 발송",
          type: "scheduled",
          enabled: true,
          schedule: "매주 월요일 오전 8:00",
          lastRun: "2025-01-13 08:00",
          nextRun: "2025-01-20 08:00",
          status: "active",
        },
        {
          id: "3",
          name: "견적서 만료 알림",
          description: "만료 3일 전 견적서 알림",
          type: "scheduled",
          enabled: true,
          schedule: "매일 오전 10:00",
          lastRun: "2025-01-18 10:00",
          nextRun: "2025-01-19 10:00",
          status: "active",
        },
        {
          id: "4",
          name: "신규 거래처 등록",
          description: "신규 거래처 등록 시 관리자 알림",
          type: "event",
          enabled: true,
          event: "company.created",
          lastRun: "2025-01-18 14:30",
          status: "active",
        },
        {
          id: "5",
          name: "문서 승인 요청",
          description: "문서 승인 요청 시 담당자 알림",
          type: "event",
          enabled: true,
          event: "document.pending_approval",
          lastRun: "2025-01-18 11:45",
          status: "active",
        },
        {
          id: "6",
          name: "월간 실적 리포트",
          description: "월간 영업 실적 자동 생성",
          type: "scheduled",
          enabled: false,
          schedule: "매월 1일 오전 7:00",
          lastRun: "2025-01-01 07:00",
          nextRun: "2025-02-01 07:00",
          status: "paused",
        },
      ]);

      setIsLoading(false);
    };

    loadTriggers();
  }, []);

  const handleToggle = (triggerId: string) => {
    setTriggers(
      triggers.map((t) =>
        t.id === triggerId
          ? {
              ...t,
              enabled: !t.enabled,
              status: !t.enabled ? "active" : "paused",
            }
          : t
      )
    );
    const trigger = triggers.find((t) => t.id === triggerId);
    toast.success(
      `"${trigger?.name}" ${trigger?.enabled ? "비활성화" : "활성화"}되었습니다.`
    );
  };

  const handleRunNow = async (triggerId: string) => {
    const trigger = triggers.find((t) => t.id === triggerId);
    if (!trigger) return;

    setRunningTrigger(triggerId);
    toast.info(`"${trigger.name}" 실행 중...`);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    setTriggers(
      triggers.map((t) =>
        t.id === triggerId
          ? { ...t, lastRun: new Date().toLocaleString("ko-KR") }
          : t
      )
    );

    setRunningTrigger(null);
    toast.success(`"${trigger.name}" 실행이 완료되었습니다.`);
  };

  if (isLoading || !loginUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="h-64 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loginUser?.role !== "admin") {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "paused":
        return <Pause className="w-4 h-4 text-slate-400" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-100 rounded-xl">
              <Bell className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">알림 트리거</h1>
              <p className="text-slate-500">자동 알림 스케줄 및 이벤트 관리</p>
            </div>
          </div>
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Send className="w-4 h-4" />
            수동 알림 발송
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-slate-500">활성</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {triggers.filter((t) => t.enabled).length}개
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-sky-500" />
              <span className="text-slate-500">스케줄</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {triggers.filter((t) => t.type === "scheduled").length}개
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-violet-500" />
              <span className="text-slate-500">이벤트</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {triggers.filter((t) => t.type === "event").length}개
            </p>
          </motion.div>
        </div>

        {/* Triggers List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200"
        >
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">알림 트리거 목록</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {triggers.map((trigger) => (
              <div
                key={trigger.id}
                className={`p-4 flex items-center justify-between ${
                  !trigger.enabled ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      trigger.type === "scheduled"
                        ? "bg-sky-100"
                        : "bg-violet-100"
                    }`}
                  >
                    {trigger.type === "scheduled" ? (
                      <Calendar
                        className={`w-5 h-5 ${
                          trigger.type === "scheduled"
                            ? "text-sky-600"
                            : "text-violet-600"
                        }`}
                      />
                    ) : (
                      <MessageSquare className="w-5 h-5 text-violet-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{trigger.name}</p>
                      {getStatusIcon(trigger.status)}
                    </div>
                    <p className="text-sm text-slate-500">{trigger.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      {trigger.schedule && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {trigger.schedule}
                        </span>
                      )}
                      {trigger.event && (
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                          {trigger.event}
                        </span>
                      )}
                      {trigger.lastRun && <span>마지막: {trigger.lastRun}</span>}
                      {trigger.nextRun && <span>다음: {trigger.nextRun}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleRunNow(trigger.id)}
                    disabled={!trigger.enabled || runningTrigger === trigger.id}
                    className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="지금 실행"
                  >
                    {runningTrigger === trigger.id ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleToggle(trigger.id)}
                    className="flex items-center"
                  >
                    {trigger.enabled ? (
                      <ToggleRight className="w-8 h-8 text-sky-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-sky-50 rounded-xl p-4 border border-sky-200"
        >
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-sky-500 mt-0.5" />
            <div>
              <p className="font-medium text-sky-800">트리거 관리 안내</p>
              <ul className="text-sm text-sky-600 mt-2 space-y-1 list-disc list-inside">
                <li>스케줄 트리거는 설정된 시간에 자동으로 실행됩니다.</li>
                <li>이벤트 트리거는 해당 이벤트 발생 시 즉시 실행됩니다.</li>
                <li>&quot;지금 실행&quot; 버튼으로 수동 실행할 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 수동 알림 발송 모달 */}
      <AnimatePresence>
        {showSendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={() => setShowSendModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-sky-600" />
                  <h3 className="text-lg font-semibold text-slate-800">
                    수동 알림 발송
                  </h3>
                </div>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 모달 내용 */}
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {/* 수신자 선택 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    수신자 선택 <span className="text-red-500">*</span>
                    <span className="ml-2 text-sky-600 font-normal">
                      ({selectedUsers.length}명 선택됨)
                    </span>
                  </label>

                  {/* 검색 및 전체 선택 */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="이름 또는 직책으로 검색..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      {selectedUsers.length === filteredUsers.length
                        ? "전체 해제"
                        : "전체 선택"}
                    </button>
                  </div>

                  {/* 사용자 목록 */}
                  <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-sm">
                        검색 결과가 없습니다
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {filteredUsers.map((user) => (
                          <label
                            key={user.id}
                            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 ${
                              selectedUsers.includes(user.id) ? "bg-sky-50" : ""
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded border flex items-center justify-center ${
                                selectedUsers.includes(user.id)
                                  ? "bg-sky-600 border-sky-600"
                                  : "border-slate-300"
                              }`}
                              onClick={() => toggleUserSelection(user.id)}
                            >
                              {selectedUsers.includes(user.id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-slate-800">
                                {user.name}
                              </span>
                              <span className="text-sm text-slate-500 ml-2">
                                {user.level} {user.position && `/ ${user.position}`}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 알림 제목 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    알림 제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    placeholder="알림 제목을 입력하세요"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* 알림 내용 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    알림 내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder="알림 내용을 입력하세요"
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                  />
                </div>

                {/* 미리보기 */}
                {(notificationTitle || notificationMessage) && (
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="text-xs text-slate-500 mb-2">알림 미리보기</p>
                    <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                      <div className="flex items-start gap-2">
                        <div className="p-1.5 bg-sky-100 rounded-lg">
                          <Bell className="w-4 h-4 text-sky-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {notificationTitle || "제목"}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            [{loginUser?.name || "관리자"}]{" "}
                            {notificationMessage || "내용"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 모달 푸터 */}
              <div className="flex items-center justify-end gap-2 p-4 border-t bg-slate-50">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSendNotification}
                  disabled={isSending || selectedUsers.length === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      발송 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {selectedUsers.length}명에게 발송
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
