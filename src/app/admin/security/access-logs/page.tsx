"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  History,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Clock,
  Globe,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";

interface AccessLog {
  id: string;
  timestamp: string;
  email: string;
  userName: string;
  action: "login" | "logout" | "failed_login" | "password_reset";
  ip: string;
  userAgent: string;
  success: boolean;
  latitude?: number;
  longitude?: number;
}

interface Stats {
  todayLogins: number;
  weeklyLogins: number;
  uniqueUsers: number;
  failedLogins: number;
  suspiciousAccess: number;
}

export default function AccessLogsPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats>({
    todayLogins: 0,
    weeklyLogins: 0,
    uniqueUsers: 0,
    failedLogins: 0,
    suspiciousAccess: 0,
  });

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/login-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "stats" }),
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("통계 로드 실패:", error);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });

      if (searchQuery) params.set("search", searchQuery);
      if (dateRange.start) params.set("startDate", dateRange.start);
      if (dateRange.end) params.set("endDate", dateRange.end);

      const response = await fetch(`/api/admin/login-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("로그 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, dateRange]);

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [loadLogs, loadStats]);

  const handleSearch = () => {
    setPage(1);
    loadLogs();
  };

  const handleRefresh = () => {
    loadLogs();
    loadStats();
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const parseUserAgent = (ua: string) => {
    if (!ua || ua === "unknown") return "Unknown";

    let browser = "Unknown";
    let os = "Unknown";

    if (ua.includes("Chrome") && !ua.includes("Edge")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edge")) browser = "Edge";

    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    return `${browser} / ${os}`;
  };

  const getActionIcon = (action: string, success: boolean) => {
    if (!success) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    switch (action) {
      case "login":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "logout":
        return <Clock className="w-4 h-4 text-slate-500" />;
      case "password_reset":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      login: { label: "로그인", color: "bg-emerald-100 text-emerald-700" },
      logout: { label: "로그아웃", color: "bg-slate-100 text-slate-700" },
      failed_login: { label: "로그인 실패", color: "bg-red-100 text-red-700" },
      password_reset: {
        label: "비밀번호 재설정",
        color: "bg-amber-100 text-amber-700",
      },
    };
    return labels[action] || { label: action, color: "bg-slate-100 text-slate-700" };
  };

  const filteredLogs = filterAction === "all"
    ? logs
    : logs.filter((log) => log.action === filterAction);

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

  if (loginUser.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <History className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">접속 이력</h1>
              <p className="text-slate-500">시스템 접속 및 인증 기록</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <Download className="w-4 h-4" />
            내보내기
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-slate-500">오늘 로그인</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {stats.todayLogins}회
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-blue-500" />
              <span className="text-slate-500">주간 로그인</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {stats.weeklyLogins}회
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-violet-500" />
              <span className="text-slate-500">오늘 고유 사용자</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {stats.uniqueUsers}명
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <History className="w-5 h-5 text-slate-500" />
              <span className="text-slate-500">전체 기록</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {total.toLocaleString()}건
            </p>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-200"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="이메일 또는 IP로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <span className="text-slate-400">~</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              검색
            </button>
            <button
              onClick={handleRefresh}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              title="새로고침"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </motion.div>

        {/* Logs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    시간
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    사용자
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    활동
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    IP
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    브라우저/OS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      {isLoading ? "로딩 중..." : "로그인 기록이 없습니다"}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const actionInfo = getActionLabel(log.action);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-500 font-mono whitespace-nowrap">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action, log.success)}
                            <div>
                              <p className="text-sm font-medium text-slate-700">
                                {log.userName}
                              </p>
                              <p className="text-xs text-slate-400">{log.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${actionInfo.color}`}
                          >
                            {actionInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                          {log.ip}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {parseUserAgent(log.userAgent)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-500">
                총 {total.toLocaleString()}건 중 {((page - 1) * 50) + 1} - {Math.min(page * 50, total)}건
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
