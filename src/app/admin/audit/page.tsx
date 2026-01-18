"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  User,
  Calendar,
  Clock,
  ChevronRight,
  FileText,
  Building,
  Users,
  Settings,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: "create" | "read" | "update" | "delete";
  resourceType: string;
  resourceId: string;
  resourceName: string;
  changes?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  ip: string;
  userAgent: string;
}

export default function AuditLogPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterResource, setFilterResource] = useState<string>("all");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

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
          timestamp: "2025-01-18 14:35:20",
          userId: "u1",
          userName: "관리자",
          userRole: "admin",
          action: "update",
          resourceType: "user",
          resourceId: "u2",
          resourceName: "김영업",
          changes: [
            { field: "role", oldValue: "sales", newValue: "admin" },
            { field: "department", oldValue: "영업1팀", newValue: "영업기획팀" },
          ],
          ip: "192.168.1.100",
          userAgent: "Chrome 120 / Windows",
        },
        {
          id: "2",
          timestamp: "2025-01-18 14:30:15",
          userId: "u2",
          userName: "김영업",
          userRole: "sales",
          action: "create",
          resourceType: "company",
          resourceId: "c123",
          resourceName: "(주)테스트기업",
          ip: "192.168.1.101",
          userAgent: "Chrome 120 / macOS",
        },
        {
          id: "3",
          timestamp: "2025-01-18 14:25:00",
          userId: "u3",
          userName: "이기술",
          userRole: "research",
          action: "delete",
          resourceType: "document",
          resourceId: "d456",
          resourceName: "견적서-2025-0001",
          ip: "192.168.1.102",
          userAgent: "Safari / iOS",
        },
        {
          id: "4",
          timestamp: "2025-01-18 14:20:45",
          userId: "u1",
          userName: "관리자",
          userRole: "admin",
          action: "update",
          resourceType: "settings",
          resourceId: "sys",
          resourceName: "시스템 설정",
          changes: [
            { field: "sessionTimeout", oldValue: "30", newValue: "60" },
            { field: "maxLoginAttempts", oldValue: "3", newValue: "5" },
          ],
          ip: "192.168.1.100",
          userAgent: "Chrome 120 / Windows",
        },
        {
          id: "5",
          timestamp: "2025-01-18 14:15:30",
          userId: "u4",
          userName: "박관리",
          userRole: "managementSupport",
          action: "read",
          resourceType: "report",
          resourceId: "r789",
          resourceName: "2025년 1월 매출 리포트",
          ip: "192.168.1.103",
          userAgent: "Firefox 122 / Windows",
        },
        {
          id: "6",
          timestamp: "2025-01-18 14:10:00",
          userId: "u2",
          userName: "김영업",
          userRole: "sales",
          action: "update",
          resourceType: "company",
          resourceId: "c100",
          resourceName: "(주)우양테크",
          changes: [
            { field: "address", oldValue: "서울시 강남구", newValue: "서울시 송파구" },
            { field: "phone", oldValue: "02-1234-5678", newValue: "02-9876-5432" },
          ],
          ip: "192.168.1.101",
          userAgent: "Chrome 120 / macOS",
        },
      ]);

      setIsLoading(false);
    };

    loadLogs();
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create":
        return <Plus className="w-4 h-4 text-emerald-500" />;
      case "read":
        return <Eye className="w-4 h-4 text-blue-500" />;
      case "update":
        return <Edit className="w-4 h-4 text-amber-500" />;
      case "delete":
        return <Trash2 className="w-4 h-4 text-red-500" />;
      default:
        return <Eye className="w-4 h-4 text-slate-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      create: { label: "생성", color: "bg-emerald-100 text-emerald-700" },
      read: { label: "조회", color: "bg-blue-100 text-blue-700" },
      update: { label: "수정", color: "bg-amber-100 text-amber-700" },
      delete: { label: "삭제", color: "bg-red-100 text-red-700" },
    };
    return labels[action] || { label: action, color: "bg-slate-100 text-slate-700" };
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="w-4 h-4" />;
      case "company":
        return <Building className="w-4 h-4" />;
      case "document":
        return <FileText className="w-4 h-4" />;
      case "settings":
        return <Settings className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (
      searchQuery &&
      !log.userName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.resourceName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (filterAction !== "all" && log.action !== filterAction) {
      return false;
    }
    if (filterResource !== "all" && log.resourceType !== filterResource) {
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
            <div className="p-3 bg-amber-100 rounded-xl">
              <ScrollText className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">감사 로그</h1>
              <p className="text-slate-500">시스템 내 모든 변경 사항 추적</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
            <Download className="w-4 h-4" />
            내보내기
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "생성", count: logs.filter((l) => l.action === "create").length, color: "emerald" },
            { label: "조회", count: logs.filter((l) => l.action === "read").length, color: "blue" },
            { label: "수정", count: logs.filter((l) => l.action === "update").length, color: "amber" },
            { label: "삭제", count: logs.filter((l) => l.action === "delete").length, color: "red" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
            >
              <p className="text-2xl font-bold text-slate-800">{stat.count}건</p>
              <p className="text-sm text-slate-500 mt-1">오늘 {stat.label}</p>
            </motion.div>
          ))}
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
                placeholder="사용자 또는 리소스 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="all">모든 활동</option>
                <option value="create">생성</option>
                <option value="read">조회</option>
                <option value="update">수정</option>
                <option value="delete">삭제</option>
              </select>
              <select
                value={filterResource}
                onChange={(e) => setFilterResource(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="all">모든 리소스</option>
                <option value="user">사용자</option>
                <option value="company">거래처</option>
                <option value="document">문서</option>
                <option value="settings">설정</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Audit Logs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200"
        >
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const actionInfo = getActionLabel(log.action);
              const isExpanded = expandedLog === log.id;
              return (
                <div key={log.id}>
                  <button
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-slate-100">
                        {getActionIcon(log.action)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">
                            {log.userName}
                          </span>
                          <span className="text-slate-400">님이</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${actionInfo.color}`}
                          >
                            {actionInfo.label}
                          </span>
                          <span className="text-slate-400">함</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                          {getResourceIcon(log.resourceType)}
                          <span>{log.resourceName}</span>
                          <span className="text-slate-300">|</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {log.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="px-4 pb-4"
                    >
                      <div className="bg-slate-50 rounded-xl p-4 ml-12 space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">사용자 ID:</span>
                            <span className="ml-2 text-slate-700">{log.userId}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">역할:</span>
                            <span className="ml-2 text-slate-700">{log.userRole}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">IP:</span>
                            <span className="ml-2 text-slate-700 font-mono">
                              {log.ip}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">환경:</span>
                            <span className="ml-2 text-slate-700">
                              {log.userAgent}
                            </span>
                          </div>
                        </div>

                        {log.changes && log.changes.length > 0 && (
                          <div className="border-t border-slate-200 pt-3">
                            <p className="text-sm font-medium text-slate-700 mb-2">
                              변경 내역
                            </p>
                            <div className="space-y-2">
                              {log.changes.map((change, idx) => (
                                <div
                                  key={idx}
                                  className="text-sm bg-white p-2 rounded-lg"
                                >
                                  <span className="font-medium text-slate-700">
                                    {change.field}:
                                  </span>
                                  <span className="ml-2 text-red-500 line-through">
                                    {change.oldValue}
                                  </span>
                                  <span className="mx-2 text-slate-400">→</span>
                                  <span className="text-emerald-600">
                                    {change.newValue}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
