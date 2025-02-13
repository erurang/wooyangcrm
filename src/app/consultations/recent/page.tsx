"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Snackbar, Alert, Button } from "@mui/material"; // MUI 사용
import { useRouter } from "next/navigation";
import DocumentModal from "@/components/documents/estimate/DocumentModal"; // 모달 컴포넌트 추가

interface Document {
  id: string;
  type: "estimate" | "purchase_order" | "request";
  document_number: string;
  content: {
    company_name: string;
  };
}

interface Consultation {
  id: string;
  date: string;
  companies: {
    name: string;
    id: string;
  };
  users: {
    name: string;
  };
  content: string;
  documents: Document[];
  contact_name: string;
}

interface User {
  id: string;
  name: string;
}

export default function RecentConsultations() {
  const today = new Date().toISOString().split("T")[0]; // 현재 날짜
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]; // 7일 전 날짜

  const [users, setUsers] = useState<User[]>([]); // 유저 목록
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [filteredConsultations, setFilteredConsultations] = useState<
    Consultation[]
  >([]);
  const [searchTerm, setSearchTerm] = useState<string>(""); // 검색어
  const [userTerm, setUserTerm] = useState<string>(""); // 상담자 필터
  const [startDate, setStartDate] = useState<string>(sevenDaysAgo); // 시작 날짜
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

      setConsultations(data || []);
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
    setSelectedDocument(document);
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
      {/* <div className="text-gray-500 text-sm mb-2">
        {searchTerm && <span>검색어: {searchTerm} </span>}
        {userTerm && <span>상담자: {userTerm} </span>}
        {startDate && endDate && (
          <span>
            날짜: {startDate} ~ {endDate}
          </span>
        )}
      </div> */}
      {/* 검색 및 필터 */}
      <div className="bg-[#FBFBFB] rounded-md border-[1px] px-4 py-4 mb-4">
        <div className="grid grid-cols-5 gap-4">
          <div className="flex items-center">
            <label className="mr-4 font-semibold">검색어</label>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="회사명"
              className="w-3/4 p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex items-center">
            <label className="mr-4  font-semibold">시작 날짜</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-3/4 p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex items-center">
            <label className="mr-4  font-semibold">종료 날짜</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-3/4 p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div></div>
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setUserTerm("");
                setStartDate(sevenDaysAgo); // 7일 전으로 초기화
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
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border-b border-r w-1/12">상담일자</th>
              <th className="px-4 py-2 border-b border-r w-2/12">회사명</th>
              <th className="px-4 py-2 border-b border-r w-1/12">피상담자</th>
              <th className="px-4 py-2 border-b border-r ">내용</th>
              <th className="px-4 py-2 border-b border-r w-3/12">문서</th>
            </tr>
          </thead>
          <tbody>
            {filteredConsultations.map((consultation) => (
              <tr key={consultation.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b border-r">
                  {consultation.date}
                </td>
                <td
                  className="px-4 py-2 border-b border-r text-blue-500 cursor-pointer"
                  onClick={() =>
                    router.push(`/consultations/${consultation.companies.id}`)
                  }
                >
                  {consultation.companies?.name}
                </td>
                <td className="px-4 py-2 border-b border-r">
                  {consultation.contact_name}
                </td>
                <td
                  className="px-4 py-2 border-b border-r"
                  style={{
                    minHeight: "8rem",
                    maxHeight: "8rem",
                    overflowY: "auto",
                    display: "block",
                  }}
                >
                  {formatContentWithLineBreaks(consultation.content)}
                </td>
                <td className="px-4 py-2 border-b">
                  <div
                    className="gap-4 text-left"
                    style={{
                      minHeight: "8rem",
                      maxHeight: "8rem",
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
            className="px-4 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-200"
          >
            이전
          </button>

          {paginationNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(Number(page))}
              className={`px-4 py-2 rounded ${
                page === currentPage
                  ? "bg-blue-500 text-white"
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
            className="px-4 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-200"
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
      {/* {openModal && selectedDocument && (
        <DocumentModal
          type={selectedDocument.type}
          users={users}
          company_fax={""}
          company_phone={""}
          document={selectedDocument}
          onClose={handleModalClose}
        />
      )} */}
    </div>
  );
}
