"use client";

import { useState, useEffect, useCallback } from "react";
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
  ChevronLeft,
  FileText,
  Building,
  Users,
  Settings,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUsersList } from "@/hooks/useUserList";
import {
  diff_match_patch,
  DIFF_INSERT,
  DIFF_DELETE,
} from "diff-match-patch";

interface AuditLog {
  id: string;
  table_name: string;
  operation: string;
  record_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_at: string;
  changed_by?: string;
}

interface Stats {
  insert: number;
  update: number;
  delete: number;
  total: number;
}

export default function AuditLogPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const { users } = useUsersList();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOperation, setFilterOperation] = useState<string>("all");
  const [filterTable, setFilterTable] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats>({ insert: 0, update: 0, delete: 0, total: 0 });
  const limit = 20;

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  const loadStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data } = await supabase
        .from("logs")
        .select("operation")
        .gte("changed_at", `${today}T00:00:00`);

      if (data) {
        const insertCount = data.filter(d => d.operation === "INSERT").length;
        const updateCount = data.filter(d => d.operation === "UPDATE").length;
        const deleteCount = data.filter(d => d.operation === "DELETE").length;

        setStats({
          insert: insertCount,
          update: updateCount,
          delete: deleteCount,
          total: data.length,
        });
      }
    } catch (error) {
      console.error("통계 로드 실패:", error);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("logs")
        .select("*", { count: "exact" })
        .order("changed_at", { ascending: false });

      if (filterOperation !== "all") {
        query = query.eq("operation", filterOperation);
      }
      if (filterTable !== "all") {
        query = query.eq("table_name", filterTable);
      }
      if (filterUser) {
        query = query.eq("changed_by", filterUser);
      }

      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;

      if (error) throw error;

      setLogs(data || []);
      setTotal(count || 0);
      setTotalPages(Math.ceil((count || 0) / limit));
    } catch (error) {
      console.error("로그 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterOperation, filterTable, filterUser]);

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [loadLogs, loadStats]);

  const handleRefresh = () => {
    loadLogs();
    loadStats();
  };

  const getUserName = (log: AuditLog) => {
    const userId = log.changed_by ||
      (log.new_data?.user_id as string) ||
      (log.old_data?.user_id as string) ||
      null;

    if (!userId) return "시스템";

    const user = users.find((u: { id: string; name: string }) => u.id === userId);
    return user ? user.name : "Unknown";
  };

  const formatDate = (utcDate: string) => {
    const date = new Date(utcDate);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Seoul",
    }).format(date);
  };

  const highlightDiff = (oldText: string, newText: string) => {
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(oldText, newText);
    dmp.diff_cleanupSemantic(diffs);

    return diffs.map(([operation, text], index) => {
      if (operation === DIFF_INSERT) {
        return (
          <span key={index} className="bg-emerald-100 text-emerald-800 px-1 rounded">
            {text}
          </span>
        );
      } else if (operation === DIFF_DELETE) {
        return (
          <span key={index} className="bg-red-100 text-red-800 px-1 rounded line-through">
            {text}
          </span>
        );
      } else {
        return <span key={index}>{text}</span>;
      }
    });
  };

  const getChanges = (
    oldData: Record<string, unknown> | null,
    newData: Record<string, unknown> | null
  ) => {
    if (!oldData || !newData) return null;

    const changedFields: { field: string; oldValue: string; newValue: string }[] = [];

    Object.keys(newData).forEach((key) => {
      if (
        oldData[key] !== undefined &&
        JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])
      ) {
        changedFields.push({
          field: key,
          oldValue: JSON.stringify(oldData[key], null, 2),
          newValue: JSON.stringify(newData[key], null, 2),
        });
      }
    });

    return changedFields.length > 0 ? changedFields : null;
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case "INSERT":
        return <Plus className="w-4 h-4 text-emerald-500" />;
      case "UPDATE":
        return <Edit className="w-4 h-4 text-amber-500" />;
      case "DELETE":
        return <Trash2 className="w-4 h-4 text-red-500" />;
      default:
        return <Eye className="w-4 h-4 text-slate-500" />;
    }
  };

  const getOperationLabel = (operation: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      INSERT: { label: "생성", color: "bg-emerald-100 text-emerald-700" },
      UPDATE: { label: "수정", color: "bg-amber-100 text-amber-700" },
      DELETE: { label: "삭제", color: "bg-red-100 text-red-700" },
    };
    return labels[operation] || { label: operation, color: "bg-slate-100 text-slate-700" };
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case "users":
        return <User className="w-4 h-4" />;
      case "companies":
        return <Building className="w-4 h-4" />;
      case "documents":
        return <FileText className="w-4 h-4" />;
      case "consultations":
        return <MessageSquare className="w-4 h-4" />;
      case "posts":
      case "post_comments":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getTableLabel = (tableName: string) => {
    const labels: Record<string, string> = {
      documents: "문서",
      consultations: "상담",
      companies: "거래처",
      users: "사용자",
      posts: "게시글",
      post_comments: "댓글",
      contacts: "담당자",
    };
    return labels[tableName] || tableName;
  };

  const getRecordName = (log: AuditLog) => {
    const data = log.new_data || log.old_data;
    if (!data) return log.record_id?.slice(0, 8) || "-";

    if (data.title && typeof data.title === "string") return data.title;
    if (data.name && typeof data.name === "string") return data.name;
    if (data.content && typeof data.content === "string") {
      return data.content.length > 30 ? data.content.slice(0, 30) + "..." : data.content;
    }
    if (data.doc_number && typeof data.doc_number === "string") return data.doc_number;

    return log.record_id?.slice(0, 8) || "-";
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const userName = getUserName(log).toLowerCase();
    const recordName = getRecordName(log).toLowerCase();
    return userName.includes(query) || recordName.includes(query);
  });

  if (isLoading && logs.length === 0) {
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
              <p className="text-slate-500">시스템 내 모든 데이터 변경 기록</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              title="새로고침"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
              <Download className="w-4 h-4" />
              내보내기
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
            <div className="flex items-center gap-2 mb-2">
              <Plus className="w-5 h-5 text-emerald-500" />
              <span className="text-slate-500">오늘 생성</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.insert}건</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Edit className="w-5 h-5 text-amber-500" />
              <span className="text-slate-500">오늘 수정</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.update}건</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              <span className="text-slate-500">오늘 삭제</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.delete}건</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <ScrollText className="w-5 h-5 text-violet-500" />
              <span className="text-slate-500">전체 기록</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{total.toLocaleString()}건</p>
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
                placeholder="사용자 또는 리소스 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterOperation}
                onChange={(e) => { setFilterOperation(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="all">모든 작업</option>
                <option value="INSERT">생성</option>
                <option value="UPDATE">수정</option>
                <option value="DELETE">삭제</option>
              </select>
              <select
                value={filterTable}
                onChange={(e) => { setFilterTable(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="all">모든 테이블</option>
                <option value="documents">문서</option>
                <option value="consultations">상담</option>
                <option value="companies">거래처</option>
                <option value="posts">게시글</option>
                <option value="post_comments">댓글</option>
              </select>
              <select
                value={filterUser}
                onChange={(e) => { setFilterUser(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">전체 사용자</option>
                {users.map((user: { id: string; name: string }) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
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
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                {isLoading ? "로딩 중..." : "로그가 없습니다"}
              </div>
            ) : (
              filteredLogs.map((log) => {
                const operationInfo = getOperationLabel(log.operation);
                const isExpanded = expandedLog === log.id;
                const changes = log.operation === "UPDATE" ? getChanges(log.old_data, log.new_data) : null;

                return (
                  <div key={log.id}>
                    <button
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-50 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-slate-100">
                          {getOperationIcon(log.operation)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-800">
                              {getUserName(log)}
                            </span>
                            <span className="text-slate-400">님이</span>
                            {/* 삭제 요청자가 있는 경우 표시 */}
                            {log.operation === "DELETE" && (log.old_data as any)?._deletion_request?.requested_by_name && (
                              <>
                                <span className="font-medium text-orange-600">
                                  {(log.old_data as any)._deletion_request.requested_by_name}
                                </span>
                                <span className="text-slate-400">님의 요청으로</span>
                              </>
                            )}
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${operationInfo.color}`}
                            >
                              {operationInfo.label}
                            </span>
                            <span className="text-slate-400">함</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                            {getTableIcon(log.table_name)}
                            <span className="font-medium">{getTableLabel(log.table_name)}</span>
                            <span className="text-slate-300">|</span>
                            <span>{getRecordName(log)}</span>
                            <span className="text-slate-300">|</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(log.changed_at)}
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
                          {/* 삭제 요청자 정보 표시 */}
                          {log.operation === "DELETE" && (log.old_data as any)?._deletion_request && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                              <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                삭제 요청 정보
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <User className="w-3.5 h-3.5 text-red-500" />
                                  <span className="text-slate-600">요청자:</span>
                                  <span className="font-medium text-slate-800">
                                    {(log.old_data as any)._deletion_request.requested_by_name}{" "}
                                    {(log.old_data as any)._deletion_request.requested_by_level}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-red-500" />
                                  <span className="text-slate-600">요청일:</span>
                                  <span className="font-medium text-slate-800">
                                    {new Date((log.old_data as any)._deletion_request.request_date).toLocaleDateString("ko-KR")}
                                  </span>
                                </div>
                                {(log.old_data as any)._deletion_request.delete_reason && (
                                  <div className="col-span-2 mt-1">
                                    <span className="text-slate-600">사유: </span>
                                    <span className="text-slate-800">
                                      {(log.old_data as any)._deletion_request.delete_reason}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {changes ? (
                            <div>
                              <p className="text-sm font-medium text-slate-700 mb-2">
                                변경 내역
                              </p>
                              <div className="space-y-2">
                                {changes.map((change, idx) => (
                                  <div
                                    key={idx}
                                    className="text-sm bg-white p-3 rounded-lg border border-slate-200"
                                  >
                                    <span className="font-medium text-slate-700">
                                      {change.field}:
                                    </span>
                                    <div className="mt-1 text-sm">
                                      {highlightDiff(change.oldValue, change.newValue)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium text-slate-700 mb-2">
                                데이터
                              </p>
                              <pre className="text-xs bg-white p-3 rounded-lg border border-slate-200 overflow-x-auto">
                                {JSON.stringify(log.new_data || log.old_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-500">
                총 {total.toLocaleString()}건 중 {((page - 1) * limit) + 1} - {Math.min(page * limit, total)}건
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
