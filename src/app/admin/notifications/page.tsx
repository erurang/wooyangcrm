"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";
import { useGlobalToast } from "@/context/toast";

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

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

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
            <div className="p-3 bg-blue-100 rounded-xl">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">알림 트리거</h1>
              <p className="text-slate-500">자동 알림 스케줄 및 이벤트 관리</p>
            </div>
          </div>
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
              <Clock className="w-5 h-5 text-blue-500" />
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
                        ? "bg-blue-100"
                        : "bg-violet-100"
                    }`}
                  >
                    {trigger.type === "scheduled" ? (
                      <Calendar
                        className={`w-5 h-5 ${
                          trigger.type === "scheduled"
                            ? "text-blue-600"
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
                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <ToggleRight className="w-8 h-8 text-blue-500" />
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
          className="bg-blue-50 rounded-xl p-4 border border-blue-200"
        >
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">트리거 관리 안내</p>
              <ul className="text-sm text-blue-600 mt-2 space-y-1 list-disc list-inside">
                <li>스케줄 트리거는 설정된 시간에 자동으로 실행됩니다.</li>
                <li>이벤트 트리거는 해당 이벤트 발생 시 즉시 실행됩니다.</li>
                <li>&quot;지금 실행&quot; 버튼으로 수동 실행할 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
