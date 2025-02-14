"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Snackbar, Alert, Button } from "@mui/material"; // MUI 사용
import { useRouter } from "next/navigation";
import DocumentModal from "@/components/documents/estimate/DocumentModal"; // 모달 컴포넌트 추가

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
  contact_name?: string; // 🔹 상담 담당자 추가
  contact_level?: string; // 🔹 상담 담당자의 직급 추가
  contact_mobile?: string; // 🔹 담당자 연락처 추가
  company_fax?: string; // 🔹 회사 팩스 추가
  company_tel?: string; // 🔹 회사 전화번호 추가
  delivery_date?: string; // 🔹 납기일자 추가
  user_name?: string; // 🔹 견적자 또는 발주자 이름 추가
  user_level?: string; // 🔹 견적자 또는 발주자 직급 추가
  payment_method?: string;
}

interface Consultation {
  id: string;
  date: string;
  companies: {
    name: string;
    id: string;
    fax?: string;
    phone?: string;
  };
  users: {
    name: string;
    level: string;
  };
  content: string;
  documents: Document[];
  contact_name: string;
  contact_level: string;
  contacts_consultations?: {
    contacts: {
      mobile?: string;
    };
  }[];
  payment_method?: string;
}

interface User {
  id: string;
  name: string;
}

export default function RecentConsultations() {
  const today = new Date().toISOString().split("T")[0]; // 현재 날짜
  // const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  //   .toISOString()
  //   .split("T")[0]; // 7일 전 날짜

  const [users, setUsers] = useState<User[]>([]); // 유저 목록
  const [filteredConsultations, setFilteredConsultations] = useState<
    Consultation[]
  >([]);
  const [searchTerm, setSearchTerm] = useState<string>(""); // 검색어
  const [userTerm, setUserTerm] = useState<string>(""); // 상담자 필터
  const [startDate, setStartDate] = useState<string>(today); // 시작 날짜
  const [endDate, setEndDate] = useState<string>(today); // 종료 날짜

  const [currentPage, setCurrentPage] = useState<number>(1); // 현재 페이지
  const [totalPages, setTotalPages] = useState<number>(1); // 총 페이지 수
  const consultationsPerPage = 5; // 페이지당 데이터 수
  const [loading, setLoading] = useState<boolean>(false); // 로딩 상태

  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false); // 스낵바 상태
  const [snackbarMessage, setSnackbarMessage] = useState<string>(""); // 스낵바 메시지

  const [openModal, setOpenModal] = useState<boolean>(false); // 모달 상태
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  ); // 선택된 문서

  const router = useRouter();

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

  const fetchConsultations = async (pageNumber: number) => {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/consultations/recent?page=${pageNumber}&limit=${consultationsPerPage}&search=${searchTerm}&user=${userTerm}&startDate=${startDate}&endDate=${endDate}`
      );

      const { consultations: data, total } = await response.json();

      // 페이지 수 계산
      const calculatedTotalPages = Math.ceil(total / consultationsPerPage);
      setTotalPages(calculatedTotalPages);

      setFilteredConsultations(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching consultations:", error);
      setSnackbarMessage(
        "데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
      setOpenSnackbar(true);
      setLoading(false);
    }
  };

  const handleDocumentClick = (document: Document) => {
    // 🔹 `filteredConsultations`에서 `documents` 배열 안에서 `document.id`와 일치하는 문서를 찾기
    const consultation = filteredConsultations.find((consultation) =>
      consultation.documents.some((doc) => doc.id === document.id)
    );

    if (!consultation) {
      console.warn("해당 문서를 찾을 수 없습니다.", document);
      return;
    }

    // 🔹 `consultation`에서 `document.id`에 해당하는 문서 찾기
    const doc = consultation.documents.find((doc) => doc.id === document.id);

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
        company_fax: consultation.companies?.fax || "", // 회사 팩스 정보 추가
        contact_mobile:
          consultation.contacts_consultations?.[0]?.contacts?.mobile || "", // 연락처 정보 추가
      });
    } else if (doc.type === "order") {
      setSelectedDocument({
        ...doc,
        contact_level: consultation.contact_level || "",
        contact_name: consultation.contact_name || "",
        user_name: consultation.users?.name || "",
        user_level: consultation.users?.level || "",
        company_fax: consultation.companies?.fax || "", // 회사 팩스 정보 추가
        contact_mobile:
          consultation.contacts_consultations?.[0]?.contacts?.mobile || "", // 연락처 정보 추가
        payment_method: consultation.payment_method,
      });
    }

    setOpenModal(true);
  };
  const handleModalClose = () => {
    setOpenModal(false);
    setSelectedDocument(null);
  };

  const fetchUsers = async () => {
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, name");

    if (usersError) {
      setSnackbarMessage("유저 목록을 불러오는 데 실패했습니다.");
      setOpenSnackbar(true);
    } else {
      setUsers(usersData || []);
    }
  };

  const formatContentWithLineBreaks = (content: string) => {
    // 줄바꿈 문자를 <br /> 태그로 변환
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  useEffect(() => {
    fetchUsers();
    fetchConsultations(currentPage);
  }, [currentPage]);

  useEffect(() => {
    // ESC 키 핸들러
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenModal(false); // 추가 모달 닫기
      }
    };

    // 키다운 이벤트 등록
    window.addEventListener("keydown", handleKeyDown);

    // 언마운트 시 이벤트 제거
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="text-sm text-[#37352F]">
      <h2 className="text-sm font-semibold mb-4">최근 상담 내역</h2>
      {/* 검색 및 필터 */}
      <div className="bg-[#FBFBFB] rounded-md border-[1px] px-4 py-4 mb-4">
        <div className="grid grid-cols-5 gap-4">
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
                scale: 1.05, // 입력 시 약간 확대
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                scale: 1.05, // 입력 시 약간 확대
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                scale: 1.05, // 입력 시 약간 확대
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
              }}
            />
          </div>
          <div className="flex items-center justify-center">
            <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
              상담자
            </label>
            <motion.select
              value={userTerm}
              onChange={(e) => setUserTerm(e.target.value)}
              className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
              whileFocus={{
                scale: 1.05, // 선택 시 약간 확대
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
              }}
            >
              <option value="">전체</option> {/* ✅ 기본값 추가 */}
              {users.map((user) => (
                <option key={user.id} value={user.name}>
                  {user.name}
                </option>
              ))}
            </motion.select>
          </div>
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setUserTerm("");
                setStartDate(today); // 7일 전으로 초기화
                setEndDate(today); // 오늘로 초기화
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2"
            >
              초기화
            </button>
            <button
              onClick={() => fetchConsultations(1)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              검색
            </button>
          </div>
        </div>
      </div>
      {/* 상담 내역 테이블 */}
      <div className="bg-[#FBFBFB] rounded-md border">
        <table className="min-w-full table-auto border-collapse text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border-b border-r w-2/12">회사명</th>
              <th className="px-4 py-2 border-b border-r w-1/12">상담일자</th>
              <th className="px-4 py-2 border-b border-r w-1/12">피상담자</th>
              <th className="px-4 py-2 border-b border-r w-1/12">상담자</th>
              <th className="px-4 py-2 border-b border-r">내용</th>
              <th className="px-4 py-2 border-b border-r w-3/12">문서</th>
            </tr>
          </thead>
          <tbody>
            {filteredConsultations.map((consultation) => (
              <tr key={consultation.id} className="hover:bg-gray-100 border-b">
                <td
                  className="px-4 py-2 border-r text-blue-500 cursor-pointer"
                  onClick={() =>
                    router.push(`/consultations/${consultation.companies.id}`)
                  }
                >
                  {consultation.companies?.name}
                </td>
                <td className="px-4 py-2 border-r">{consultation.date}</td>
                <td className="px-4 py-2 border-r">
                  {consultation.contact_name} {consultation.contact_level}
                </td>
                <td className="px-4 py-2 border-r">
                  {consultation.users.name} {consultation.users.level}
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
                        (doc) => doc.type === type
                      );
                      if (filteredDocs.length > 0) {
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
                            {filteredDocs.map((doc, index) => (
                              <span key={doc.id}>
                                <span
                                  className="text-blue-500 cursor-pointer"
                                  onClick={() => handleDocumentClick(doc)}
                                >
                                  {doc.document_number}
                                </span>
                                {index < filteredDocs.length - 1 && " | "}
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
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="error">{snackbarMessage}</Alert>
      </Snackbar>
      {/* 모달 */}
      {openModal && selectedDocument && (
        <DocumentModal
          type={selectedDocument.type}
          koreanAmount={numberToKorean(selectedDocument.content.total_amount)}
          company_fax={""}
          document={selectedDocument}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
