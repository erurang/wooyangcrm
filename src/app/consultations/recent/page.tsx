"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  User,
  RefreshCw,
  FileText,
  Building,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useUsersList } from "@/hooks/useUserList";
import SnackbarComponent from "@/components/Snackbar";
import DocumentModal from "@/components/documents/estimate/DocumentModal";
import { useDebounce } from "@/hooks/useDebounce";
import { useCompanySearch } from "@/hooks/manage/contacts/useCompanySearch";
import { useConsultationsList } from "@/hooks/consultations/recent/useConsultationsList";

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

export default function RecentConsultationsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = new Date().toISOString().split("T")[0];

  // URL 쿼리 파라미터에서 초기값 가져오기
  const initialPage = Number(searchParams.get("page") || "1");
  const initialSearchTerm = searchParams.get("search") || "";
  const initialStartDate = searchParams.get("startDate") || today;
  const initialEndDate = searchParams.get("endDate") || today;
  const initialUserId = searchParams.get("user") || "";
  const initialPerPage = Number(searchParams.get("perPage") || "5");

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
    if (consultationsPerPage !== 5)
      params.set("perPage", consultationsPerPage.toString());

    const newUrl = `/consultations/recent${
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
  const { companies, isLoading, isError } =
    useCompanySearch(debounceSearchTerm);

  const companyIds = companies.map((company: any) => company.id);
  const debounceCompanyIds = useDebounce(companyIds, 300);
  const debounceStartDate = useDebounce(startDate, 300);
  const debounceEndDate = useDebounce(endDate, 300);

  const {
    consultations,
    totalPages,
    isLoading: isConsultationsLoading,
  } = useConsultationsList({
    page: currentPage,
    limit: consultationsPerPage,
    selectedUser,
    startDate: debounceStartDate,
    endDate: debounceEndDate,
    companyIds: debounceCompanyIds,
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

  return (
    <div className="text-sm text-[#37352F]">
      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Building className="w-4 h-4 mr-2 text-gray-500" />
              거래처
            </label>
            <motion.input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="거래처명 입력"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              whileFocus={{
                scale: 1.02,
                boxShadow: "0px 0px 8px rgba(59, 130, 246, 0.3)",
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-gray-500" />
              상담 기간
            </label>
            <div className="flex items-center space-x-2">
              <motion.input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                whileFocus={{
                  scale: 1.02,
                  boxShadow: "0px 0px 8px rgba(59, 130, 246, 0.3)",
                }}
              />
              <span className="text-gray-500">~</span>
              <motion.input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                whileFocus={{
                  scale: 1.02,
                  boxShadow: "0px 0px 8px rgba(59, 130, 246, 0.3)",
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <User className="w-4 h-4 mr-2 text-gray-500" />
              상담자
            </label>
            <motion.select
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedUser?.id || ""}
              onChange={(e) => {
                const user =
                  users.find((user: UserType) => user.id === e.target.value) ||
                  null;
                setSelectedUser(user);
                setCurrentPage(1);
              }}
              whileFocus={{
                scale: 1.02,
                boxShadow: "0px 0px 8px rgba(59, 130, 246, 0.3)",
              }}
            >
              <option value="">전체 상담자</option>
              {users.map((user: UserType) => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.level}
                </option>
              ))}
            </motion.select>
          </div>

          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              필터 초기화
            </button>
          </div>
        </div>
      </div>

      {/* 상담 내역 테이블 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-gray-500">
          {isConsultationsLoading ? (
            <span>로딩 중...</span>
          ) : (
            <span>
              총{" "}
              {totalPages > 0
                ? (currentPage - 1) * consultationsPerPage + 1
                : 0}{" "}
              -{" "}
              {Math.min(
                currentPage * consultationsPerPage,
                totalPages * consultationsPerPage
              )}{" "}
              / {totalPages * consultationsPerPage} 건
            </span>
          )}
        </div>
        <div className="flex items-center">
          <label className="mr-2 text-sm text-gray-600">표시 개수:</label>
          <select
            value={consultationsPerPage}
            onChange={(e) => {
              setConsultationsPerPage(Number(e.target.value));
              setCurrentPage(1); // ✅ 페이지 변경 시 첫 페이지로 이동
            }}
            className="border border-gray-300 p-2 rounded-md text-sm"
          >
            <option value="5">5개</option>
            <option value="10">10개</option>
            <option value="15">15개</option>
            <option value="20">20개</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
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
            {isConsultationsLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  <div className="flex justify-center items-center py-10">
                    <svg
                      className="animate-spin h-8 w-8 text-blue-500"
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
                    <span className="ml-3">데이터를 불러오는 중입니다...</span>
                  </div>
                </td>
              </tr>
            ) : consultations?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  검색 결과가 없습니다
                </td>
              </tr>
            ) : (
              consultations?.map((consultation: any) => (
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
                      {consultation?.contact_name} {consultation?.contact_level}
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
              ))
            )}
          </tbody>
        </table>
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

      {/* 스낵바 */}
      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />

      {/* 모달 */}
      {openModal && selectedDocument && (
        <DocumentModal
          type={selectedDocument.type}
          koreanAmount={numberToKorean}
          company_fax={selectedDocument.company_phone || ""}
          company_phone={selectedDocument.company_fax || ""}
          document={selectedDocument}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
