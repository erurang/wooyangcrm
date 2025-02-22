"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import DocumentModal from "@/components/documents/estimate/DocumentModal";
import SnackbarComponent from "@/components/Snackbar";

import { useDebounce } from "@/hooks/useDebounce";
import { useUsersList } from "@/hooks/useUserList";
import { useDocumentsStatusList } from "@/hooks/documents/details/useDocumentsStatusList";
import { useUpdateDocumentStatus } from "@/hooks/documents/details/useUpdateDocumentStatus";
import { useCompanySearch } from "@/hooks/manage/contacts/useCompanySearch";
import { useLoginUser } from "@/context/login";

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
  level: string;
}

export default function DocumentsDetailsPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "estimate";
  const status = searchParams.get("status") || "pending";

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

  const [selectedStatus, setSelectedStatus] = useState<string>(
    searchParams.get("status") || ""
  );

  const [changedStatus, setChangedStatus] = useState("");

  const documentsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // 🔹 로그인한 유저를 기본 선택값으로 설정

  const debounceSearchTerm = useDebounce(searchTerm, 300);
  const { companies } = useCompanySearch(debounceSearchTerm);
  const companyIds = companies.map((company: any) => company.id);
  const debounceCompanyIds = useDebounce(companyIds, 300);

  // swr
  const { users } = useUsersList();

  const { documents, total, refreshDocuments } = useDocumentsStatusList({
    userId: selectedUser?.id as string,
    type,
    status: selectedStatus || "",
    page: currentPage,
    limit: documentsPerPage,
    companyIds: debounceCompanyIds,
  });

  const { trigger: updateStatus, isMutating } = useUpdateDocumentStatus();

  ///

  const numberToKorean = (num: number): string => {
    if (num === 0) return "영"; // 0일 경우 예외 처리

    const isNegative = num < 0; // 🚀 음수 여부 확인
    num = Math.abs(num); // 🚀 절대값으로 변환 후 처리

    const units = ["", "십", "백", "천"];
    const bigUnits = ["", "만", "억", "조", "경"];
    const digits = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
    let result = "";

    let bigUnitIndex = 0;

    while (num > 0) {
      const chunk = num % 10000;
      if (chunk > 0) {
        let chunkResult = "";
        let unitIndex = 0;
        let tempChunk = chunk;

        while (tempChunk > 0) {
          const digit = tempChunk % 10;
          if (digit > 0) {
            chunkResult = `${digits[digit]}${units[unitIndex]}${chunkResult}`;
          }
          tempChunk = Math.floor(tempChunk / 10);
          unitIndex++;
        }

        result = `${chunkResult}${bigUnits[bigUnitIndex]} ${result}`;
      }

      num = Math.floor(num / 10000);
      bigUnitIndex++;
    }

    result = result.trim().replace(/일십/g, "십"); // '일십'을 '십'으로 간략화

    return isNegative ? `마이너스 ${result}` : result; // 🚀 음수일 경우 '마이너스' 추가
  };

  useEffect(() => {
    refreshDocuments();
  }, [selectedUser]);

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

  const handleStatusChange = async () => {
    if (!statusChangeDoc || !changedStatus) return;
    if (isMutating) return;

    const confirmChange = window.confirm(
      "상태 변경은 되돌릴 수 없습니다. 변경할까요?"
    );
    if (!confirmChange) return;

    try {
      const reason = {
        [changedStatus]:
          statusReason[changedStatus as "canceled" | "completed"],
      };

      await updateStatus({
        id: statusChangeDoc.id,
        status: changedStatus,
        status_reason: reason, // ✅ 수정된 형식으로 전달
      });

      setCurrentPage(1); // ✅ 변경 시 현재 페이지 초기화
      setStatusChangeDoc(null);
      setStatusReason({
        canceled: { reason: "", amount: 0 },
        completed: { reason: "", amount: 0 },
      });
      await refreshDocuments();
    } catch (error) {
      console.error("문서 상태 업데이트 실패:", error);
    }
  };

  const totalPages = Math.ceil(total / documentsPerPage);

  const typeToKorean: Record<string, string> = {
    estimate: "견적서",
    order: "발주서",
    requestQuote: "의뢰서",
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
        <span className="font-semibold">{`${typeToKorean[type]} 관리`}</span>
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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // ✅ 검색 시 현재 페이지 초기화
              }}
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
              상태
            </label>
            <motion.select
              value={selectedStatus} // 🔹 선택된 상태 유지
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1); // ✅ 상태 변경 시 현재 페이지 초기화
              }}
              className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md h-full"
            >
              <option value="pending">진행</option>
              <option value="completed">완료</option>
              <option value="canceled">취소</option>
            </motion.select>
          </div>

          <div className="flex items-center justify-center">
            <label className="w-1/4 block p-2 border rounded-l-md">
              상담자
            </label>
            <motion.select
              className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md h-full"
              value={selectedUser?.id || ""} // ✅ userId 저장
              onChange={(e) => {
                const user =
                  users.find((user: User) => user.id === e.target.value) ||
                  null;
                setSelectedUser(user);
                setCurrentPage(1); // ✅ 상담자 변경 시 현재 페이지 초기화
              }}
            >
              <option value="">전체</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.level}
                </option>
              ))}
            </motion.select>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedUser(null);
                setCurrentPage(1); // ✅ 필터 리셋 시 현재 페이지 초기화
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2"
            >
              필터리셋
            </button>
          </div>
        </div>
      </div>

      {/* 문서 목록 */}
      <div className="bg-[#FBFBFB] rounded-md border">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-center">
              <th className="px-4 py-2 border-b border-r-[1px]">
                {type === "estimate" && "견적일"}
                {type === "order" && "발주일"}
                {type === "requestQuote" && "의뢰일"}
              </th>
              <th className="px-4 py-2 border-b border-r-[1px]">
                {type === "estimate" && "견적유효기간"}
                {type === "order" && "납기일"}
                {type === "requestQuote" && "희망견적일"}
              </th>
              <th className="px-4 py-2 border-b border-r-[1px]">거래처명</th>
              <th className="px-4 py-2 border-b border-r-[1px]">문서 번호</th>
              {status === "pending" && (
                <th className="px-4 py-2 border-b border-r-[1px]">수정</th>
              )}
              <th className="px-4 py-2 border-b border-r-[1px]">피상담자</th>
              <th className="px-4 py-2 border-b border-r-[1px]">
                {type === "estimate" && "견적자"}
                {type === "order" && "발주자"}
                {type === "requestQuote" && "의뢰자"}
              </th>
              <th className="px-4 py-2 border-b border-r-[1px]">
                {status === "pending" ? <>변경</> : <>사유</>}
              </th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc: any) => (
              <tr key={doc.id} className="hover:bg-gray-100 text-center">
                <td className="px-4 py-2 border-b border-r-[1px]">
                  {doc.created_at.slice(0, 10)}
                </td>
                <td className="px-4 py-2 border-b border-r-[1px]">
                  {type === "estimate" &&
                    new Date(doc.content?.valid_until).toLocaleDateString()}
                  {type === "order" && doc.content?.delivery_date}
                  {type === "requestQuote" && doc.content?.delivery_date}
                </td>
                <td className="px-4 py-2 border-b border-r-[1px]">
                  {doc.content?.company_name}
                </td>

                <td
                  className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
                  onClick={() => setSelectedDocument(doc)}
                >
                  {doc.document_number}
                </td>
                {status === "pending" && (
                  <td
                    className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/documents/${type}?consultId=${doc.consultation_id}&compId=${doc.company_id}`
                      )
                    }
                  >
                    이동
                  </td>
                )}
                <td className="px-4 py-2 border-b border-r-[1px]">
                  {doc.contact_name} {doc.contact_level}
                </td>
                <td className="px-4 py-2 border-b border-r-[1px]">
                  {doc.user_name} {doc.user_level}
                </td>
                <td className="px-4 py-2 border-b border-r-[1px] w-1/3">
                  <div className="flex justify-center">
                    {doc.status === "pending" ? (
                      // 🔹 로그인한 사용자와 문서를 작성한 사용자가 같을 때만 버튼 활성화
                      doc.user_id === loginUser?.id ? (
                        ["pending", "completed", "canceled"].map((status) => (
                          <button
                            key={status}
                            className={`px-6 py-2 rounded-md ${
                              status === doc.status
                                ? "text-blue-500"
                                : "hover:text-black text-gray-400 cursor-pointer"
                            }`}
                            onClick={() => {
                              if (status !== doc.status) {
                                setChangedStatus(status);
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
                        <span className="text-gray-400">수정 권한 없음</span>
                      )
                    ) : (
                      <>
                        {doc.status === "completed" ? (
                          <>
                            {doc.status_reason &&
                              doc.status_reason.completed?.reason}
                          </>
                        ) : (
                          <>
                            {doc.status_reason &&
                              doc.status_reason.canceled?.reason}
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
          koreanAmount={numberToKorean}
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
              value={
                selectedStatus
                  ? statusReason[selectedStatus as "canceled" | "completed"]
                      ?.reason
                  : ""
              }
              onChange={(e) =>
                setStatusReason((prev) => ({
                  ...prev,
                  [selectedStatus as "canceled" | "completed"]: {
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
      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}
