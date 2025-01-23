"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Snackbar, Alert, Button } from "@mui/material";
import Link from "next/link";
import { useLoginUser } from "@/app/context/login";
import { v4 as uuidv4 } from "uuid";

interface Consultation {
  id: string;
  created_at: string;
  date: string;
  content: string;
  company_id: string;
  contact: string;
  follow_up_date: string;
  priority: string;
  user_id: string;
}

interface Contact {
  name: string;
  mobile: string;
  department: string;
  level: string;
  email: string;
}

interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  fax: string;
  notes: string;
  business_number: string;
  contact: Contact[]; // 연락처 배열 추가
}

interface User {
  id: string;
  name: string;
}

export default function ConsultationPage() {
  const loginUser = useLoginUser();

  const router = useRouter();
  const { id } = useParams();
  const [consultations, setConsultations] = useState<Consultation[]>([]); // 여러 개의 상담 내역을 저장
  const [company, setCompany] = useState<Company | null>(null);
  const [documents, setDocuments] = useState<any[]>([]); // 문서 관련 데이터
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [openAddModal, setOpenAddModal] = useState(false); // 상담내역 추가 모달 상태
  const [openEditModal, setOpenEditModal] = useState(false); // 상담내역 수정 모달 상태
  const [newConsultation, setNewConsultation] = useState({
    date: new Date().toISOString().split("T")[0], // 기본값을 오늘 날짜로 설정
    follow_up_date: "",
    contact: "", // 피상담자 (텍스트 필드로 변경)
    user_id: loginUser ? loginUser.id : "", // 유저 아이디는 추후 수정 필요
    content: "",
  });
  const [users, setUsers] = useState<User[]>([]); // 유저 목록
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
  const [totalPages, setTotalPages] = useState(1); // 전체 페이지 수
  const consultationsPerPage = 4; // 한 페이지에 보여줄 상담 내역 개수
  const [selectedConsultation, setSelectedConsultation] =
    useState<Consultation | null>(null); // 선택된 상담 내역

  const [openDeleteModal, setOpenDeleteModal] = useState(false); // 삭제 모달 상태
  const [consultationToDelete, setConsultationToDelete] =
    useState<Consultation | null>(null); // 삭제할 상담 내역

  // 상담 내역을 가져오는 함수
  const fetchConsultationData = async () => {
    if (!id) return;

    setLoading(true);

    try {
      const { data: companyData, error: companyDataError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();

      if (companyDataError) {
        setSnackbarMessage("회사를 불러오는 데 실패했습니다.");
        setOpenSnackbar(true);
        setLoading(false);
        return;
      }

      setCompany(companyData);

      // 여러 개의 상담 내역 가져오기 (페이지네이션을 위해 limit과 offset 사용)
      const {
        data: consultationsData,
        error: consultationsError,
        count,
      } = await supabase
        .from("consultations")
        .select("*", { count: "exact" })
        .eq("company_id", id) // company_id로 해당 회사의 상담 내역을 가져옵니다.
        .range(
          (currentPage - 1) * consultationsPerPage,
          currentPage * consultationsPerPage - 1
        )
        .order("created_at", { ascending: false }); // created_at 기준 내림차순 정렬

      if (consultationsError) {
        setSnackbarMessage("상담 내역을 불러오는 데 실패했습니다.");
        setOpenSnackbar(true);
        setLoading(false);
        return;
      }

      setConsultations(consultationsData || []);
      setTotalPages(count ? Math.ceil(count / consultationsPerPage) : 1); // count가 null일 경우 1 페이지로 설정

      // 관련된 문서들 가져오기 (consultation_id를 기준으로)
      const consultationIds = consultationsData?.map(
        (consultation) => consultation.id
      ); // 상담 내역의 id 배열
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .select("id,type,consultation_id")
        .in("consultation_id", consultationIds); // 상담 내역에 해당하는 문서들만 가져오기

      if (documentError) {
        setSnackbarMessage("문서를 불러오는 데 실패했습니다.");
        setOpenSnackbar(true);
      } else {
        setDocuments(documentData || []);
      }

      setLoading(false);
    } catch (error) {
      setSnackbarMessage("데이터를 가져오는 데 오류가 발생했습니다.");
      setOpenSnackbar(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    // ESC 키 핸들러
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenAddModal(false); // 추가 모달 닫기
        setOpenEditModal(false); // 수정 모달 닫기
        setOpenDeleteModal(false); // 삭제 모달 닫기
      }
    };

    // 키다운 이벤트 등록
    window.addEventListener("keydown", handleKeyDown);

    // 언마운트 시 이벤트 제거
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    // 로그인된 유저 정보가 변경되면 user_id를 업데이트
    if (loginUser && loginUser.id) {
      setNewConsultation((prev) => ({
        ...prev,
        user_id: loginUser.id, // 로그인한 유저의 id로 기본값 설정
      }));
    }
  }, [loginUser]); // loginUser 값이 변경될 때마다 실행

  useEffect(() => {
    fetchConsultationData(); // 페이지 로드 시 상담 내역을 가져옴
    // 유저 목록 가져오기
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

    fetchUsers();
  }, [id, currentPage]); // currentPage가 변경될 때마다 상담 내역을 새로 가져옴

  const handleAddConsultation = async () => {
    const { content, follow_up_date, user_id, contact } = newConsultation;
    const formattedFollowUpDate = follow_up_date ? follow_up_date : null;

    if (
      !content ||
      // || !follow_up_date
      !user_id ||
      !contact
    ) {
      setSnackbarMessage("필수 항목을 모두 입력하세요.");
      setOpenSnackbar(true);
      return;
    }

    try {
      const { data, error } = await supabase.from("consultations").insert([
        {
          date: new Date().toISOString().split("T")[0],
          company_id: id,
          content,
          follow_up_date: formattedFollowUpDate,
          user_id,
          contact, // 피상담자는 이제 단순 텍스트
        },
      ]);

      if (error) {
        setSnackbarMessage("상담 내역 추가 실패");
        setOpenSnackbar(true);
      } else {
        setSnackbarMessage("상담 내역 추가 완료");
        setOpenSnackbar(true);
        setOpenAddModal(false);
        setNewConsultation({
          date: new Date().toISOString().split("T")[0], // 초기화
          follow_up_date: "",
          contact: "",
          user_id: loginUser ? loginUser.id : "",
          content: "",
        });

        // 상담 내역을 다시 불러옴 (다수의 상담 내역)
        fetchConsultationData();
      }
    } catch (error) {
      setSnackbarMessage("상담 내역 추가 중 오류가 발생했습니다.");
      setOpenSnackbar(true);
    }
  };

  // 수정 버튼을 누르면 모달에 기존 상담 내역을 불러오기
  const handleEditConsultation = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setNewConsultation({
      date: consultation.date,
      follow_up_date: consultation.follow_up_date,
      contact: consultation.contact,
      user_id: consultation.user_id,
      content: consultation.content,
    });
    setOpenEditModal(true);
  };

  const handleUpdateConsultation = async () => {
    const { content, follow_up_date, user_id, contact } = newConsultation;
    if (
      !content ||
      // || !follow_up_date
      !user_id ||
      !contact
    ) {
      setSnackbarMessage("필수 항목을 모두 입력하세요.");
      setOpenSnackbar(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("consultations")
        .update({
          content,
          follow_up_date,
          user_id,
          contact, // 피상담자는 이제 단순 텍스트
        })
        .eq("id", selectedConsultation?.id);

      if (error) {
        setSnackbarMessage("상담 내역 수정 실패");
        setOpenSnackbar(true);
      } else {
        setSnackbarMessage("상담 내역 수정 완료");
        setOpenSnackbar(true);
        setOpenEditModal(false);

        // 상담 내역을 다시 불러옴
        fetchConsultationData();
      }
    } catch (error) {
      setSnackbarMessage("상담 내역 수정 중 오류가 발생했습니다.");
      setOpenSnackbar(true);
    }
  };

  // 이전 페이지로 이동
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 다음 페이지로 이동
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 페이지 번호 클릭
  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  // 페이지네이션 번호 리스트 생성
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

  // company 관련 부분을 useMemo로 감싸 최적화
  const companyMemo = useMemo(() => company, [company]);

  const handleDeleteConsultation = async (consultation: Consultation) => {
    setConsultationToDelete(consultation);
    setOpenDeleteModal(true); // 삭제 모달 열기
  };

  const handleConfirmDelete = async () => {
    if (!consultationToDelete) return;

    try {
      const { error } = await supabase.from("deletion_requests").insert([
        {
          related_id: consultationToDelete.id,
          status: "pending", // 삭제 요청 대기 상태
          type: "consultation",
        },
      ]);

      console.log(error);

      if (error) {
        setSnackbarMessage("삭제 요청을 생성하는 데 실패했습니다.");
        setOpenSnackbar(true);
      } else {
        setSnackbarMessage("삭제 요청이 생성되었습니다.");
        setOpenSnackbar(true);
        setOpenDeleteModal(false);
        fetchConsultationData(); // 상담 내역 새로고침
      }
    } catch (error) {
      setSnackbarMessage("삭제 요청 생성 중 오류가 발생했습니다.");
      setOpenSnackbar(true);
    }
  };

  const formatContentWithLineBreaks = (content: string) => {
    // 줄바꿈 문자를 <br /> 태그로 변환
    return content.split("\n").map((line, index) => (
      <span key={uuidv4()}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <div className="text-sm text-[#37352F]">
      {loading ? (
        <div className="text-center py-4">
          <span>로딩 중...</span>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <Link
              href="/customers"
              className="text-blue-500 hover:underline hover:font-bold"
            >
              거래처 관리
            </Link>{" "}
            &gt; <span className="font-semibold">{companyMemo?.name}</span> &gt;
            상담내역
          </div>

          <div className="mb-4 flex">
            <div className="font-bold text-xl">
              <h2>{companyMemo?.name}</h2>
              <div>
                <div className="flex">
                  <div className="text-sm font-normal space-x-3">
                    <span className="mt-2">{companyMemo?.address}</span>
                  </div>
                </div>
                <div className="text-xs mt-2">
                  <p>TEL : {companyMemo?.phone}</p>
                  <p>FAX : {companyMemo?.fax}</p>
                  <p>E-MAIL : {companyMemo?.email}</p>
                </div>
              </div>
              <div className="pt-2 px-2 min-h-16 max-h-16 overflow-y-auto">
                <span>비고 : {companyMemo?.notes}</span>
              </div>
            </div>
          </div>
          <div className="text-sm font-normal flex space-x-3 justify-end">
            {company?.contact.map((contact) => (
              <div className="space-x-[0.125rem] text-start" key={uuidv4()}>
                <span>담당자 : {contact.name}</span>
                <span>{contact.level}</span>
                <span>{contact.email}</span>
                <span>{contact.department}</span>
              </div>
            ))}
          </div>

          <div className="flex my-3">
            <div
              className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
              onClick={() => setOpenAddModal(true)}
            >
              <span className="mr-2">+</span>
              <span>추가</span>
            </div>
          </div>

          {/* 상담 내역 추가 모달 */}
          {openAddModal && (
            <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-md w-1/2 ">
                <h3 className="text-xl font-semibold mb-4">상담 내역 추가</h3>

                {/* 상담일 및 후속 날짜 (flex로 배치) */}
                <div className="mb-4 grid space-x-4 grid-cols-4">
                  <div className="">
                    <label className="block mb-2 text-sm font-medium">
                      상담일
                    </label>
                    <input
                      type="date"
                      value={newConsultation.date}
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      후속 날짜
                    </label>
                    <input
                      type="date"
                      value={newConsultation.follow_up_date}
                      onChange={(e) =>
                        setNewConsultation({
                          ...newConsultation,
                          follow_up_date: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      피상담자
                    </label>
                    <input
                      type="text"
                      value={newConsultation.contact}
                      onChange={(e) =>
                        setNewConsultation({
                          ...newConsultation,
                          contact: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      상담자
                    </label>
                    <select
                      value={newConsultation.user_id} // 로그인한 유저를 기본값으로 설정
                      onChange={(e) =>
                        setNewConsultation({
                          ...newConsultation,
                          user_id: e.target.value, // 유저가 선택한 값으로 설정
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      {/* 다른 유저들 */}
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 상담 내용 */}
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium">
                    상담 내용
                  </label>
                  <textarea
                    value={newConsultation.content}
                    onChange={(e) =>
                      setNewConsultation({
                        ...newConsultation,
                        content: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    rows={4}
                  />
                </div>

                {/* 버튼 */}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setOpenAddModal(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleAddConsultation}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 상담 내역 수정 모달 */}
          {openEditModal && (
            <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-md w-1/2">
                <h3 className="text-xl font-semibold mb-4">상담 내역 수정</h3>

                {/* 상담일 및 후속 날짜 (flex로 배치) */}
                <div className="mb-4 grid grid-cols-4 space-x-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      상담일
                    </label>
                    <input
                      type="date"
                      value={newConsultation.date}
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      후속 날짜
                    </label>
                    <input
                      type="date"
                      value={
                        newConsultation.follow_up_date
                          ? newConsultation.follow_up_date
                          : ""
                      }
                      onChange={(e) =>
                        setNewConsultation({
                          ...newConsultation,
                          follow_up_date: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      피상담자
                    </label>
                    <input
                      type="text"
                      value={newConsultation.contact}
                      onChange={(e) =>
                        setNewConsultation({
                          ...newConsultation,
                          contact: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      상담자
                    </label>
                    <select
                      value={newConsultation.user_id}
                      onChange={(e) =>
                        setNewConsultation({
                          ...newConsultation,
                          user_id: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 상담 내용 */}
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium">
                    상담 내용
                  </label>
                  <textarea
                    value={newConsultation.content}
                    onChange={(e) =>
                      setNewConsultation({
                        ...newConsultation,
                        content: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    rows={4}
                  />
                </div>

                {/* 버튼 */}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setOpenEditModal(false);
                      setNewConsultation({
                        date: new Date().toISOString().split("T")[0], // 초기화
                        follow_up_date: "",
                        contact: "",
                        user_id: "",
                        content: "",
                      });
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleUpdateConsultation}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 상담 내역 테이블 */}
          {consultations.length > 0 && (
            <div>
              <table className="min-w-full table-auto border-collapse text-center">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-4 py-2 border-b border-r-[1px] text-center">
                      No.
                    </th>
                    <th className="px-4 py-2 border-b border-r-[1px] text-center">
                      날짜
                    </th>
                    <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                      피상담자
                    </th>
                    <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                      상담자
                    </th>
                    <th className="px-4 py-2 border-b border-r-[1px] text-center w-5/12">
                      내용
                    </th>
                    <th className="px-4 py-2 border-b border-r-[1px] text-center">
                      체크
                    </th>
                    <th className="px-4 py-2 border-b border-r-[1px] text-center">
                      문서
                    </th>
                    <th className="px-4 py-2 border-b border-r-[1px] text-center">
                      수정
                    </th>
                    <th className="px-4 py-2 border-b border-r-[1px] text-center">
                      삭제
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((consultation, index) => (
                    <tr key={consultation.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border-b border-r-[1px]">
                        {consultation.id.slice(0, 4)}
                      </td>
                      <td className="px-4 py-2 border-b border-r-[1px]">
                        {consultation.date}
                      </td>
                      <td className="px-4 py-2 border-b border-r-[1px]">
                        {consultation.contact}
                      </td>
                      <td className="px-4 py-2 border-b border-r-[1px]">
                        {
                          users.find((user) => user.id === consultation.user_id)
                            ?.name
                        }
                      </td>
                      <td
                        className="px-4 py-2 border-b border-r-[1px] w-full"
                        style={{
                          minHeight: "120px",
                          maxHeight: "120px",
                          overflowY: "auto",
                          display: "block",
                        }}
                      >
                        {formatContentWithLineBreaks(consultation.content)}
                      </td>
                      <td className="px-4 py-2 border-b border-r-[1px]">
                        {consultation.follow_up_date}
                      </td>
                      <td className="px-4 py-2 border-b border-r-[1px]">
                        <span
                          className={`mr-2 cursor-pointer ${
                            documents.some(
                              (doc) =>
                                doc.type === "estimate" &&
                                doc.consultation_id === consultation.id
                            )
                              ? "text-blue-500 hover:font-bold"
                              : "text-gray-400 hover:text-black"
                          }`}
                          onClick={
                            () =>
                              router.push(
                                `/documents/estimate?consultId=${consultation.id}&compId=${company?.id}`
                              )
                            // router.push(
                            //   `/documents/estimate/${consultation.id}/${company?.id}`
                            // )
                          }
                        >
                          견적서
                        </span>
                        <span
                          className={`mr-2 cursor-pointer ${
                            documents.some(
                              (doc) =>
                                doc.type === "order" &&
                                doc.consultation_id === consultation.id
                            )
                              ? "text-blue-500 hover:font-bold"
                              : "text-gray-400 hover:text-black"
                          }`}
                          onClick={
                            () =>
                              router.push(
                                `/documents/order?consultId=${consultation.id}&compId=${company?.id}`
                              )

                            // router.push(
                            //   `/documents/order_test/${consultation.id}/${company?.id}`
                            // )
                          }
                        >
                          발주서
                        </span>
                        <span
                          className={`cursor-pointer ${
                            documents.some(
                              (doc) =>
                                doc.type === "requestQuote" &&
                                doc.consultation_id === consultation.id
                            )
                              ? "text-blue-500 hover:font-bold"
                              : "text-gray-400 hover:text-black"
                          }`}
                          onClick={
                            () =>
                              router.push(
                                `/documents/requestQuote?consultId=${consultation.id}&compId=${company?.id}`
                              )
                            // router.push(
                            //   `/documents/request_test/${consultation.id}/${company?.id}`
                            // )
                          }
                        >
                          의뢰서
                        </span>
                      </td>
                      <td
                        onClick={() => {
                          if (loginUser?.id === consultation.user_id)
                            handleEditConsultation(consultation);
                        }}
                        className={`px-4 py-2 border-b border-r-[1px] ${
                          loginUser?.id === consultation.user_id &&
                          "text-blue-500 cursor-pointer"
                        }`}
                      >
                        수정
                      </td>
                      <td
                        onClick={() => {
                          if (loginUser?.id === consultation.user_id)
                            handleDeleteConsultation(consultation);
                        }}
                        className={`px-4 py-2 border-b border-r-[1px] ${
                          loginUser?.id === consultation.user_id &&
                          "text-red-500 cursor-pointer"
                        }`}
                      >
                        삭제
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 페이지네이션 */}
          <div className="flex justify-center mt-4 space-x-2">
            <Button onClick={prevPage} disabled={currentPage === 1}>
              이전
            </Button>

            {/* 페이지 번호 */}
            {paginationNumbers().map((page, index) => (
              <Button
                key={index}
                onClick={() => handlePageClick(Number(page))}
                className={`text-sm ${page === currentPage ? "font-bold" : ""}`}
              >
                {page}
              </Button>
            ))}

            <Button onClick={nextPage} disabled={currentPage === totalPages}>
              다음
            </Button>
          </div>
        </>
      )}

      {openDeleteModal && consultationToDelete && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md w-1/3 max-w-lg">
            <h3 className="text-xl font-semibold mb-4">상담 내역 삭제</h3>
            <p>
              정말로 "{consultationToDelete.content}"의 상담 내역을
              삭제하시겠습니까?
            </p>

            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => setOpenDeleteModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm"
              >
                삭제
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
        <Alert severity="error">{snackbarMessage}</Alert>
      </Snackbar>
    </div>
  );
}

// 내일 No 재조정
// 상담자 유저getsession 자동으로 가져오기
// 견적서 발주서 의뢰서 페이지 구상
// 상담내역 최대 height 구상
//
