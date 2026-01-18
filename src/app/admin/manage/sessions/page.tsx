"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Monitor,
  Smartphone,
  Globe,
  Clock,
  LogOut,
  RefreshCw,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  User,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";
import { useGlobalToast } from "@/context/toast";

interface Session {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  device: "desktop" | "mobile" | "tablet";
  browser: string;
  ip: string;
  location: string;
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
  isCurrent: boolean;
}

export default function AdminSessionsPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const toast = useGlobalToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSessions([
        {
          id: "1",
          userId: "u1",
          userName: "관리자",
          userRole: "admin",
          device: "desktop",
          browser: "Chrome 120",
          ip: "192.168.1.100",
          location: "서울, 대한민국",
          loginTime: "2025-01-18 09:00",
          lastActivity: "방금 전",
          isActive: true,
          isCurrent: true,
        },
        {
          id: "2",
          userId: "u2",
          userName: "김영업",
          userRole: "sales",
          device: "desktop",
          browser: "Chrome 120",
          ip: "192.168.1.101",
          location: "서울, 대한민국",
          loginTime: "2025-01-18 08:45",
          lastActivity: "5분 전",
          isActive: true,
          isCurrent: false,
        },
        {
          id: "3",
          userId: "u3",
          userName: "이기술",
          userRole: "research",
          device: "mobile",
          browser: "Safari Mobile",
          ip: "192.168.1.102",
          location: "부산, 대한민국",
          loginTime: "2025-01-18 10:15",
          lastActivity: "2분 전",
          isActive: true,
          isCurrent: false,
        },
        {
          id: "4",
          userId: "u4",
          userName: "박관리",
          userRole: "managementSupport",
          device: "desktop",
          browser: "Firefox 122",
          ip: "192.168.1.103",
          location: "인천, 대한민국",
          loginTime: "2025-01-18 09:30",
          lastActivity: "15분 전",
          isActive: true,
          isCurrent: false,
        },
        {
          id: "5",
          userId: "u5",
          userName: "최지원",
          userRole: "sales",
          device: "tablet",
          browser: "Safari 17",
          ip: "192.168.1.104",
          location: "대전, 대한민국",
          loginTime: "2025-01-18 08:00",
          lastActivity: "30분 전",
          isActive: false,
          isCurrent: false,
        },
        {
          id: "6",
          userId: "u6",
          userName: "정연구",
          userRole: "research",
          device: "desktop",
          browser: "Edge 120",
          ip: "192.168.1.105",
          location: "광주, 대한민국",
          loginTime: "2025-01-18 07:30",
          lastActivity: "1시간 전",
          isActive: false,
          isCurrent: false,
        },
      ]);

      setIsLoading(false);
    };

    loadSessions();
  }, []);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      // Refresh logic would go here
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleForceLogout = async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    if (session.isCurrent) {
      toast.error("현재 세션은 종료할 수 없습니다.");
      return;
    }

    const confirm = window.confirm(
      `"${session.userName}" 사용자의 세션을 강제 종료하시겠습니까?`
    );

    if (!confirm) return;

    setSessions(sessions.filter((s) => s.id !== sessionId));
    toast.success("세션이 종료되었습니다.");
  };

  const handleLogoutAll = async () => {
    const confirm = window.confirm(
      "현재 세션을 제외한 모든 세션을 종료하시겠습니까?"
    );

    if (!confirm) return;

    setSessions(sessions.filter((s) => s.isCurrent));
    toast.success("모든 세션이 종료되었습니다.");
  };

  if (isLoading || !loginUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
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

  const activeSessions = sessions.filter((s) => s.isActive);
  const inactiveSessions = sessions.filter((s) => !s.isActive);

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case "desktop":
        return <Monitor className="w-5 h-5" />;
      case "mobile":
        return <Smartphone className="w-5 h-5" />;
      case "tablet":
        return <Smartphone className="w-5 h-5 rotate-90" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, { label: string; color: string }> = {
      admin: { label: "관리자", color: "bg-red-100 text-red-700" },
      sales: { label: "영업", color: "bg-blue-100 text-blue-700" },
      research: { label: "연구실", color: "bg-violet-100 text-violet-700" },
      managementSupport: {
        label: "경영지원",
        color: "bg-emerald-100 text-emerald-700",
      },
    };
    return roles[role] || { label: role, color: "bg-slate-100 text-slate-700" };
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">접속 현황</h1>
              <p className="text-slate-500">실시간 사용자 접속 상태 모니터링</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                autoRefresh
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`}
              />
              자동 갱신
            </button>
            <button
              onClick={handleLogoutAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              전체 로그아웃
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <Wifi className="w-5 h-5 text-emerald-500" />
              <span className="text-slate-500">온라인</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {activeSessions.length}명
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <WifiOff className="w-5 h-5 text-slate-400" />
              <span className="text-slate-500">오프라인</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {inactiveSessions.length}명
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <Monitor className="w-5 h-5 text-blue-500" />
              <span className="text-slate-500">데스크톱</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {sessions.filter((s) => s.device === "desktop").length}명
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <Smartphone className="w-5 h-5 text-violet-500" />
              <span className="text-slate-500">모바일</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {sessions.filter((s) => s.device !== "desktop").length}명
            </p>
          </motion.div>
        </div>

        {/* Active Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200"
        >
          <div className="p-4 border-b border-slate-200 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <h2 className="font-semibold text-slate-800">
              활성 세션 ({activeSessions.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {activeSessions.map((session) => {
              const roleInfo = getRoleLabel(session.userRole);
              return (
                <div
                  key={session.id}
                  className={`p-4 flex items-center justify-between hover:bg-slate-50 ${
                    session.isCurrent ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        session.isActive ? "bg-emerald-100" : "bg-slate-100"
                      }`}
                    >
                      {getDeviceIcon(session.device)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800">
                          {session.userName}
                        </p>
                        {session.isCurrent && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            현재 세션
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${roleInfo.color}`}
                        >
                          {roleInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {session.browser}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {session.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.lastActivity}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-500">{session.ip}</p>
                      <p className="text-xs text-slate-400">
                        로그인: {session.loginTime}
                      </p>
                    </div>
                    {!session.isCurrent && (
                      <button
                        onClick={() => handleForceLogout(session.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="강제 로그아웃"
                      >
                        <LogOut className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Inactive Sessions */}
        {inactiveSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200"
          >
            <div className="p-4 border-b border-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-slate-800">
                비활성 세션 ({inactiveSessions.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {inactiveSessions.map((session) => {
                const roleInfo = getRoleLabel(session.userRole);
                return (
                  <div
                    key={session.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 opacity-60"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-slate-100">
                        {getDeviceIcon(session.device)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800">
                            {session.userName}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${roleInfo.color}`}
                          >
                            {roleInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {session.browser}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            마지막 활동: {session.lastActivity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-slate-500">{session.ip}</p>
                        <p className="text-xs text-slate-400">
                          로그인: {session.loginTime}
                        </p>
                      </div>
                      <button
                        onClick={() => handleForceLogout(session.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="세션 종료"
                      >
                        <LogOut className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
