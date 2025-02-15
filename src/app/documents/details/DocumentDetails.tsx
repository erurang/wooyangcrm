"use client";

import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Snackbar, Alert } from "@mui/material";
import { useLoginUser } from "@/context/login";
import dayjs from "dayjs";
import DocumentModal from "@/components/documents/estimate/DocumentModal";
import Link from "next/link";

interface Document {
  id: string;
  type: string;
  status: string;
  document_number: string;
  contact_name: string;
  contact_level: string;
  user_name: string;
  user_level: string;
  content: {
    company_name: string;
    valid_until: string;
    delivery_date: string;
    total_amount: number;
  };
  created_at: string;
  user_id: string;
  status_reason: {
    canceled: {
      reason: string;
      amount: number;
    };
    completed: {
      reason: string;
      amount: number;
    };
  };
  consultation_id: string;
  company_id: string;
}

interface User {
  id: string;
  name: string;
}

export default function DocumentsDetailsPage() {
  const user = useLoginUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  const type = searchParams.get("type") || "estimate";
  const status = searchParams.get("status") || "pending";

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [statusChangeDoc, setStatusChangeDoc] = useState<Document | null>(null);
  const [statusReason, setStatusReason] = useState({
    canceled: {
      reason: "",
      amount: 0,
    },
    completed: {
      reason: "",
      amount: 0,
    },
  });

  const [selectedStatus, setSelectedStatus] = useState<
    "canceled" | "completed"
  >("canceled"); // ""는 초기값

  const documentsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const today = dayjs().format("YYYY-MM-DD");
  const thirtyDaysAgo = dayjs().subtract(30, "day").format("YYYY-MM-DD");
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const fetchDocuments = async () => {
    if (!user?.id) {
      console.error("User ID is undefined");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .select(
          `*, contacts_documents(contacts(contact_name,level,mobile)), users(name,level)`
        )
        .eq("type", type)
        .eq("status", status)
        .eq("user_id", user?.id) // 로그인한 유저의 문서만 가져옴
        .ilike("content->>company_name", `%${searchTerm}%`)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const transformedDocuments = data.map((doc) => {
        const contact = doc.contacts_documents?.[0]?.contacts || {}; // 첫 번째 연락처 정보 가져오기
        const user = doc.users || {}; // 사용자 정보 가져오기

        return {
          ...doc,
          contact_level: contact.level || "", // 🔹 연락처 직급
          contact_name: contact.contact_name || "", // 🔹 연락처 이름
          contact_mobile: contact.contact_mobile || "",
          user_name: user.name || "", // 🔹 사용자 이름
          user_level: user.level || "", // 🔹 사용자 직급
          contacts_documents: undefined, // 필요 없으면 삭제
          users: undefined, // 필요 없으면 삭제
        };
      });

      setDocuments(transformedDocuments || []);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setSnackbarMessage("문서 데이터를 불러오는 중 오류가 발생했습니다.");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  console.log(documents);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedDocument(null);
        setStatusChangeDoc(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [type, status, currentPage, user]);

  const handleStatusChange = async () => {
    if (!statusChangeDoc || !statusReason || !selectedStatus) return;

    const confirmChange = window.confirm(
      "상태 변경은 되돌릴 수 없습니다. 변경할까요?"
    );

    if (!confirmChange) {
      return; // 사용자가 취소한 경우 중단
    }

    try {
      const { error } = await supabase
        .from("documents")
        .update({
          status: selectedStatus,
          status_reason: statusReason,
        })
        .eq("id", statusChangeDoc.id);

      if (error) {
        throw error;
      }

      setSnackbarMessage("문서 상태가 성공적으로 업데이트되었습니다.");
      setOpenSnackbar(true);
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === statusChangeDoc.id
            ? { ...doc, status: selectedStatus }
            : doc
        )
      );
      setStatusChangeDoc(null);
      setStatusReason({
        canceled: {
          reason: "",
          amount: 0,
        },
        completed: {
          reason: "",
          amount: 0,
        },
      });
    } catch (error) {
      console.error("Failed to update document status:", error);
      setSnackbarMessage("문서 상태 업데이트 중 오류가 발생했습니다.");
      setOpenSnackbar(true);
    }
  };

  const totalPages = Math.ceil(documents.length / documentsPerPage);
  const indexOfLastDoc = currentPage * documentsPerPage;
  const indexOfFirstDoc = indexOfLastDoc - documentsPerPage;
  const currentDocuments = documents.slice(indexOfFirstDoc, indexOfLastDoc);

  const typeToKorean: Record<string, string> = {
    estimate: "견적서",
    order: "발주서",
    requestQuote: "의뢰서",
  };

  const statusToKorean: Record<string, string> = {
    pending: "진행 중",
    completed: "완료됨",
    canceled: "취소됨",
  };

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
      <div className="mb-4">
        <Link
          href="/documents"
          className="text-blue-500 hover:underline hover:font-bold"
        >
          문서 관리
        </Link>{" "}
        &gt;{" "}
        <span className="">
          {`${typeToKorean[type]} 관리` || "알 수 없음"} -{" "}
        </span>
        {["pending", "completed", "canceled"].map((state, index) => (
          <Link
            key={state}
            href={`/documents/details?type=${type}&status=${state}`}
            className={`${
              status === state ? "font-semibold" : "text-blue-500"
            } `}
          >
            {statusToKorean[state] || "알 수 없음"}
            {index < 2 && " | "} {/* 상태 간 구분자 */}
          </Link>
        ))}
      </div>
      {/* 검색 필터 */}
      <div className="bg-[#FBFBFB] rounded-md border-[1px] px-4 py-4 mb-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center justify-center">
            <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
              거래처명
            </label>
            <motion.input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="거래처명"
              className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>
          <div className="flex items-center justify-center">
            <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
              시작일
            </label>
            <motion.input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>
          <div className="flex items-center justify-center">
            <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
              종료일
            </label>
            <motion.input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setSearchTerm(""); // 검색어 초기화
                setStartDate(today); // 30일 전으로 설정
                setEndDate(today); // 오늘 날짜로 설정
                fetchDocuments(); // 필터 초기화 후 다시 문서 목록 가져오기
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2"
            >
              필터리셋
            </button>
            <button
              onClick={fetchDocuments}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 문서 목록 */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-center">
              <th className="px-4 py-2 border-b">
                {type === "estimate" && "견적일"}
                {type === "order" && "발주일"}
                {type === "requestQuote" && "의뢰일"}
              </th>
              <th className="px-4 py-2 border-b">
                {type === "estimate" && "견적유효기간"}
                {type === "order" && "납기일"}
                {type === "requestQuote" && "희망견적일"}
              </th>
              <th className="px-4 py-2 border-b">회사명</th>
              <th className="px-4 py-2 border-b">문서 번호</th>
              {status === "pending" && (
                <th className="px-4 py-2 border-b">수정</th>
              )}
              <th className="px-4 py-2 border-b">상담자</th>
              <th className="px-4 py-2 border-b">
                {type === "estimate" && "견적자"}
                {type === "order" && "발주자"}
                {type === "requestQuote" && "의뢰자"}
              </th>
              <th className="px-4 py-2 border-b">
                {status === "pending" ? <>변경</> : <>사유</>}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentDocuments.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50 text-center">
                <td className="px-4 py-2 border-b">
                  {doc.created_at.slice(0, 10)}
                </td>
                <td className="px-4 py-2 border-b">
                  {type === "estimate" &&
                    new Date(doc.content?.valid_until).toLocaleDateString()}
                  {type === "order" && doc.content?.delivery_date}
                  {type === "requestQuote" && doc.content?.delivery_date}
                </td>
                <td className="px-4 py-2 border-b">
                  {doc.content?.company_name}
                </td>

                <td
                  className="px-4 py-2 border-b text-blue-500 cursor-pointer"
                  onClick={() => setSelectedDocument(doc)}
                >
                  {doc.document_number}
                </td>
                {status === "pending" && (
                  <td
                    className="px-4 py-2 border-b text-blue-500 cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/documents/${type}?consultId=${doc.consultation_id}&compId=${doc.company_id}`
                      )
                    }
                  >
                    이동
                  </td>
                )}
                <td className="px-4 py-2 border-b">
                  {doc.contact_name} {doc.contact_level}
                </td>
                <td className="px-4 py-2 border-b">
                  {doc.user_name} {doc.user_level}
                </td>
                <td className="px-4 py-2 border-b w-1/3">
                  <div className="flex justify-center">
                    {doc.status === "pending" ? (
                      ["pending", "completed", "canceled"].map((status) => (
                        <button
                          key={status}
                          className={`px-6 py-2 rounded-md ${
                            status === doc.status
                              ? "text-blue-500"
                              : "hover:text-black text-gray-400 cursor-pointer "
                          }`}
                          onClick={() => {
                            if (status !== doc.status) {
                              setSelectedStatus(
                                status as "completed" | "canceled"
                              );
                              setStatusChangeDoc(doc);
                            }
                          }}
                        >
                          {status === "pending"
                            ? "진행 중"
                            : status === "completed"
                            ? "완료"
                            : "취소"}
                        </button>
                      ))
                    ) : (
                      <>
                        {doc.status === "completed" ? (
                          <>
                            {doc.status_reason &&
                              doc.status_reason.completed.reason}
                          </>
                        ) : (
                          <>
                            {doc.status_reason &&
                              doc.status_reason.canceled.reason}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center mt-4 overflow-x-auto space-x-1 md:space-x-2">
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

      {/* 문서 상세 모달 */}
      {selectedDocument && (
        <DocumentModal
          koreanAmount={() => {}}
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          company_fax={"02-1234-5678"}
          type={selectedDocument.type}
        />
      )}

      {/* 상태 변경 모달 */}
      {statusChangeDoc && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md w-1/3">
            <h2 className="text-xl font-bold mb-4">진행 상태 변경</h2>
            <textarea
              placeholder="발주처리, 단가로 인한 취소, 프로젝트 취소.. 등등"
              className="w-full min-h-32 p-2 border border-gray-300 rounded-md"
              value={selectedStatus ? statusReason[selectedStatus]?.reason : ""}
              onChange={(e) =>
                setStatusReason((prev) => ({
                  ...prev,
                  [selectedStatus]: {
                    amount: statusChangeDoc.content.total_amount,
                    reason: e.target.value,
                  },
                }))
              }
            />
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2"
                onClick={() => setStatusChangeDoc(null)}
              >
                취소
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
                onClick={handleStatusChange}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert severity="info">{snackbarMessage}</Alert>
      </Snackbar>
    </div>
  );
}
