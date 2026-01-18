"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";

interface AccessLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: "login" | "logout" | "failed_login" | "password_reset";
  ip: string;
  location: string;
  userAgent: string;
  success: boolean;
  reason?: string;
}

export default function AccessLogsPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setLogs([
        {
          id: "1",
          timestamp: "2025-01-18 14:32:15",
          userId: "u1",
          userName: "관리자",
          action: "login",
          ip: "192.168.1.100",
          location: "서울, 대한민국",
          userAgent: "Chrome 120 / Windows",
          success: true,
        },
        {
          id: "2",
          timestamp: "2025-01-18 14:30:00",
          userId: "u2",
          userName: "김영업",
          action: "login",
          ip: "192.168.1.101",
          location: "서울, 대한민국",
          userAgent: "Chrome 120 / macOS",
          success: true,
        },
        {
          id: "3",
          timestamp: "2025-01-18 14:28:45",
          userId: "unknown",
          userName: "알 수 없음",
          action: "failed_login",
          ip: "203.0.113.50",
          location: "해외",
          userAgent: "Unknown",
          success: false,
          reason: "잘못된 비밀번호 (3회 시도)",
        },
        {
          id: "4",
          timestamp: "2025-01-18 14:15:30",
          userId: "u3",
          userName: "이기술",
          action: "logout",
          ip: "192.168.1.102",
          location: "부산, 대한민국",
          userAgent: "Safari / iOS",
          success: true,
        },
        {
          id: "5",
          timestamp: "2025-01-18 13:45:00",
          userId: "u4",
          userName: "박관리",
          action: "password_reset",
          ip: "192.168.1.103",
          location: "인천, 대한민국",
          userAgent: "Firefox 122 / Windows",
          success: true,
        },
        {
          id: "6",
          timestamp: "2025-01-18 12:00:00",
          userId: "unknown",
          userName: "test@example.com",
          action: "failed_login",
          ip: "185.199.110.1",
          location: "해외 (미국)",
          userAgent: "Bot",
          success: false,
          reason: "존재하지 않는 계정",
        },
        {
          id: "7",
          timestamp: "2025-01-18 10:30:15",
          userId: "u5",
          userName: "최지원",
          action: "login",
          ip: "192.168.1.104",
          location: "대전, 대한민국",
          userAgent: "Safari / macOS",
          success: true,
        },
      ]);

      setIsLoading(false);
    };

    loadLogs();
  }, []);

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

  const filteredLogs = logs.filter((log) => {
    if (searchQuery && !log.userName.toLowerCase().includes(searchQuery.toLowerCase()) && !log.ip.includes(searchQuery)) {
      return false;
    }
    if (filterAction !== "all" && log.action !== filterAction) {
      return false;
    }
    return true;
  });

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
              {logs.filter((l) => l.action === "login" && l.success).length}회
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-slate-500">로그인 실패</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {logs.filter((l) => l.action === "failed_login").length}회
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-blue-500" />
              <span className="text-slate-500">고유 사용자</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {new Set(logs.filter((l) => l.userId !== "unknown").map((l) => l.userId)).size}명
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span className="text-slate-500">의심 접근</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {logs.filter((l) => l.location.includes("해외")).length}회
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
                placeholder="사용자 또는 IP로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체</option>
                <option value="login">로그인</option>
                <option value="logout">로그아웃</option>
                <option value="failed_login">로그인 실패</option>
                <option value="password_reset">비밀번호 재설정</option>
              </select>
            </div>
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
                    위치
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    상세
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const actionInfo = getActionLabel(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-500 font-mono">
                        {log.timestamp}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action, log.success)}
                          <span className="text-sm text-slate-700">
                            {log.userName}
                          </span>
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <MapPin className="w-3 h-3" />
                          {log.location}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {log.reason || log.userAgent}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
