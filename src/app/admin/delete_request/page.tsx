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
      // cascade ?
      await supabase.from("companies").delete().eq("id", req.related_id);
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
    <div className="text-sm text-[#37352F]">
      <h1 className="mb-4 font-semibold">삭제 요청 목록</h1>

      {/* 테이블 */}
      <div className="bg-[#FBFBFB] rounded-md border">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-center">
              <th className="px-4 py-2 border-b border-r">삭제요청일</th>
              <th className="px-4 py-2 border-b border-r">삭제 요청자</th>
              <th className="px-4 py-2 border-b border-r">타입</th>
              <th className="px-4 py-2 border-b border-r">상세</th>
              <th className="px-4 py-2 border-b border-r">삭제사유</th>
              <th className="px-4 py-2 border-b border-r">승인</th>
              <th className="px-4 py-2 border-b">거부</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => {
              const user = users[req.user_id] || {
                name: "알 수 없음",
                level: "Unknown",
              };

              const type = Object.keys(req.content)[0];
              const value = req.content[type];

              return (
                <tr key={req.id} className="hover:bg-gray-100 text-center">
                  <td className="px-4 py-2 border-b border-r">
                    {new Date(req.request_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 border-b border-r">
                    {user.name} {user.level}
                  </td>
                  <td className="px-4 py-2 border-b border-r">
                    {type === "companies"
                      ? "거래처"
                      : type === "contacts"
                      ? "담당자"
                      : type === "posts"
                      ? "게시글"
                      : "문서"}
                  </td>
                  <td className="px-4 py-2 border-b border-r">{value}</td>
                  <td className="px-4 py-2 border-b border-r">
                    {req.delete_reason}
                  </td>
                  <td className="px-4 py-2 border-b border-r">
                    <motion.button
                      onClick={() => handleApprove(req)}
                      className="px-4 py-2 text-blue-500"
                      whileTap={{ scale: 0.95 }}
                    >
                      승인
                    </motion.button>
                  </td>
                  <td className="px-4 py-2 border-b border-r">
                    <motion.button
                      onClick={() => handleReject(req.id)}
                      className="px-4 py-2 text-red-500"
                      whileTap={{ scale: 0.95 }}
                    >
                      거부
                    </motion.button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center mt-4 space-x-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
        >
          이전
        </button>
        {paginationNumbers().map((page, index) =>
          typeof page === "number" ? (
            <button
              key={index}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 border rounded ${
                currentPage === page
                  ? "bg-blue-500 text-white font-bold"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="px-2">
              ...
            </span>
          )
        )}
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
        >
          다음
        </button>
      </div>
    </div>
  );
}
