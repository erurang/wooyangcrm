"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import {
  Trash2,
  Check,
  X,
  AlertTriangle,
  Eye,
  Building,
  User,
  FileText,
  MessageSquare,
  Beaker,
  Newspaper,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";
import { useGlobalToast } from "@/context/toast";

type DeletionRequest = {
  id: string;
  request_date: string;
  user_id: string;
  content: Record<string, string>;
  delete_reason: string;
  type: string;
  related_id: string;
};

type UserType = {
  id: string;
  name: string;
  level: string;
};

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  companies: { label: "거래처", icon: Building, color: "text-blue-600", bgColor: "bg-blue-100" },
  contacts: { label: "담당자", icon: User, color: "text-green-600", bgColor: "bg-green-100" },
  documents: { label: "문서", icon: FileText, color: "text-purple-600", bgColor: "bg-purple-100" },
  consultations: { label: "상담", icon: MessageSquare, color: "text-orange-600", bgColor: "bg-orange-100" },
  rnds: { label: "R&D", icon: Beaker, color: "text-cyan-600", bgColor: "bg-cyan-100" },
  posts: { label: "게시글", icon: Newspaper, color: "text-amber-600", bgColor: "bg-amber-100" },
};

export default function DeletionRequestsPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const toast = useGlobalToast();

  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [users, setUsers] = useState<Record<string, UserType>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Modal state
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const requestsPerPage = 10;

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  useEffect(() => {
    fetchRequests();
  }, [currentPage, filterType]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      // Get total count
      let countQuery = supabase
        .from("deletion_requests")
        .select("*", { count: "exact", head: true });

      if (filterType !== "all") {
        countQuery = countQuery.eq("type", filterType);
      }

      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Get paginated data
      let dataQuery = supabase
        .from("deletion_requests")
        .select("*")
        .order("request_date", { ascending: false })
        .range((currentPage - 1) * requestsPerPage, currentPage * requestsPerPage - 1);

      if (filterType !== "all") {
        dataQuery = dataQuery.eq("type", filterType);
      }

      const { data, error } = await dataQuery;

      if (error) throw error;
      setRequests(data || []);

      // Fetch users
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((req) => req.user_id))];
        const { data: usersData } = await supabase
          .from("users")
          .select("id, name, level")
          .in("id", userIds);

        if (usersData) {
          const usersMap = Object.fromEntries(usersData.map((user) => [user.id, user]));
          setUsers(usersMap);
        }
      }
    } catch (error) {
      console.error("Error fetching deletion requests:", error);
      toast.error("삭제 요청 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (req: DeletionRequest) => {
    setIsDeleting(true);
    try {
      const requesterInfo = users[req.user_id];
      const contentValue = Object.values(req.content)[0] || "";

      // 삭제 승인 로그 기록 (요청자 정보 포함)
      await supabase.from("logs").insert({
        table_name: req.type,
        operation: "DELETE",
        record_id: req.related_id,
        old_data: {
          ...req.content,
          _deletion_request: {
            requested_by: req.user_id,
            requested_by_name: requesterInfo?.name || "알 수 없음",
            requested_by_level: requesterInfo?.level || "",
            request_date: req.request_date,
            delete_reason: req.delete_reason,
          },
        },
        new_data: null,
        changed_by: loginUser?.id,
      });

      if (req.type === "companies") {
        const companyId = req.related_id;

        // 1. 상담 관련 데이터 삭제
        const { data: consultations } = await supabase
          .from("consultations")
          .select("id")
          .eq("company_id", companyId);

        const consultationIds = consultations?.map((c) => c.id) || [];

        if (consultationIds.length > 0) {
          await supabase.from("file_downloads").delete().in("consultation_id", consultationIds);
          await supabase.from("consultation_files").delete().in("consultation_id", consultationIds);
          await supabase.from("contacts_consultations").delete().in("consultation_id", consultationIds);
          await supabase.from("documents").delete().in("consultation_id", consultationIds);
          await supabase.from("consultations").delete().eq("company_id", companyId);
        }

        // 2. 회사 직접 연결된 문서 삭제
        await supabase.from("documents").delete().eq("company_id", companyId);

        // 3. 담당자 관련 데이터 삭제
        const { data: contacts } = await supabase.from("contacts").select("id").eq("company_id", companyId);
        const contactIds = contacts?.map((c) => c.id) || [];

        if (contactIds.length > 0) {
          await supabase.from("contacts_documents").delete().in("contact_id", contactIds);
          await supabase.from("contacts_consultations").delete().in("contact_id", contactIds);
          await supabase.from("contacts").delete().eq("company_id", companyId);
        }

        // 4. 기타 데이터 삭제
        await supabase.from("favorites").delete().eq("item_id", companyId);
        await supabase.from("inventory_tasks").delete().eq("company_id", companyId);

        // 5. 최종 회사 삭제
        await supabase.from("companies").delete().eq("id", companyId);
      } else if (req.type === "documents") {
        await supabase.from("contacts_documents").delete().eq("document_id", req.related_id);
        await supabase.from("documents").delete().eq("id", req.related_id);
      } else if (req.type === "contacts") {
        await supabase.from("contacts_documents").delete().eq("contact_id", req.related_id);
        await supabase.from("contacts_consultations").delete().eq("contact_id", req.related_id);
        await supabase.from("contacts").delete().eq("id", req.related_id);
      } else if (req.type === "consultations") {
        await supabase.from("consultations").delete().eq("id", req.related_id);
      } else if (req.type === "rnds") {
        await supabase.from("rnds").delete().eq("id", req.related_id);
      } else if (req.type === "posts") {
        await supabase.from("posts").update({ deleted_at: new Date().toISOString() }).eq("id", req.related_id);
      }

      // 삭제 요청 제거
      await supabase.from("deletion_requests").delete().eq("id", req.id);

      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      setTotalCount((prev) => prev - 1);
      setSelectedRequest(null);
      toast.success("삭제가 승인되었습니다.");
    } catch (error) {
      console.error("Error approving deletion:", error);
      toast.error("삭제 처리 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await supabase.from("deletion_requests").delete().eq("id", id);
      setRequests((prev) => prev.filter((req) => req.id !== id));
      setTotalCount((prev) => prev - 1);
      setSelectedRequest(null);
      toast.success("삭제 요청이 거부되었습니다.");
    } catch (error) {
      console.error("Error rejecting deletion:", error);
      toast.error("거부 처리 중 오류가 발생했습니다.");
    }
  };

  const getTypeConfig = (type: string) => {
    return TYPE_CONFIG[type] || { label: type, icon: FileText, color: "text-slate-600", bgColor: "bg-slate-100" };
  };

  const totalPages = Math.ceil(totalCount / requestsPerPage);

  const filteredRequests = requests.filter((req) => {
    if (!searchQuery) return true;
    const user = users[req.user_id];
    const searchLower = searchQuery.toLowerCase();
    const contentValue = Object.values(req.content)[0] || "";
    return (
      user?.name?.toLowerCase().includes(searchLower) ||
      contentValue.toLowerCase().includes(searchLower) ||
      req.delete_reason?.toLowerCase().includes(searchLower)
    );
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
            <div className="p-3 bg-red-100 rounded-xl">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">삭제 요청 관리</h1>
              <p className="text-slate-500">사용자들의 데이터 삭제 요청을 검토합니다</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">총 {totalCount}개 요청</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(TYPE_CONFIG).map(([type, config]) => {
            const count = requests.filter((r) => r.type === type).length;
            return (
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border border-slate-200 bg-white cursor-pointer hover:shadow-md transition-shadow ${
                  filterType === type ? "ring-2 ring-violet-500" : ""
                }`}
                onClick={() => setFilterType(filterType === type ? "all" : type)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                    <config.icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <span className="text-xs text-slate-500">{config.label}</span>
                </div>
                <p className="text-xl font-bold text-slate-800">{count}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="요청자, 내용, 사유로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="all">전체 타입</option>
              {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                <option key={type} value={type}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Requests List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          {filteredRequests.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredRequests.map((req) => {
                const user = users[req.user_id] || { name: "알 수 없음", level: "" };
                const typeConfig = getTypeConfig(req.type);
                const contentValue = Object.values(req.content)[0] || "";

                return (
                  <motion.div
                    key={req.id}
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedRequest(req)}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${typeConfig.bgColor}`}>
                          <typeConfig.icon className={`w-5 h-5 ${typeConfig.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${typeConfig.bgColor} ${typeConfig.color}`}>
                              {typeConfig.label}
                            </span>
                            <span className="text-sm font-medium text-slate-800 max-w-[300px] truncate">
                              {contentValue}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {user.name} {user.level}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(req.request_date).toLocaleDateString("ko-KR")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(req);
                          }}
                          className="p-2 text-slate-400 hover:text-violet-500 hover:bg-violet-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("삭제를 승인하시겠습니까?")) {
                              handleApprove(req);
                            }
                          }}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("삭제 요청을 거부하시겠습니까?")) {
                              handleReject(req.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {req.delete_reason && (
                      <p className="mt-2 ml-14 text-sm text-slate-600 line-clamp-1">
                        사유: {req.delete_reason}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">삭제 요청이 없습니다</p>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm text-slate-600">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedRequest(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${getTypeConfig(selectedRequest.type).bgColor}`}>
                      {(() => {
                        const Icon = getTypeConfig(selectedRequest.type).icon;
                        return <Icon className={`w-6 h-6 ${getTypeConfig(selectedRequest.type).color}`} />;
                      })()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">삭제 요청 상세</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeConfig(selectedRequest.type).bgColor} ${getTypeConfig(selectedRequest.type).color}`}>
                        {getTypeConfig(selectedRequest.type).label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                {/* Target Content */}
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-sm font-medium text-red-600 mb-1">삭제 대상</p>
                  <p className="text-lg font-semibold text-red-800">
                    {Object.values(selectedRequest.content)[0]}
                  </p>
                </div>

                {/* Request Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">요청자</span>
                    <span className="text-sm font-medium text-slate-800">
                      {users[selectedRequest.user_id]?.name || "알 수 없음"}{" "}
                      {users[selectedRequest.user_id]?.level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">요청일시</span>
                    <span className="text-sm font-medium text-slate-800">
                      {new Date(selectedRequest.request_date).toLocaleString("ko-KR")}
                    </span>
                  </div>
                  {selectedRequest.delete_reason && (
                    <div className="py-2">
                      <p className="text-sm text-slate-500 mb-1">삭제 사유</p>
                      <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg">
                        {selectedRequest.delete_reason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Warning */}
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">주의</p>
                    <p className="text-xs text-amber-700 mt-1">
                      {selectedRequest.type === "companies"
                        ? "거래처를 삭제하면 관련된 모든 상담, 문서, 담당자 정보가 함께 삭제됩니다."
                        : "이 작업은 되돌릴 수 없습니다."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => handleReject(selectedRequest.id)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-medium"
                >
                  거부
                </button>
                <button
                  onClick={() => handleApprove(selectedRequest)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      삭제 승인
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
