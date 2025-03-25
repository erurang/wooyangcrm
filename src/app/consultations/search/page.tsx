"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useUsersList } from "@/hooks/useUserList";
import SnackbarComponent from "@/components/Snackbar";
import DocumentModal from "@/components/documents/estimate/DocumentModal";

import { useCompanySearch } from "@/hooks/manage/contacts/useCompanySearch";
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

interface User {
  id: string;
  name: string;
  level: string;
}

export default function RecentConsultations() {
  const today = new Date().toISOString().split("T")[0];

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [consultationsPerPage, setConsultationsPerPage] = useState(5);

  const [snackbarMessage, setSnackbarMessage] = useState<string>("");

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );

  const router = useRouter();

  // swr
  const { users } = useUsersList();

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

  //

  const paginationNumbers = () => {
    let pageNumbers = [];
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
      <div className="bg-[#FBFBFB] rounded-md border px-4 py-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_0.5fr] gap-4">
          <div className="flex items-center justify-center">
            <label className="p-2 border border-gray-300 rounded-l min-w-[80px] h-full">
              상담내용
            </label>
            <motion.input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder=", 로 구분하여 여러 조건을 검색 (ID,OD,500m 등등..)"
              className="p-2 border-t border-b border-r border-gray-300 rounded-r w-full h-full"
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>
          <div className="flex items-center justify-center">
            <label className="p-2 border border-gray-300 rounded-l min-w-[80px] h-full">
              시작 날짜
            </label>
            <motion.input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 border-t border-b border-r border-gray-300 rounded-r w-full h-full"
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>
          <div className="flex items-center justify-center">
            <label className="p-2 border border-gray-300 rounded-l min-w-[80px] h-full">
              종료 날짜
            </label>
            <motion.input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 border-t border-b border-r border-gray-300 rounded-r w-full h-full"
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>
          <div className="flex items-center justify-center">
            <label className="p-2 border border-gray-300 rounded-l min-w-[60px] h-full">
              상담자
            </label>
            <motion.select
              className="p-2 border-t border-b border-r border-gray-300 rounded-r w-full h-full"
              value={selectedUser?.id || ""} // ✅ userId 저장
              onChange={(e) => {
                const user =
                  users.find((user: User) => user.id === e.target.value) ||
                  null;
                setSelectedUser(user);
              }}
            >
              <option value="">전체</option>
              {users.map((user: User) => (
                <option key={user.id} value={user.id}>
                  {" "}
                  {user.name} {user.level}
                </option>
              ))}
            </motion.select>
          </div>
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setStartDate(today);
                setEndDate(today);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-md"
            >
              필터리셋
            </button>
          </div>
        </div>
      </div>
      {/* 상담 내역 테이블 */}
      <div className="flex justify-end items-center mb-4">
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

      <div className="bg-[#FBFBFB] rounded-md border">
        <table className="min-w-full table-auto border-collapse text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border-b border-r w-2/12">거래처</th>
              <th className="px-4 py-2 border-b border-r hidden md:table-cell w-1/12">
                상담일
              </th>
              <th className="px-4 py-2 border-b border-r hidden md:table-cell w-1/12">
                담당자
              </th>
              <th className="px-4 py-2 border-b border-r hidden md:table-cell w-1/12">
                상담자
              </th>
              <th className="px-4 py-2 border-b border-r">내용</th>
              <th className="px-4 py-2 border-b border-r w-3/12">문서</th>
            </tr>
          </thead>
          <tbody>
            {consultations?.map((consultation: any) => (
              <tr key={consultation.id} className="hover:bg-gray-100 border-b">
                <td
                  className="px-4 py-2 border-r text-blue-500 cursor-pointer"
                  onClick={() =>
                    router.push(`/consultations/${consultation.companies.id}`)
                  }
                >
                  {consultation.companies?.name}
                </td>
                <td className="px-4 py-2 border-r hidden md:table-cell">
                  {consultation.date}
                </td>
                <td className="px-4 py-2 border-r hidden md:table-cell">
                  {consultation?.contact_name} {consultation?.contact_level}
                </td>
                <td className="px-4 py-2 border-r hidden md:table-cell">
                  {consultation.users?.name} {consultation.users?.level}
                </td>
                <td
                  className="px-4 pt-2 border-r text-start"
                  style={{
                    minHeight: "8rem",
                    maxHeight: "8rem",
                    overflowY: "auto",
                    display: "block",
                  }}
                >
                  {formatContentWithLineBreaks(consultation.content)}
                </td>
                <td className="px-4 pt-2">
                  <div
                    className="gap-4 text-left"
                    style={{
                      minHeight: "7rem",
                      maxHeight: "7rem",
                      overflowY: "auto",
                      display: "block",
                    }}
                  >
                    {["estimate", "order", "requestQuote"].map((type) => {
                      const filteredDocs = consultation.documents.filter(
                        (doc: any) => doc.type === type
                      );
                      if (filteredDocs?.length > 0) {
                        return (
                          <div key={type} className="mb-2">
                            <span className="font-semibold">
                              {type === "estimate"
                                ? "견적서"
                                : type === "order"
                                ? "발주서"
                                : "의뢰서"}
                            </span>
                            :{" "}
                            {filteredDocs?.map((doc: any, index: any) => (
                              <span key={doc.id}>
                                <span
                                  className="text-blue-500 cursor-pointer"
                                  onClick={() => handleDocumentClick(doc)}
                                >
                                  {doc.document_number}
                                </span>
                                {index < filteredDocs?.length - 1 && " | "}
                              </span>
                            ))}
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

          {paginationNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(Number(page))}
              className={`px-3 py-1 border rounded ${
                currentPage === page
                  ? "bg-blue-500 text-white font-bold"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-200"
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
            className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
          >
            다음
          </button>
        </div>
      </div>

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
