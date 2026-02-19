"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
  Globe,
  Server,
  Filter,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";

interface ApiLog {
  id: string;
  user_id: string | null;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  ip_address: string | null;
  user_agent: string | null;
  error_message: string | null;
  created_at: string;
  users?: { name: string } | null;
}

interface ApiStats {
  today: {
    totalCalls: number;
    successCalls: number;
    errorCalls: number;
    avgResponseTime: number;
    successRate: number;
  };
  topEndpoints: { endpoint: string; count: number }[];
}

interface EndpointStats {
  endpoint: string;
  method: string;
  totalCalls: number;
  avgResponseTime: number;
  successRate: number;
  lastCalled: string;
  status: "healthy" | "degraded" | "down";
}

// 컴포넌트 외부에 정의하여 useCallback 내에서 사용 가능하도록 함
const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;

  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
};

export default function ApiMonitorPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [endpointStats, setEndpointStats] = useState<EndpointStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "healthy" | "degraded" | "down">("all");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchEndpoint, setSearchEndpoint] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (searchEndpoint) params.append("endpoint", searchEndpoint);
      if (filterMethod) params.append("method", filterMethod);
      if (filterStatus) params.append("statusCode", filterStatus);
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);

      const response = await fetch(`/api/admin/logs/api?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("API 로그 조회 실패:", error);
    }
  }, [page, searchEndpoint, filterMethod, filterStatus, dateRange]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/logs/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "stats" }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setStats(data);

      // API에서 제공하는 실제 엔드포인트별 통계 사용
      const epStats: EndpointStats[] = (data.topEndpoints || []).map(
        (ep: {
          endpoint: string;
          count: number;
          method: string;
          avgResponseTime: number;
          successRate: number;
          lastCalled: string;
          status: "healthy" | "degraded" | "down";
        }) => ({
          endpoint: ep.endpoint,
          method: ep.method,
          totalCalls: ep.count,
          avgResponseTime: ep.avgResponseTime,
          successRate: ep.successRate,
          lastCalled: formatRelativeTime(ep.lastCalled),
          status: ep.status,
        })
      );
      setEndpointStats(epStats);
    } catch (error) {
      console.error("API 통계 조회 실패:", error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchLogs(), fetchStats()]);
    setIsLoading(false);
  }, [fetchLogs, fetchStats]);

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  useEffect(() => {
    if (loginUser?.role === "admin") {
      loadData();
    }
  }, [loginUser, loadData]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  // 필터 변경 시 데이터 다시 로드
  useEffect(() => {
    if (loginUser?.role === "admin") {
      fetchLogs();
    }
  }, [page, searchEndpoint, filterMethod, filterStatus, dateRange, fetchLogs, loginUser]);

  if (isLoading || !loginUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
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

  const filteredEndpoints = endpointStats.filter(
    (ep) => filter === "all" || ep.status === filter
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "degraded":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "down":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-sky-100 text-sky-700",
      POST: "bg-emerald-100 text-emerald-700",
      PUT: "bg-amber-100 text-amber-700",
      DELETE: "bg-red-100 text-red-700",
      PATCH: "bg-violet-100 text-violet-700",
    };
    return colors[method] || "bg-slate-100 text-slate-700";
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-emerald-600";
    if (status >= 400 && status < 500) return "text-amber-600";
    if (status >= 500) return "text-red-600";
    return "text-slate-600";
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-100 rounded-xl">
              <Activity className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">API 모니터링</h1>
              <p className="text-slate-500">실시간 API 상태 및 성능 모니터링</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              새로고침
            </button>
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
              자동 새로고침 {autoRefresh ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-5 h-5 text-sky-500" />
              <span className="text-slate-500">오늘 API 호출</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {(stats?.today.totalCalls || 0).toLocaleString()}
            </p>
            <div className="flex items-center gap-1 mt-1 text-sm text-emerald-600">
              <TrendingUp className="w-4 h-4" />
              실시간 집계
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span className="text-slate-500">평균 응답시간</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {stats?.today.avgResponseTime || 0}ms
            </p>
            <div className="flex items-center gap-1 mt-1 text-sm text-emerald-600">
              <TrendingDown className="w-4 h-4" />
              오늘 평균
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-slate-500">성공률</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {stats?.today.successRate || 0}%
            </p>
            <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
              성공: {stats?.today.successCalls || 0} / 오류: {stats?.today.errorCalls || 0}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <Server className="w-5 h-5 text-violet-500" />
              <span className="text-slate-500">활성 엔드포인트</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {stats?.topEndpoints?.length || 0}
            </p>
            <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
              오늘 호출된 엔드포인트
            </div>
          </motion.div>
        </div>

        {/* Top Endpoints */}
        {endpointStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                상위 엔드포인트 (오늘)
              </h2>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as typeof filter)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="all">전체</option>
                  <option value="healthy">정상</option>
                  <option value="degraded">성능 저하</option>
                  <option value="down">중단</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                      상태
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                      엔드포인트
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                      메서드
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                      호출 수
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                      평균 응답시간
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                      성공률
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                      마지막 호출
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEndpoints.map((endpoint) => (
                    <tr key={endpoint.endpoint} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        {getStatusIcon(endpoint.status)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-slate-700">
                          {endpoint.endpoint}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-mono ${getMethodColor(
                            endpoint.method
                          )}`}
                        >
                          {endpoint.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {endpoint.totalCalls.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm ${
                            endpoint.avgResponseTime > 300
                              ? "text-amber-600"
                              : "text-slate-700"
                          }`}
                        >
                          {endpoint.avgResponseTime}ms
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm ${
                            endpoint.successRate < 98
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {endpoint.successRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {endpoint.lastCalled}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="엔드포인트 검색..."
                value={searchEndpoint}
                onChange={(e) => {
                  setSearchEndpoint(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterMethod}
              onChange={(e) => {
                setFilterMethod(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="">모든 메서드</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="">모든 상태</option>
              <option value="200">성공 (2xx)</option>
              <option value="400">클라이언트 오류 (4xx)</option>
              <option value="500">서버 오류 (5xx)</option>
            </select>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => {
                  setDateRange({ ...dateRange, start: e.target.value });
                  setPage(1);
                }}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              <span className="text-slate-400">~</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => {
                  setDateRange({ ...dateRange, end: e.target.value });
                  setPage(1);
                }}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>

        {/* Recent Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200"
        >
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">API 호출 로그</h2>
            <span className="text-sm text-slate-500">
              페이지 {page} / {totalPages}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    시간
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    요청
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    상태
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    응답시간
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    사용자
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      API 로그가 없습니다
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-700">{formatTime(log.created_at)}</div>
                        <div className="text-xs text-slate-400">{formatDate(log.created_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-mono ${getMethodColor(
                              log.method
                            )}`}
                          >
                            {log.method}
                          </span>
                          <span className="font-mono text-sm text-slate-700 truncate max-w-xs">
                            {log.endpoint}
                          </span>
                        </div>
                        {log.error_message && (
                          <div className="text-xs text-red-500 mt-1 truncate max-w-xs">
                            {log.error_message}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-mono ${getStatusColor(log.status_code)}`}>
                          {log.status_code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm ${
                            log.response_time_ms > 500
                              ? "text-red-600"
                              : log.response_time_ms > 300
                              ? "text-amber-600"
                              : "text-slate-700"
                          }`}
                        >
                          {log.response_time_ms}ms
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {log.users?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 font-mono">
                        {log.ip_address || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm ${
                        page === pageNum
                          ? "bg-sky-600 text-white"
                          : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
