"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Calendar,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { CircularProgress } from "@mui/material";

import { useUsersList } from "@/hooks/useUserList";
import SnackbarComponent from "@/components/Snackbar";
import DocumentModal from "@/components/documents/estimate/DocumentModal";
import { useDebounce } from "@/hooks/useDebounce";
import { useConsultationSearch } from "@/hooks/consultations/search/useConsultationSearch";

interface Document {
  id: string;
  type: "estimate" | "requestQuote" | "order";
  document_number: string;
  content: {
    company_name: string;
    total_amount: number;
    delivery_date?: string;
    valid_until?: string;
    delivery_place?: string;
    payment_method?: string;
  };
  contact_name?: string;
  contact_level?: string;
  contact_mobile?: string;
  company_fax?: string;
  company_tel?: string;
  company_phone?: string;
  delivery_date?: string;
  user_name?: string;
  user_level?: string;
  payment_method?: string;
}

interface UserType {
  id: string;
  name: string;
  level: string;
}

export default function RecentConsultations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = new Date().toISOString().split("T")[0];

  // URL 쿼리 파라미터에서 초기값 가져오기
  const initialPage = Number(searchParams.get("page") || "1");
  const initialSearchTerm = searchParams.get("search") || "";
  const initialStartDate = searchParams.get("startDate") || today;
  const initialEndDate = searchParams.get("endDate") || today;
  const initialUserId = searchParams.get("user") || "";
  const initialPerPage = Number(searchParams.get("perPage") || "10");

  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [startDate, setStartDate] = useState<string>(initialStartDate);
  const [endDate, setEndDate] = useState<string>(initialEndDate);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [consultationsPerPage, setConsultationsPerPage] =
    useState(initialPerPage);

  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );

  // swr
  const { users } = useUsersList();

  // URL 업데이트 함수
  const updateUrl = () => {
    const params = new URLSearchParams();

    if (currentPage > 1) params.set("page", currentPage.toString());
    if (searchTerm) params.set("search", searchTerm);
    if (startDate !== today) params.set("startDate", startDate);
    if (endDate !== today) params.set("endDate", endDate);
    if (selectedUser?.id) params.set("user", selectedUser.id);
    if (consultationsPerPage !== 10)
      params.set("perPage", consultationsPerPage.toString());

    const newUrl = `/consultations/search${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    router.push(newUrl, { scroll: false });
  };

  // 상태가 변경될 때마다 URL 업데이트
  useEffect(() => {
    updateUrl();
  }, [
    currentPage,
    searchTerm,
    startDate,
    endDate,
    selectedUser,
    consultationsPerPage,
  ]);

  // 초기 사용자 ID로 사용자 객체 찾기
  useEffect(() => {
    if (initialUserId && users.length > 0) {
      const user =
        users.find((user: UserType) => user.id === initialUserId) || null;
      setSelectedUser(user);
    }
  }, [initialUserId, users]);

  const debounceSearchTerm = useDebounce(searchTerm, 300);
  const debounceStartDate = useDebounce(startDate, 300);
  const debounceEndDate = useDebounce(endDate, 300);

  const {
    consultations,
    totalPages,
    isLoading: isConsultationsLoading,
  } = useConsultationSearch({
    page: currentPage,
    limit: consultationsPerPage,
    selectedUser,
    startDate: debounceStartDate,
    endDate: debounceEndDate,
    content: debounceSearchTerm,
  });

  const paginationNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        pageNumbers.push(i);
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        pageNumbers.push("...");
      }
    }
    return pageNumbers;
  };

  const numberToKorean = (num: number): string => {
    if (num === 0) return "영";

    const isNegative = num < 0;
    num = Math.abs(num);

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

    result = result.trim().replace(/일십/g, "십");

    return isNegative ? `마이너스 ${result}` : result;
  };

  const handleDocumentClick = (document: Document) => {
    const consultation = consultations?.find((consultation: any) =>
      consultation.documents.some((doc: any) => doc.id === document.id)
    );

    if (!consultation) {
      console.warn("해당 문서를 찾을 수 없습니다.", document);
      return;
    }

    const doc = consultation.documents.find(
      (doc: any) => doc.id === document.id
    );

    if (!doc) {
      console.warn("해당 문서 정보를 찾을 수 없습니다.", document);
      return;
    }

    if (doc.type === "estimate") {
      setSelectedDocument({
        ...doc,
        content: {
          ...doc.content,
          payment_method: consultation.payment_method,
        },
        contact_level: consultation.contact_level || "",
        contact_name: consultation.contact_name || "",
        user_name: consultation.users?.name || "",
        user_level: consultation.users?.level || "",
        company_fax: consultation.companies?.fax || "",
        company_phone: consultation.companies?.phone,
        contact_mobile:
          consultation.contacts_consultations?.[0]?.contacts?.mobile || "",
      });
    } else if (doc.type === "order") {
      setSelectedDocument({
        ...doc,
        contact_level: consultation.contact_level || "",
        contact_name: consultation.contact_name || "",
        user_name: consultation.users?.name || "",
        user_level: consultation.users?.level || "",
        company_fax: consultation.companies?.fax || "",
        company_phone: consultation.companies?.phone,
        contact_mobile:
          consultation.contacts_consultations?.[0]?.contacts?.mobile || "",
        payment_method: consultation.payment_method,
      });
    } else if (doc.type === "requestQuote") {
      setSelectedDocument({
        ...doc,
        contact_level: consultation.contact_level || "",
        contact_name: consultation.contact_name || "",
        user_name: consultation.users?.name || "",
        user_level: consultation.users?.level || "",
        company_fax: consultation.companies?.fax || "",
        company_phone: consultation.companies?.phone,
        contact_mobile:
          consultation.contacts_consultations?.[0]?.contacts?.mobile || "",
      });
    }

    setOpenModal(true);
  };

  const handleModalClose = () => {
    setOpenModal(false);
    setSelectedDocument(null);
  };

  const formatContentWithLineBreaks = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStartDate(today);
    setEndDate(today);
    setSelectedUser(null);
    setCurrentPage(1);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  console.log("documentststst", consultations);

  return (
    <div className="text-sm text-gray-800">
      {/* 검색 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 상담내용 */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상담내용
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="검색어 입력 (ID,OD,500m 등)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          {/* 상담 기간 */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상담 기간
            </label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
              <span className="text-gray-500">~</span>
              <div className="relative flex-1">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
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
                {users.map((user: UserType) => (
                  <option key={user.id} value={user.id}>
                    {user.name} {user.level}
                  </option>
                ))}
              </select>
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          {/* 필터 액션 */}
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors w-full justify-center"
            >
              <X size={16} />
              <span>필터 초기화</span>
            </button>
          </div>
        </div>
      </div>

      {/* 테이블 컨트롤 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          {isConsultationsLoading ? (
            <span>로딩 중...</span>
          ) : (
            <span>
              총{" "}
              <span className="font-semibold text-blue-600">
                {totalPages * consultationsPerPage}
              </span>
              개 상담 내역
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">표시 개수:</label>
          <select
            value={consultationsPerPage}
            onChange={(e) => {
              setConsultationsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="10">10개</option>
            <option value="20">20개</option>
            <option value="30">30개</option>
            <option value="50">50개</option>
          </select>
        </div>
      </div>

      {/* 상담 내역 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        {isConsultationsLoading ? (
          <div className="flex justify-center items-center py-20">
            <CircularProgress size={40} />
          </div>
        ) : consultations && consultations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    거래처
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                  >
                    상담일
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
                    상담자
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    내용
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    문서
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consultations.map((consultation: any) => (
                  <tr
                    key={consultation.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                        onClick={() =>
                          router.push(
                            `/consultations/${consultation.companies.id}`
                          )
                        }
                      >
                        {consultation.companies?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">
                        {consultation.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">
                        {consultation?.contact_name}{" "}
                        {consultation?.contact_level}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">
                        {consultation.users?.name} {consultation.users?.level}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="text-sm text-gray-900 overflow-y-auto pr-2"
                        style={{ maxHeight: "80px" }}
                      >
                        {formatContentWithLineBreaks(consultation.content)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {["estimate", "order", "requestQuote"].map((type) => {
                          const filteredDocs = consultation.documents.filter(
                            (doc: any) => doc.type === type
                          );
                          if (filteredDocs?.length > 0) {
                            return (
                              <div key={type} className="flex items-start">
                                <FileText className="w-4 h-4 mt-1 mr-2 text-gray-500 flex-shrink-0" />
                                <div>
                                  <span className="text-xs font-medium text-gray-700">
                                    {type === "estimate"
                                      ? "견적서"
                                      : type === "order"
                                      ? "발주서"
                                      : "의뢰서"}
                                  </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {filteredDocs?.map((doc: any) => (
                                      <span
                                        key={doc.id}
                                        onClick={() => handleDocumentClick(doc)}
                                        className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
                                      >
                                        {doc.document_number}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })}
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
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
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
                setCurrentPage(Math.min(currentPage + 1, totalPages))
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

      {/* 모달 */}
      <AnimatePresence>
        {openModal && selectedDocument && (
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <DocumentModal
                type={selectedDocument.type}
                koreanAmount={numberToKorean}
                company_fax={selectedDocument.company_phone || ""}
                company_phone={selectedDocument.company_fax || ""}
                document={selectedDocument}
                onClose={handleModalClose}
              />
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
