"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

type DeletionRequest = {
  id: string;
  request_date: string;
  user_id: string;
  content: Record<string, string>;
  delete_reason: string;
};

type User = {
  id: string;
  name: string;
  level: string;
};

export default function DeletionRequestsPage() {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(10);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from("deletion_requests")
        .select("*")
        .range(
          (currentPage - 1) * requestsPerPage,
          currentPage * requestsPerPage - 1
        );
      if (error) console.error("Error fetching deletion requests:", error);
      else setRequests(data);
    };

    fetchRequests();
  }, [currentPage]);

  useEffect(() => {
    const fetchUsers = async () => {
      const userIds = requests.map((req) => req.user_id);
      const { data, error } = await supabase
        .from("users")
        .select("id, name, level")
        .in("id", userIds);
      if (error) console.error("Error fetching users:", error);
      else {
        const usersMap = Object.fromEntries(
          data.map((user) => [user.id, user])
        );
        setUsers(usersMap);
      }
    };

    if (requests.length > 0) fetchUsers();
  }, [requests]);

  const handleApprove = async (req: any) => {
    // 거래처를 삭제할떄 문서랑 연관된 테이블 다 지워야함
    // const type = Object.keys(content)[0];
    // const value = content[type];

    if (req.type === "companies") {
      const companyId = req.related_id;

      // 1. 상담 관련 데이터 삭제
      const { data: consultations } = await supabase
        .from("consultations")
        .select("id")
        .eq("company_id", companyId);

      const consultationIds = consultations?.map((c) => c.id) || [];

      if (consultationIds.length > 0) {
        // 파일 다운로드 기록 삭제
        await supabase
          .from("file_downloads")
          .delete()
          .in("consultation_id", consultationIds);

        await supabase
          .from("consultation_files")
          .delete()
          .in("consultation_id", consultationIds);

        await supabase
          .from("contacts_consultations")
          .delete()
          .in("consultation_id", consultationIds);

        await supabase
          .from("documents")
          .delete()
          .in("consultation_id", consultationIds);

        await supabase
          .from("consultations")
          .delete()
          .eq("company_id", companyId);
      }

      // 2. 회사 직접 연결된 문서 삭제
      await supabase.from("documents").delete().eq("company_id", companyId);

      // 3. 담당자 관련 데이터 삭제
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id")
        .eq("company_id", companyId);

      const contactIds = contacts?.map((c) => c.id) || [];

      if (contactIds.length > 0) {
        await supabase
          .from("contacts_documents")
          .delete()
          .in("contact_id", contactIds);

        await supabase
          .from("contacts_consultations")
          .delete()
          .in("contact_id", contactIds);

        await supabase.from("contacts").delete().eq("company_id", companyId);
      }

      // 4. 즐겨찾기 삭제
      await supabase.from("favorites").delete().eq("item_id", companyId);

      // 5. 재고 작업 삭제
      await supabase.from("inventory_tasks").delete().eq("company_id", companyId);

      // 6. 최종 회사 삭제
      await supabase.from("companies").delete().eq("id", companyId);
      await supabase.from("deletion_requests").delete().eq("id", req.id);
    } else if (req.type === "documents") {
      await supabase
        .from("contacts_documents")
        .delete()
        .eq("document_id", req.related_id);
      await supabase.from("documents").delete().eq("id", req.related_id);
      await supabase.from("deletion_requests").delete().eq("id", req.id);
    } else if (req.type === "contacts") {
      // cascade ?
      await supabase
        .from("contacts_documents")
        .delete()
        .eq("contact_id", req.related_id);

      await supabase
        .from("contacts_consultations")
        .delete()
        .eq("contact_id", req.related_id);

      await supabase.from("contacts").delete().eq("id", req.related_id);
      await supabase.from("deletion_requests").delete().eq("id", req.id);
    } else if (req.type === "consultations") {
      // await supabase
      //   .from("contacts_consultations")
      //   .delete()
      //   .eq("consult_id", req.related_id);

      await supabase.from("consultations").delete().eq("id", req.related_id);
      await supabase.from("deletion_requests").delete().eq("id", req.id);
    } else if (req.type === "rnds") {
      await supabase.from("rnds").delete().eq("id", req.related_id);
      await supabase.from("deletion_requests").delete().eq("id", req.id);
    } else if (req.type === "posts") {
      // 게시글 소프트 삭제 (deleted_at 설정)
      await supabase
        .from("posts")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", req.related_id);
      await supabase.from("deletion_requests").delete().eq("id", req.id);
    }

    setRequests((prev) => prev.filter((reqs) => reqs.id !== req.id));
  };

  const handleReject = async (id: string) => {
    await supabase.from("deletion_requests").delete().eq("id", id);
    setRequests((prev) => prev.filter((req) => req.id !== id));
  };

  const totalPages = Math.ceil(requests.length / requestsPerPage);
  const paginationNumbers = () => {
    const numbers: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        numbers.push(i);
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        numbers.push("...");
      }
    }
    return numbers;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-sm text-slate-800">
      <div className="p-4">
        <h1 className="text-lg font-bold text-slate-800 mb-4">삭제 요청 목록</h1>

        {/* 테이블 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-center">
                <th className="px-4 py-3 text-xs font-medium text-slate-500">삭제요청일</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500">삭제 요청자</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500">타입</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500">상세</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500">삭제사유</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => {
                const user = users[req.user_id] || {
                  name: "알 수 없음",
                  level: "Unknown",
                };

                const type = Object.keys(req.content)[0];
                const value = req.content[type];

                return (
                  <tr key={req.id} className="hover:bg-slate-50 text-center transition-colors">
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(req.request_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {user.name} {user.level}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        type === "companies" ? "bg-blue-100 text-blue-700" :
                        type === "contacts" ? "bg-green-100 text-green-700" :
                        type === "posts" ? "bg-amber-100 text-amber-700" :
                        "bg-purple-100 text-purple-700"
                      }`}>
                        {type === "companies"
                          ? "거래처"
                          : type === "contacts"
                          ? "담당자"
                          : type === "posts"
                          ? "게시글"
                          : "문서"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate" title={value}>{value}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={req.delete_reason}>
                      {req.delete_reason}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <motion.button
                          onClick={() => handleApprove(req)}
                          className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          whileTap={{ scale: 0.95 }}
                        >
                          승인
                        </motion.button>
                        <motion.button
                          onClick={() => handleReject(req.id)}
                          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          whileTap={{ scale: 0.95 }}
                        >
                          거부
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="flex justify-center mt-6">
          <nav className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                currentPage === 1
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              이전
            </button>
            {paginationNumbers().map((page, index) =>
              typeof page === "number" ? (
                <button
                  key={index}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-purple-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span key={index} className="px-2 text-slate-400">
                  ...
                </span>
              )
            )}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                currentPage === totalPages
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              다음
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
