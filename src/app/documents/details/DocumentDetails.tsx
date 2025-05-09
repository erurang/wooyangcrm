"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building,
  FileText,
  User,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { CircularProgress } from "@mui/material";

import DocumentModal from "@/components/documents/estimate/DocumentModal";
import SnackbarComponent from "@/components/Snackbar";

import { useDebounce } from "@/hooks/useDebounce";
import { useUsersList } from "@/hooks/useUserList";
import { useDocumentsStatusList } from "@/hooks/documents/details/useDocumentsStatusList";
import { useUpdateDocumentStatus } from "@/hooks/documents/details/useUpdateDocumentStatus";
import { useCompanySearch } from "@/hooks/manage/contacts/useCompanySearch";
import { useLoginUser } from "@/context/login";

interface Document {
  companies: {
    phone: any;
    fax: any;
  };
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

interface UserType {
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
    searchParams.get("status") || "all"
  );

  const [changedStatus, setChangedStatus] = useState("");

  const [documentsPerPage, setDocumentsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchDocNumber, setSearchDocNumber] = useState("");
  const [searchNotes, setSearchNotes] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  const debounceSearchTerm = useDebounce(searchTerm, 300);
  const { companies } = useCompanySearch(debounceSearchTerm);
  const companyIds = companies.map((company: any) => company.id);
  const debounceCompanyIds = useDebounce(companyIds, 300);
  const debounceDocNumber = useDebounce(searchDocNumber, 300);
  const debounceNotes = useDebounce(searchNotes, 300);

  // swr
  const { users } = useUsersList();

  const {
    documents,
    total,
    refreshDocuments,
    isLoading: isDocumentsLoading,
  } = useDocumentsStatusList({
    userId: selectedUser?.id as string,
    type,
    status: selectedStatus,
    docNumber: debounceDocNumber,
    page: currentPage,
    limit: documentsPerPage,
    companyIds: debounceCompanyIds,
    notes: debounceNotes,
  });

  const { trigger: updateStatus, isMutating } = useUpdateDocumentStatus();

  const numberToKorean = (num: number): string => {
    if (num === 0) return "영";

    const isNegative = num < 0;
    num = Math.abs(num);

    const units = ["", "십", "백", "천"];
    const bigUnits = ["", "만", "억", "조", "경"];
    const digits = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
    let result = "";

    const [integerPart, decimalPart] = num.toString().split(".");
    let intNum = Number.parseInt(integerPart, 10);
    let bigUnitIndex = 0;

    while (intNum > 0) {
      const chunk = intNum % 10000;
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

      intNum = Math.floor(intNum / 10000);
      bigUnitIndex++;
    }

    let decimalResult = "";
    if (decimalPart && Number.parseInt(decimalPart) > 0) {
      decimalResult = " 점 ";
      for (const digit of decimalPart) {
        decimalResult += digits[Number.parseInt(digit, 10)] + " ";
      }
    }

    let finalResult = result.trim();

    if (decimalResult) {
      finalResult += decimalResult.trim();
    }

    return isNegative ? `마이너스 ${finalResult}` : finalResult.trim();
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

  // 상태 변경 핸들러
  const handleStatusChange = async () => {
    if (!statusChangeDoc || !changedStatus) return;
    if (isMutating) return;

    // 사유가 비어있으면 처리하지 않음
    if (
      !statusReason[changedStatus as "canceled" | "completed"].reason.trim()
    ) {
      return;
    }

    const confirmChange = window.confirm(
      "상태 변경은 되돌릴 수 없습니다. 변경할까요?"
    );
    if (!confirmChange) return;

    try {
      const reason = {
        [changedStatus]: {
          reason:
            statusReason[changedStatus as "canceled" | "completed"].reason,
        },
      };

      await updateStatus({
        id: statusChangeDoc.id,
        status: changedStatus,
        status_reason: reason,
      });

      setCurrentPage(1);
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

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedUser(null);
    setSearchDocNumber("");
    setSearchNotes("");
    setCurrentPage(1);
  };

  return (
    <div className="text-sm text-gray-800">
      {/* 검색 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 거래처 */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              거래처
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="거래처명 입력"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Building
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          {/* 문서번호 */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              문서번호
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchDocNumber}
                onChange={(e) => {
                  setSearchDocNumber(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="WY-YYYYMMDD-NNNN"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <FileText
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          {/* 특기사항 */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              특기사항
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchNotes}
                onChange={(e) => {
                  setSearchNotes(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="특기사항 검색"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          {/* 상태 */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상태
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
              >
                <option value="all">전체</option>
                <option value="pending">진행</option>
                <option value="completed">완료</option>
                <option value="canceled">취소</option>
              </select>
              <Clock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          {/* 상담자 */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상담자
            </label>
            <div className="relative">
              <select
                value={selectedUser?.id || ""}
                onChange={(e) => {
                  const user =
                    users.find(
                      (user: UserType) => user.id === e.target.value
                    ) || null;
                  setSelectedUser(user);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
              >
                <option value="">전체 상담자</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.level}
                  </option>
                ))}
              </select>
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 테이블 컨트롤 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          {isDocumentsLoading ? (
            <span>로딩 중...</span>
          ) : (
            <span>
              총 <span className="font-semibold text-blue-600">{total}</span>개
              문서
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">표시 개수:</label>
          <select
            value={documentsPerPage}
            onChange={(e) => {
              setDocumentsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="10">10개</option>
            <option value="20">20개</option>
            <option value="30">30개</option>
            <option value="50">50개</option>
          </select>

          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <X size={14} />
            <span className="text-sm">필터 초기화</span>
          </button>
        </div>
      </div>

      {/* 문서 목록 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        {isDocumentsLoading ? (
          <div className="flex justify-center items-center py-20">
            <CircularProgress size={40} />
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {type === "estimate" && "견적일"}
                    {type === "order" && "발주일"}
                    {type === "requestQuote" && "의뢰일"}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                  >
                    {type === "estimate" && "견적유효기간"}
                    {type === "order" && "납기일"}
                    {type === "requestQuote" && "희망견적일"}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    거래처명
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    문서 번호
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                  >
                    담당자
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                  >
                    {type === "estimate" && "견적자"}
                    {type === "order" && "발주자"}
                    {type === "requestQuote" && "의뢰자"}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    상태
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                  >
                    비고
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc: any) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{doc.date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">
                        {type === "estimate" &&
                          new Date(
                            doc.content?.valid_until
                          ).toLocaleDateString()}
                        {type === "order" && doc.content?.delivery_date}
                        {type === "requestQuote" && doc.content?.delivery_date}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                        onClick={() =>
                          router.push(`/consultations/${doc.company_id}`)
                        }
                      >
                        {doc.content?.company_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                        onClick={() => setSelectedDocument(doc)}
                      >
                        {doc.document_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">
                        {doc.contact_name} {doc.contact_level}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">
                        {doc.user_name} {doc.user_level}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          doc.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : doc.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {doc.status === "pending" && (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {doc.status === "completed" && (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        )}
                        {doc.status === "canceled" && (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {doc.status === "pending" && "진행중"}
                        {doc.status === "completed" && "완료"}
                        {doc.status === "canceled" && "취소"}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="text-sm text-gray-900">
                        {doc.status === "pending" ? (
                          doc.user_id === loginUser?.id ? (
                            <div className="flex space-x-2">
                              {["completed", "canceled"].map((status) => (
                                <button
                                  key={status}
                                  className={`px-3 py-1 text-xs rounded-md ${
                                    status === "completed"
                                      ? "bg-green-50 text-green-600 hover:bg-green-100"
                                      : "bg-red-50 text-red-600 hover:bg-red-100"
                                  } transition-colors`}
                                  onClick={() => {
                                    setChangedStatus(status);
                                    setStatusChangeDoc(doc);
                                  }}
                                >
                                  {status === "completed" ? "완료" : "취소"}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">
                              수정 권한 없음
                            </span>
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
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Search size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">검색 결과가 없습니다</p>
            <p className="text-gray-400 text-sm mt-2">
              다른 검색어로 시도해보세요
            </p>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ChevronLeft size={18} />
            </button>

            {paginationNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === "number" && setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-md ${
                  currentPage === page
                    ? "bg-blue-600 text-white font-medium"
                    : page === "..."
                    ? "text-gray-500 cursor-default"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        </div>
      )}

      {/* 문서 상세 모달 */}
      <AnimatePresence>
        {selectedDocument && (
          <motion.div
            className="fixed inset-0 z-[1000] overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="relative z-[1001] flex items-center justify-center min-h-screen">
              <DocumentModal
                koreanAmount={numberToKorean}
                document={selectedDocument}
                onClose={() => setSelectedDocument(null)}
                company_phone={selectedDocument.companies.phone}
                company_fax={selectedDocument.companies.fax}
                type={selectedDocument.type}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 상태 변경 모달 */}
      <AnimatePresence>
        {statusChangeDoc && (
          <motion.div
            className="fixed inset-0 z-[1000] overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={() => setStatusChangeDoc(null)}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="relative z-[1001] flex items-center justify-center min-h-screen p-4">
              <motion.div
                className="bg-white rounded-lg overflow-hidden shadow-xl w-full max-w-md mx-auto"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* 모달 헤더 */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {changedStatus === "completed"
                        ? "문서 완료 처리"
                        : "문서 취소 처리"}
                    </h3>
                    <button
                      onClick={() => setStatusChangeDoc(null)}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* 모달 본문 */}
                <div className="px-6 py-4">
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        문서 번호:
                      </span>
                      <span className="ml-2 text-sm text-gray-900">
                        {statusChangeDoc.document_number}
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        거래처:
                      </span>
                      <span className="ml-2 text-sm text-gray-900">
                        {statusChangeDoc.content?.company_name}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700">
                        변경할 상태:
                      </span>
                      <span
                        className={`ml-2 text-sm font-medium px-2 py-0.5 rounded-full ${
                          changedStatus === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {changedStatus === "completed" ? "완료" : "취소"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor="status-reason"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {changedStatus === "completed"
                        ? "완료 사유"
                        : "취소 사유"}
                    </label>
                    <textarea
                      id="status-reason"
                      placeholder={
                        changedStatus === "completed"
                          ? "발주처리, 계약 완료 등 완료 사유를 입력하세요"
                          : "단가 문제, 프로젝트 취소 등 취소 사유를 입력하세요"
                      }
                      className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={
                        statusReason[changedStatus as "canceled" | "completed"]
                          .reason
                      }
                      onChange={(e) =>
                        setStatusReason((prev) => ({
                          ...prev,
                          [changedStatus]: {
                            ...prev[changedStatus as "canceled" | "completed"],
                            reason: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                {/* 모달 푸터 */}
                <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setStatusChangeDoc(null)}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      changedStatus === "completed"
                        ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                        : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    } ${
                      !statusReason[
                        changedStatus as "canceled" | "completed"
                      ].reason.trim()
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    onClick={handleStatusChange}
                    disabled={
                      !statusReason[
                        changedStatus as "canceled" | "completed"
                      ].reason.trim()
                    }
                  >
                    {isMutating ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        처리 중...
                      </span>
                    ) : (
                      `${changedStatus === "completed" ? "완료" : "취소"} 처리`
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 스낵바 */}
      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}
