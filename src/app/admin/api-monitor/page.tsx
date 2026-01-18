"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Clock,
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
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";

interface ApiEndpoint {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  avgResponseTime: number;
  totalCalls: number;
  successRate: number;
  lastCalled: string;
  status: "healthy" | "degraded" | "down";
}

interface ApiLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  responseTime: number;
  user: string;
}

export default function ApiMonitorPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "healthy" | "degraded" | "down">("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setEndpoints([
        {
          path: "/api/companies",
          method: "GET",
          avgResponseTime: 120,
          totalCalls: 15420,
          successRate: 99.8,
          lastCalled: "1분 전",
          status: "healthy",
        },
        {
          path: "/api/consultations",
          method: "GET",
          avgResponseTime: 85,
          totalCalls: 12350,
          successRate: 99.9,
          lastCalled: "2분 전",
          status: "healthy",
        },
        {
          path: "/api/documents",
          method: "POST",
          avgResponseTime: 450,
          totalCalls: 3200,
          successRate: 98.5,
          lastCalled: "5분 전",
          status: "healthy",
        },
        {
          path: "/api/users",
          method: "GET",
          avgResponseTime: 250,
          totalCalls: 8500,
          successRate: 95.2,
          lastCalled: "3분 전",
          status: "degraded",
        },
        {
          path: "/api/inventory",
          method: "GET",
          avgResponseTime: 180,
          totalCalls: 5600,
          successRate: 99.5,
          lastCalled: "1분 전",
          status: "healthy",
        },
        {
          path: "/api/notifications",
          method: "POST",
          avgResponseTime: 320,
          totalCalls: 2100,
          successRate: 97.8,
          lastCalled: "8분 전",
          status: "healthy",
        },
      ]);

      setLogs([
        {
          id: "1",
          timestamp: "2025-01-18 14:32:15",
          method: "GET",
          path: "/api/companies",
          status: 200,
          responseTime: 115,
          user: "김영업",
        },
        {
          id: "2",
          timestamp: "2025-01-18 14:32:10",
          method: "POST",
          path: "/api/consultations",
          status: 201,
          responseTime: 230,
          user: "이기술",
        },
        {
          id: "3",
          timestamp: "2025-01-18 14:32:05",
          method: "GET",
          path: "/api/documents",
          status: 200,
          responseTime: 95,
          user: "박관리",
        },
        {
          id: "4",
          timestamp: "2025-01-18 14:32:00",
          method: "PUT",
          path: "/api/users/abc123",
          status: 500,
          responseTime: 1520,
          user: "최지원",
        },
        {
          id: "5",
          timestamp: "2025-01-18 14:31:55",
          method: "GET",
          path: "/api/inventory",
          status: 200,
          responseTime: 145,
          user: "김영업",
        },
        {
          id: "6",
          timestamp: "2025-01-18 14:31:50",
          method: "DELETE",
          path: "/api/notifications/xyz789",
          status: 204,
          responseTime: 80,
          user: "관리자",
        },
        {
          id: "7",
          timestamp: "2025-01-18 14:31:45",
          method: "GET",
          path: "/api/companies",
          status: 200,
          responseTime: 125,
          user: "이기술",
        },
      ]);

      setIsLoading(false);
    };

    loadData();
  }, []);

  // Auto refresh simulation
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      // In real implementation, this would fetch new data
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (isLoading || !loginUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
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

  const filteredEndpoints = endpoints.filter(
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
      GET: "bg-blue-100 text-blue-700",
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

  const stats = {
    totalCalls: endpoints.reduce((sum, ep) => sum + ep.totalCalls, 0),
    avgResponseTime: Math.round(
      endpoints.reduce((sum, ep) => sum + ep.avgResponseTime, 0) / endpoints.length
    ),
    successRate:
      (
        endpoints.reduce((sum, ep) => sum + ep.successRate, 0) / endpoints.length
      ).toFixed(1),
    healthyEndpoints: endpoints.filter((ep) => ep.status === "healthy").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">API 모니터링</h1>
              <p className="text-slate-500">실시간 API 상태 및 성능 모니터링</p>
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
              <Globe className="w-5 h-5 text-blue-500" />
              <span className="text-slate-500">총 API 호출</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {stats.totalCalls.toLocaleString()}
            </p>
            <div className="flex items-center gap-1 mt-1 text-sm text-emerald-600">
              <TrendingUp className="w-4 h-4" />
              +12.5% 이번 주
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
              {stats.avgResponseTime}ms
            </p>
            <div className="flex items-center gap-1 mt-1 text-sm text-emerald-600">
              <TrendingDown className="w-4 h-4" />
              -8.2% 개선
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
              {stats.successRate}%
            </p>
            <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
              목표: 99.5%
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
              <span className="text-slate-500">정상 엔드포인트</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {stats.healthyEndpoints}/{endpoints.length}
            </p>
            <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
              {endpoints.filter((ep) => ep.status === "degraded").length > 0 &&
                `${endpoints.filter((ep) => ep.status === "degraded").length}개 성능 저하`}
            </div>
          </motion.div>
        </div>

        {/* Endpoints Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200"
        >
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              엔드포인트 상태
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    평균 응답시간
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    총 호출
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
                  <tr key={`${endpoint.method}-${endpoint.path}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      {getStatusIcon(endpoint.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-mono ${getMethodColor(
                            endpoint.method
                          )}`}
                        >
                          {endpoint.method}
                        </span>
                        <span className="font-mono text-sm text-slate-700">
                          {endpoint.path}
                        </span>
                      </div>
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
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {endpoint.totalCalls.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm ${
                          endpoint.successRate < 98
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {endpoint.successRate}%
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

        {/* Recent Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200"
        >
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">최근 API 로그</h2>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-500 font-mono">
                      {log.timestamp.split(" ")[1]}
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
                        <span className="font-mono text-sm text-slate-700">
                          {log.path}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-mono ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm ${
                          log.responseTime > 500
                            ? "text-red-600"
                            : log.responseTime > 300
                            ? "text-amber-600"
                            : "text-slate-700"
                        }`}
                      >
                        {log.responseTime}ms
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{log.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
