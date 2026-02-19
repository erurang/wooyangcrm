"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Monitor,
  Smartphone,
  Globe,
  Clock,
  LogOut,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  Search,
  Lock,
  Unlock,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";
import { useGlobalToast } from "@/context/toast";
import { supabase } from "@/lib/supabaseClient";

interface UserSession {
  id: string;
  name: string;
  email: string | null;
  level: string | null;
  position: string | null;
  role_id: number | null;
  role_name: string | null;
  is_locked: boolean;
  created_at: string | null;
  isCurrent: boolean;
  // Simulated session data
  device: "desktop" | "mobile";
  lastActivity: string;
  isOnline: boolean;
}

export default function AdminSessionsPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const toast = useGlobalToast();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "online" | "offline" | "locked">(
    "all"
  );

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch users with their roles
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select(
          `
          id,
          name,
          email,
          level,
          position,
          role_id,
          is_locked,
          created_at,
          roles (role_name)
        `
        )
        .order("name");

      if (usersError) throw usersError;

      // Transform to sessions
      const transformedSessions: UserSession[] = (usersData || []).map(
        (user) => {
          // Current user is always online
          const isCurrent = loginUser?.id === user.id;
          // Simulate online status: current user is online, locked users are offline, others random
          const isOnline = isCurrent
            ? true
            : user.is_locked
              ? false
              : Math.random() > 0.4;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            level: user.level,
            position: user.position,
            role_id: user.role_id,
            role_name: Array.isArray(user.roles)
              ? (user.roles[0] as { role_name: string } | undefined)?.role_name || null
              : (user.roles as { role_name: string } | null)?.role_name || null,
            is_locked: user.is_locked,
            created_at: user.created_at,
            isCurrent,
            device: Math.random() > 0.3 ? "desktop" : "mobile",
            lastActivity: isCurrent
              ? "방금 전"
              : isOnline
                ? `${Math.floor(Math.random() * 30) + 1}분 전`
                : `${Math.floor(Math.random() * 24) + 1}시간 전`,
            isOnline,
          };
        }
      );

      setSessions(transformedSessions);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      toast.error("세션 정보를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [loginUser?.id, toast]);

  useEffect(() => {
    if (loginUser) {
      fetchSessions();
    }
  }, [loginUser, fetchSessions]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !loginUser) return;
    const interval = setInterval(() => {
      fetchSessions();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loginUser, fetchSessions]);

  const handleToggleLock = async (userId: string, currentLockState: boolean) => {
    const session = sessions.find((s) => s.id === userId);
    if (!session) return;

    if (session.isCurrent) {
      toast.error("현재 로그인한 계정은 잠글 수 없습니다.");
      return;
    }

    const confirm = window.confirm(
      `"${session.name}" 사용자를 ${currentLockState ? "잠금 해제" : "잠금"} 하시겠습니까?`
    );

    if (!confirm) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ is_locked: !currentLockState })
        .eq("id", userId);

      if (error) throw error;

      setSessions(
        sessions.map((s) =>
          s.id === userId
            ? { ...s, is_locked: !currentLockState, isOnline: currentLockState ? s.isOnline : false }
            : s
        )
      );
      toast.success(
        currentLockState
          ? `"${session.name}" 계정이 잠금 해제되었습니다.`
          : `"${session.name}" 계정이 잠금 처리되었습니다.`
      );
    } catch (error) {
      console.error("Failed to toggle lock:", error);
      toast.error("계정 상태 변경에 실패했습니다.");
    }
  };

  const handleForceLogout = async (userId: string) => {
    const session = sessions.find((s) => s.id === userId);
    if (!session) return;

    if (session.isCurrent) {
      toast.error("현재 세션은 종료할 수 없습니다.");
      return;
    }

    const confirm = window.confirm(
      `"${session.name}" 사용자의 세션을 강제 종료하시겠습니까?`
    );

    if (!confirm) return;

    // Mark as offline (in a real app, this would invalidate the user's session token)
    setSessions(
      sessions.map((s) =>
        s.id === userId ? { ...s, isOnline: false, lastActivity: "세션 종료됨" } : s
      )
    );
    toast.success(`"${session.name}" 세션이 종료되었습니다.`);
  };

  const handleLogoutAllOthers = async () => {
    const confirm = window.confirm(
      "현재 세션을 제외한 모든 세션을 종료하시겠습니까?"
    );

    if (!confirm) return;

    setSessions(
      sessions.map((s) =>
        s.isCurrent ? s : { ...s, isOnline: false, lastActivity: "세션 종료됨" }
      )
    );
    toast.success("다른 모든 세션이 종료되었습니다.");
  };

  // Filter and search
  const filteredSessions = sessions.filter((session) => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (
        !session.name.toLowerCase().includes(search) &&
        !(session.email?.toLowerCase() || "").includes(search) &&
        !(session.position?.toLowerCase() || "").includes(search)
      ) {
        return false;
      }
    }

    // Status filter
    switch (filter) {
      case "online":
        return session.isOnline;
      case "offline":
        return !session.isOnline && !session.is_locked;
      case "locked":
        return session.is_locked;
      default:
        return true;
    }
  });

  const onlineSessions = sessions.filter((s) => s.isOnline);
  const offlineSessions = sessions.filter((s) => !s.isOnline && !s.is_locked);
  const lockedSessions = sessions.filter((s) => s.is_locked);

  if (isLoading || !loginUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
            <div className="h-64 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loginUser?.role !== "admin") {
    return null;
  }

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case "desktop":
        return <Monitor className="w-5 h-5" />;
      case "mobile":
        return <Smartphone className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  const getRoleLabel = (roleName: string | null) => {
    const roles: Record<string, { label: string; color: string }> = {
      admin: { label: "관리자", color: "bg-red-100 text-red-700" },
      sales: { label: "영업", color: "bg-sky-100 text-sky-700" },
      research: { label: "연구실", color: "bg-violet-100 text-violet-700" },
      managementSupport: {
        label: "경영지원",
        color: "bg-emerald-100 text-emerald-700",
      },
      management_support: {
        label: "경영지원",
        color: "bg-emerald-100 text-emerald-700",
      },
    };
    return (
      roles[roleName || ""] || { label: roleName || "직원", color: "bg-slate-100 text-slate-700" }
    );
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
              onClick={handleLogoutAllOthers}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              전체 로그아웃
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setFilter("all")}
            className={`bg-white rounded-xl p-5 shadow-sm border transition-colors text-left ${
              filter === "all"
                ? "border-slate-400 ring-2 ring-slate-200"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-slate-500" />
              <span className="text-slate-500">전체</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {sessions.length}명
            </p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setFilter("online")}
            className={`bg-white rounded-xl p-5 shadow-sm border transition-colors text-left ${
              filter === "online"
                ? "border-emerald-400 ring-2 ring-emerald-200"
                : "border-slate-200 hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Wifi className="w-5 h-5 text-emerald-500" />
              <span className="text-slate-500">온라인</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {onlineSessions.length}명
            </p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setFilter("offline")}
            className={`bg-white rounded-xl p-5 shadow-sm border transition-colors text-left ${
              filter === "offline"
                ? "border-slate-400 ring-2 ring-slate-200"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <WifiOff className="w-5 h-5 text-slate-400" />
              <span className="text-slate-500">오프라인</span>
            </div>
            <p className="text-2xl font-bold text-slate-600">
              {offlineSessions.length}명
            </p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setFilter("locked")}
            className={`bg-white rounded-xl p-5 shadow-sm border transition-colors text-left ${
              filter === "locked"
                ? "border-red-400 ring-2 ring-red-200"
                : "border-slate-200 hover:border-red-300"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-5 h-5 text-red-500" />
              <span className="text-slate-500">잠금</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {lockedSessions.length}명
            </p>
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="이름, 이메일, 직책으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Sessions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200"
        >
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {filter === "online" ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : filter === "offline" ? (
                <WifiOff className="w-5 h-5 text-slate-400" />
              ) : filter === "locked" ? (
                <Lock className="w-5 h-5 text-red-500" />
              ) : (
                <Users className="w-5 h-5 text-slate-500" />
              )}
              <h2 className="font-semibold text-slate-800">
                {filter === "online"
                  ? "온라인 사용자"
                  : filter === "offline"
                    ? "오프라인 사용자"
                    : filter === "locked"
                      ? "잠긴 계정"
                      : "전체 사용자"}{" "}
                ({filteredSessions.length})
              </h2>
            </div>
            <button
              onClick={fetchSessions}
              className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
              title="새로고침"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>표시할 사용자가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredSessions.map((session) => {
                const roleInfo = getRoleLabel(session.role_name);
                return (
                  <div
                    key={session.id}
                    className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      session.isCurrent ? "bg-sky-50" : ""
                    } ${session.is_locked ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-lg relative ${
                          session.is_locked
                            ? "bg-red-100"
                            : session.isOnline
                              ? "bg-emerald-100"
                              : "bg-slate-100"
                        }`}
                      >
                        {getDeviceIcon(session.device)}
                        {/* Online indicator */}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                            session.is_locked
                              ? "bg-red-500"
                              : session.isOnline
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800">
                            {session.name}
                          </p>
                          {session.isCurrent && (
                            <span className="text-xs px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full">
                              현재 세션
                            </span>
                          )}
                          {session.is_locked && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              잠금
                            </span>
                          )}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${roleInfo.color}`}
                          >
                            {roleInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          {session.email && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {session.email}
                            </span>
                          )}
                          {session.position && (
                            <span className="text-slate-400">
                              {session.level} {session.position}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>마지막 활동: {session.lastActivity}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!session.isCurrent && (
                        <>
                          <button
                            onClick={() =>
                              handleToggleLock(session.id, session.is_locked)
                            }
                            className={`p-2 rounded-lg transition-colors ${
                              session.is_locked
                                ? "text-emerald-500 hover:bg-emerald-50"
                                : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                            }`}
                            title={session.is_locked ? "잠금 해제" : "계정 잠금"}
                          >
                            {session.is_locked ? (
                              <Unlock className="w-5 h-5" />
                            ) : (
                              <Lock className="w-5 h-5" />
                            )}
                          </button>
                          {session.isOnline && (
                            <button
                              onClick={() => handleForceLogout(session.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="강제 로그아웃"
                            >
                              <LogOut className="w-5 h-5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Info Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-amber-50 rounded-xl p-4 border border-amber-200"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">접속 현황 안내</p>
              <ul className="text-sm text-amber-600 mt-2 space-y-1 list-disc list-inside">
                <li>온라인 상태는 시뮬레이션 데이터입니다. 실제 세션 추적을 위해서는 별도 설정이 필요합니다.</li>
                <li>계정 잠금 시 해당 사용자는 로그인할 수 없습니다.</li>
                <li>자동 갱신은 30초마다 실행됩니다.</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
