"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton, CircularProgress } from "@mui/material";
import { useLoginUser } from "@/context/login";
import SnackbarComponent from "@/components/Snackbar";

import { useFavorites } from "@/hooks/favorites/useFavorites";
import { useUsersList } from "@/hooks/useUserList";
import { useUpdateConsultation } from "@/hooks/consultations/useUpdateConsultation";
import FileUpload from "@/components/consultations/FileUpload";
import { useRnDsDetails } from "@/hooks/manage/(rnds)/rnds/useRnDsDetail";
import { useRndConsultationsList } from "@/hooks/manage/(rnds)/consultations/useRndConsultationsList";
import { useDebounce } from "@/hooks/useDebounce";
import { useAddRndConsultation } from "@/hooks/manage/(rnds)/consultations/useAddRndConsultation";
import { useUpdateRnDsConsultations } from "@/hooks/manage/(rnds)/consultations/useUpdateRnDsConsultations";

interface Consultation {
  id: string;
  date: string;
  content: string;

  start_date: string;
  end_date: string;
  participation: "참여" | "주관기관" | "공동연구기관";
  user_id: string;

  total_cost: string;
  gov_contribution: string;
  pri_contribution: string;
  org_id: string;
  rnd_id: string;
}

export default function RnDsPage() {
  const rnd_participation = ["주관기관", "공동연구기관", "참여"];

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 🔹 디바운스 적용

  const { id } = useParams();

  const router = useRouter();
  const loginUser = useLoginUser();
  const searchParams = useSearchParams();

  const [saving, setSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  const [deleteReason, setDeleteReason] = useState("");
  const [newConsultation, setNewConsultation] = useState({
    date: new Date().toISOString().split("T")[0],
    content: "",
    start_date: "",
    end_date: "",
    participation: "",
    user_id: loginUser?.id || "",
    total_cost: "",
    gov_contribution: "",
    pri_contribution: "",
    org_id: "",
    rnd_id: id,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedConsultation, setSelectedConsultation] =
    useState<Consultation | null>(null);

  const [openEditNotesModal, setOpenEditNotesModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [consultationToDelete, setConsultationToDelete] =
    useState<Consultation | null>(null);

  /// swr ///////
  const { users } = useUsersList();

  const { favorites, removeFavorite, refetchFavorites, addFavorite } =
    useFavorites(loginUser?.id);

  //
  const { consultations, totalPages, refreshConsultations } =
    useRndConsultationsList(id as string, currentPage, debouncedSearchTerm);
  const { addConsultation, isAdding } = useAddRndConsultation();
  //

  const { updateRndsConsultations, isUpdating } = useUpdateRnDsConsultations();

  //// swr ////////
  const { rndsDetail, rnDsDetailLoading, refreshRnds } = useRnDsDetails(
    id as string
  );

  /////////////////
  const [notes, setNotes] = useState(rndsDetail?.notes || "");
  const handleUpdateNotes = async () => {
    if (!rndsDetail?.id) return;

    try {
      const { error } = await supabase
        .from("rnds")
        .update({ notes })
        .eq("id", rndsDetail.id);

      await refreshRnds();

      if (error) {
        setSnackbarMessage("비고 수정 실패");
      } else {
        setSnackbarMessage("비고 수정 완료");
        setOpenEditNotesModal(false);
      }
    } catch (error) {
      setSnackbarMessage("비고 수정 중 오류 발생");
    }
  };

  /////////////////////

  const handleAddConsultation = async () => {
    if (isAdding) return;

    const {
      content,
      user_id,
      end_date,
      gov_contribution,
      participation,
      pri_contribution,
      start_date,
      total_cost,
    } = newConsultation;

    if (!participation) {
      setSnackbarMessage("참여유형을 선택해주세요.");
      return;
    }

    if (!total_cost) {
      setSnackbarMessage("총사업비를 입력해주세요.");
      return;
    }

    if (!gov_contribution) {
      setSnackbarMessage("정부출연금을 입력해주세요.");
      return;
    }

    if (!pri_contribution) {
      setSnackbarMessage("민간부담금을 입력해주세요.");
      return;
    }

    if (!start_date || !end_date) {
      setSnackbarMessage("날짜를 지정해주세요.");
      return;
    }

    try {
      setSaving(true);

      await addConsultation({
        method: "POST",
        body: {
          date: new Date().toISOString().split("T")[0],
          rnd_id: id as string,
          org_id: rndsDetail.rnd_orgs.id,
          content,
          user_id,
          start_date,
          end_date,
          total_cost,
          gov_contribution,
          pri_contribution,
          participation,
        },
      });

      setSnackbarMessage("내역 추가 완료");
      setOpenAddModal(false);
      await refreshConsultations();
    } catch (error) {
      setSnackbarMessage("내역 추가 중 오류 발생");
    } finally {
      setSaving(false);
    }
  };

  const handleEditConsultation = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setNewConsultation((prev): any => ({
      ...prev,
      date: consultation.date,
      user_id: consultation.user_id,
      content: consultation.content,
      end_date: consultation.end_date,
      start_date: consultation.start_date,
      gov_contribution: consultation.gov_contribution,
      participation: consultation.participation,
      pri_contribution: consultation.pri_contribution,
      total_cost: consultation.total_cost,
    }));
    setOpenEditModal(true);
  };

  const handleUpdateConsultation = async () => {
    if (isUpdating) return;

    const {
      content,
      user_id,
      end_date,
      gov_contribution,
      participation,
      pri_contribution,
      start_date,
      total_cost,
    } = newConsultation;

    if (!participation) {
      setSnackbarMessage("참여유형을 선택해주세요.");
      return;
    }

    if (!total_cost) {
      setSnackbarMessage("총사업비를 입력해주세요.");
      return;
    }

    if (!gov_contribution) {
      setSnackbarMessage("정부출연금을 입력해주세요.");
      return;
    }

    if (!pri_contribution) {
      setSnackbarMessage("민간부담금을 입력해주세요.");
      return;
    }

    if (!start_date || !end_date) {
      setSnackbarMessage("날짜를 지정해주세요.");
      return;
    }

    try {
      setSaving(true);

      // ✅ SWR Mutation 호출
      await updateRndsConsultations({
        method: "PATCH",
        body: {
          consultation_id: selectedConsultation?.id,
          rnd_id: selectedConsultation?.rnd_id,
          content,
          user_id,
          end_date,
          gov_contribution,
          participation,
          pri_contribution,
          start_date,
          total_cost,
        },
      });

      setSnackbarMessage("상담 내역 수정 완료");
      setOpenEditModal(false);
      await refreshConsultations();
    } catch (error) {
      setSnackbarMessage("상담 내역 수정 중 오류 발생");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConsultation = async (consultation: Consultation) => {
    setConsultationToDelete(consultation);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!consultationToDelete) return;
    if (deleteReason.length === 0) return;

    try {
      const { error } = await supabase.from("deletion_requests").insert([
        {
          related_id: consultationToDelete.id,
          status: "pending",
          type: "rnds_consultations",
          request_date: new Date(),
          user_id: loginUser?.id || "",
          delete_reason: deleteReason,
          content: {
            consultations: `RnD삭제 : ${consultationToDelete?.content}`,
          },
        },
      ]);

      if (error) {
        setSnackbarMessage("삭제 요청을 생성하는 데 실패했습니다.");
      } else {
        setSnackbarMessage("삭제 요청이 생성되었습니다.");

        setOpenDeleteModal(false);
      }
    } catch (error) {
      setSnackbarMessage("삭제 요청 생성 중 오류가 발생했습니다.");
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
    router.push(`/consultations/${id}?page=${page}`, { scroll: false });
  };

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

  const formatContentWithLineBreaks = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  const handleAddFavorite = async () => {
    try {
      // await addFavorite(loginUser?.id, id, companyDetail?.name);
      await refetchFavorites();

      setSnackbarMessage("즐겨찾기에 추가되었습니다.");
    } catch (error) {
      console.error("Error fetching performance data:", error);
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    try {
      await removeFavorite(id);
      await refetchFavorites();
      setSnackbarMessage("즐겨찾기가 삭제되었습니다.");
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  useEffect(() => {
    // 🔹 URL에서 page 값을 읽어서 상태 업데이트
    const pageParam = searchParams.get("page");
    if (pageParam) {
      setCurrentPage(Number(pageParam));
    }
  }, [searchParams]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenAddModal(false);
        setOpenEditModal(false);
        setOpenDeleteModal(false);
        setOpenEditNotesModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const formatNumber = (value: string) => {
    const cleanedValue = value.replace(/[^0-9]/g, "");
    return cleanedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="text-sm text-[#37352F]">
      <>
        {/* 🚀 거래처 기본 정보 */}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4">
          <div className="bg-[#FBFBFB] rounded-md border px-4 pt-3  h-48 flex flex-col justify-between">
            {rnDsDetailLoading ? (
              <>
                <Skeleton variant="text" width="100%" height="100%" />
              </>
            ) : (
              <div>
                <h2 className="font-semibold text-md mb-2">
                  {rndsDetail?.name}
                </h2>
                <ul className="space-y-1 text-gray-700 text-sm pl-1">
                  <li className="flex items-center">
                    <span className="font-medium w-20">지원기관</span>
                    <span className="flex-1 truncate">
                      {rndsDetail.rnd_orgs?.name}
                    </span>
                  </li>

                  <li className="flex items-center">
                    <span className="font-medium w-20">총 사업비</span>
                    <span className="flex-1 truncate">
                      {formatNumber(rndsDetail.total_cost)}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium w-20">정부 출연금</span>
                    <span className="flex-1">
                      {formatNumber(rndsDetail.gov_contribution)}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium w-20">민간 부담금</span>
                    <span className="flex-1">
                      {formatNumber(rndsDetail.pri_contribution)}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium w-20">총 사업기간</span>
                    <span className="flex-1 truncate">
                      {rndsDetail.start_date} ~ {rndsDetail.end_date}
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="bg-[#FBFBFB] rounded-md border pl-4 pt-3 ">
            {rnDsDetailLoading ? (
              <Skeleton variant="rectangular" width="100%" height="100%" />
            ) : (
              <>
                <h2 className="font-semibold text-md mb-1">비고</h2>
                <div className="text-sm min-h-[80px] max-h-36 overflow-y-auto px-1">
                  <span>
                    {rndsDetail?.notes ||
                      "비고 추가/수정을 사용하여 유의사항을 작성해주세요."}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 🚀 추가 버튼 */}

        <div className="flex my-4 gap-4">
          {/* {favorites.find((fav: any) => fav.name === companyDetail?.name) ? (
            <div
              className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
              onClick={() => {
                if (companyDetail?.id) {
                  handleRemoveFavorite(companyDetail.id);
                }
              }}
            >
              <span className="mr-2">-</span>
              <span>즐겨찾기 삭제</span>
            </div>
          ) : (
            <div
              className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
              onClick={() => handleAddFavorite()}
            >
              <span className="mr-2">+</span>
              <span>즐겨찾기 추가</span>
            </div>
          )} */}
          <div
            className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
            onClick={() => setOpenAddModal(true)}
          >
            <span className="mr-2">+</span>
            <span>내역 추가</span>
          </div>
          <div
            className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
            onClick={() => setOpenEditNotesModal(true)}
          >
            <span className="mr-2">+</span>
            <span>비고 추가/수정</span>
          </div>
          <div className="flex items-center border-b-2 border-gray-400 w-1/3 max-w-sm py-1 focus-within:border-black">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 50 50"
              width="18px"
              height="18px"
              className="text-gray-500"
            >
              <path d="M 21 3 C 11.601563 3 4 10.601563 4 20 C 4 29.398438 11.601563 37 21 37 C 24.355469 37 27.460938 36.015625 30.09375 34.34375 L 42.375 46.625 L 46.625 42.375 L 34.5 30.28125 C 36.679688 27.421875 38 23.878906 38 20 C 38 10.601563 30.398438 3 21 3 Z M 21 7 C 28.199219 7 34 12.800781 34 20 C 34 27.199219 28.199219 33 21 33 C 13.800781 33 8 27.199219 8 20 C 8 12.800781 7 21 7 Z" />
            </svg>
            <input
              type="text"
              placeholder="내역 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-2 py-1 w-full focus:outline-none focus:border-none font-semibold text-gray-700"
            />
          </div>
        </div>

        {/* 상담 내역 추가 모달 */}
        {openAddModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-md w-1/2 ">
              <h3 className="text-xl font-semibold mb-4">R&D 내역 추가</h3>

              {/* 상담일 및 후속 날짜 (flex로 배치) */}
              <div className="mb-4 grid space-x-4 grid-cols-4">
                <div className="">
                  <label className="block mb-2 text-sm font-medium">
                    작성일자
                  </label>
                  <input
                    type="date"
                    value={newConsultation.date}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="">
                  <label className="block mb-2 text-sm font-medium">
                    수행 시작일자
                  </label>
                  <input
                    type="date"
                    value={newConsultation.start_date}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    onChange={(e) =>
                      setNewConsultation({
                        ...newConsultation,
                        start_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="">
                  <label className="block mb-2 text-sm font-medium">
                    수행 종료일자
                  </label>
                  <input
                    type="date"
                    value={newConsultation.end_date}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    onChange={(e) =>
                      setNewConsultation({
                        ...newConsultation,
                        end_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    작성자
                  </label>
                  <select
                    value={newConsultation.user_id}
                    disabled
                    onChange={(e) =>
                      setNewConsultation({
                        ...newConsultation,
                        user_id: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    {/* 다른 유저들 */}
                    {users.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div className="mb-4 grid space-x-4 grid-cols-4">
                  <div>
                    <label className="block mb-1">총 사업비</label>
                    <motion.input
                      whileFocus={{
                        scale: 1.05, // 입력 시 약간 확대
                        boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                      }}
                      type="text"
                      value={formatNumber(newConsultation?.total_cost || "")}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(
                          /[^0-9]/g,
                          ""
                        );
                        setNewConsultation({
                          ...newConsultation,
                          total_cost: numericValue,
                        });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1">정부 출연금</label>
                    <motion.input
                      whileFocus={{
                        scale: 1.05, // 입력 시 약간 확대
                        boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                      }}
                      placeholder=""
                      type="text"
                      value={formatNumber(
                        newConsultation?.gov_contribution || ""
                      )}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(
                          /[^0-9]/g,
                          ""
                        );
                        setNewConsultation({
                          ...newConsultation,
                          gov_contribution: numericValue,
                        });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1">민간 부담금</label>
                    <motion.input
                      whileFocus={{
                        scale: 1.05, // 입력 시 약간 확대
                        boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                      }}
                      placeholder=""
                      type="text"
                      value={formatNumber(
                        newConsultation?.pri_contribution || ""
                      )}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(
                          /[^0-9]/g,
                          ""
                        );
                        setNewConsultation({
                          ...newConsultation,
                          pri_contribution: numericValue,
                        });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1">참여 유형</label>
                    <select
                      value={newConsultation?.participation || ""}
                      onChange={(e) =>
                        setNewConsultation({
                          ...newConsultation,
                          participation: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">선택하세요.</option>
                      {rnd_participation?.map((rnd: any, index: any) => (
                        <option key={index} value={rnd}>
                          {rnd}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 상담 내용 */}
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">내용</label>
                <textarea
                  placeholder=""
                  value={newConsultation.content}
                  onChange={(e) =>
                    setNewConsultation({
                      ...newConsultation,
                      content: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={16}
                />
              </div>

              {/* 버튼 */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setOpenAddModal(false);
                    setNewConsultation((prev): any => ({
                      ...prev,
                      content: "",
                      start_date: "",
                      end_date: "",
                      participation: "",
                      user_id: loginUser ? loginUser.id : "",
                      total_cost: "",
                      gov_contribution: "",
                      pri_contribution: "",
                    }));
                  }}
                  className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
                    saving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={saving}
                >
                  취소
                </button>

                <button
                  onClick={handleAddConsultation}
                  className={`bg-blue-500 text-white px-4 py-2 rounded-md text-xs md:text-sm flex items-center ${
                    saving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={saving}
                >
                  저장
                  {saving && <CircularProgress size={18} className="ml-2" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 상담 내역 수정 모달 */}
        {openEditModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-md w-1/2">
              <h3 className="text-xl font-semibold mb-4">R&D 내역 수정</h3>

              <div className="mb-4 grid space-x-4 grid-cols-4">
                <div className="">
                  <label className="block mb-2 text-sm font-medium">
                    작성일자
                  </label>
                  <input
                    type="date"
                    value={newConsultation.date}
                    disabled
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="">
                  <label className="block mb-2 text-sm font-medium">
                    수행 시작일자
                  </label>
                  <input
                    type="date"
                    value={newConsultation.start_date}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    onChange={(e) =>
                      setNewConsultation({
                        ...newConsultation,
                        start_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="">
                  <label className="block mb-2 text-sm font-medium">
                    수행 종료일자
                  </label>
                  <input
                    type="date"
                    value={newConsultation.end_date}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    onChange={(e) =>
                      setNewConsultation({
                        ...newConsultation,
                        end_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    작성자
                  </label>
                  <select
                    value={newConsultation.user_id}
                    disabled
                    onChange={(e) =>
                      setNewConsultation({
                        ...newConsultation,
                        user_id: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    {users.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div className="mb-4 grid space-x-4 grid-cols-4">
                  <div>
                    <label className="block mb-1">총 사업비</label>
                    <motion.input
                      whileFocus={{
                        scale: 1.05, // 입력 시 약간 확대
                        boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                      }}
                      type="text"
                      value={formatNumber(newConsultation?.total_cost || "")}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(
                          /[^0-9]/g,
                          ""
                        );
                        setNewConsultation({
                          ...newConsultation,
                          total_cost: numericValue,
                        });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1">정부 출연금</label>
                    <motion.input
                      whileFocus={{
                        scale: 1.05, // 입력 시 약간 확대
                        boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                      }}
                      placeholder=""
                      type="text"
                      value={formatNumber(
                        newConsultation?.gov_contribution || ""
                      )}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(
                          /[^0-9]/g,
                          ""
                        );
                        setNewConsultation({
                          ...newConsultation,
                          gov_contribution: numericValue,
                        });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1">민간 부담금</label>
                    <motion.input
                      whileFocus={{
                        scale: 1.05, // 입력 시 약간 확대
                        boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                      }}
                      placeholder=""
                      type="text"
                      value={formatNumber(
                        newConsultation?.pri_contribution || ""
                      )}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(
                          /[^0-9]/g,
                          ""
                        );
                        setNewConsultation({
                          ...newConsultation,
                          pri_contribution: numericValue,
                        });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1">참여 유형</label>
                    <select
                      value={newConsultation?.participation || ""}
                      onChange={(e) =>
                        setNewConsultation({
                          ...newConsultation,
                          participation: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">선택하세요.</option>
                      {rnd_participation?.map((rnd: any, index: any) => (
                        <option key={index} value={rnd}>
                          {rnd}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">내용</label>
                <textarea
                  placeholder=""
                  value={newConsultation.content}
                  onChange={(e) =>
                    setNewConsultation({
                      ...newConsultation,
                      content: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={16}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setOpenAddModal(false);
                    setNewConsultation((prev): any => ({
                      ...prev,
                      content: "",
                      start_date: "",
                      end_date: "",
                      participation: "",
                      user_id: loginUser ? loginUser.id : "",
                      total_cost: "",
                      gov_contribution: "",
                      pri_contribution: "",
                    }));
                  }}
                  className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
                    saving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={saving}
                >
                  취소
                </button>

                <button
                  onClick={handleUpdateConsultation}
                  className={`bg-blue-500 text-white px-4 py-2 rounded-md text-xs md:text-sm flex items-center ${
                    saving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={saving}
                >
                  저장
                  {saving && <CircularProgress size={18} className="ml-2" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 상담 내역 테이블 */}
        <div className="bg-[#FBFBFB] rounded-md border">
          {consultations.length > 0 && (
            <table className="min-w-full table-auto border-collapse text-center">
              <thead>
                <tr className="bg-gray-100 text-left">
                  {/* <th className="px-4 py-2 border-b border-r-[1px] text-center">
                    No.
                  </th> */}
                  <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                    작성일자
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                    수행기간
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                    총 사업비
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                    정부 출연금
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                    민간 부담금
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center w-2/12">
                    내용
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                    참여유형
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                    담당자
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center w-2/12">
                    문서
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                    변경
                  </th>
                </tr>
              </thead>
              <tbody>
                {consultations.map((consultation: any, index: any) => (
                  <tr
                    key={consultation.id}
                    className="hover:bg-gray-100 border-b"
                  >
                    <td className="px-4 py-2 border-r-[1px]">
                      {consultation.date}
                    </td>
                    <td className="px-4 py-2 border-r-[1px]">
                      {consultation.start_date} ~ {consultation.end_date}
                    </td>
                    <td className="px-4 py-2 border-x-[1px]">
                      {formatNumber(consultation.total_cost)} 원
                    </td>
                    <td className="px-2 py-2 border-r-[1px]">
                      {formatNumber(consultation.gov_contribution)} 원
                    </td>
                    <td className="px-2 py-2 border-r-[1px]">
                      {formatNumber(consultation.pri_contribution)} 원
                    </td>
                    <td
                      className="px-4 py-2 w-full text-start"
                      style={{
                        minHeight: "140px",
                        maxHeight: "140px",
                        overflowY: "auto",
                        display: "block",
                      }}
                    >
                      {formatContentWithLineBreaks(consultation.content)}
                    </td>

                    <td className="px-4 py-2 border-x-[1px]">
                      {consultation.participation}
                    </td>
                    <td className="px-4 py-2 border-r-[1px]">
                      {
                        users.find(
                          (user: any) => user.id === consultation.user_id
                        )?.name
                      }{" "}
                      {
                        users.find(
                          (user: any) => user.id === consultation.user_id
                        )?.level
                      }
                    </td>
                    <td className="px-4 py-2 border-x-[1px]">
                      <FileUpload
                        consultationId={consultation.id}
                        userId={loginUser?.id}
                      />
                    </td>
                    <td className="py-2 border-x-[1px]">
                      <span
                        className={`px-4 py-2 border-r-[1px] ${
                          loginUser?.id === consultation.user_id &&
                          "text-blue-500 cursor-pointer"
                        }`}
                        onClick={() => {
                          if (loginUser?.id === consultation.user_id)
                            handleEditConsultation(consultation);
                        }}
                      >
                        수정
                      </span>
                      <span
                        className={`px-4 py-2 ${
                          loginUser?.id === consultation.user_id &&
                          "text-red-500 cursor-pointer"
                        }`}
                        // onClick={() => {
                        //   handleDeleteConsultation(consultation);
                        // }}
                        onClick={() => {
                          if (loginUser?.id === consultation.user_id)
                            handleDeleteConsultation(consultation);
                        }}
                      >
                        삭제
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 페이지네이션 */}
        <div className="flex justify-center mt-4 overflow-x-auto space-x-1 md:space-x-2">
          <div className="flex justify-center mt-4 space-x-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
            >
              이전
            </button>

            {paginationNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => handlePageClick(Number(page))}
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
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
            >
              다음
            </button>
          </div>
        </div>
      </>

      {openDeleteModal && consultationToDelete && (
        <motion.div
          initial={{ opacity: 0, scale: 1 }} // 시작 애니메이션
          animate={{ opacity: 1, scale: 1 }} // 나타나는 애니메이션
          exit={{ opacity: 0, scale: 1 }} // 사라질 때 애니메이션
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50"
        >
          <div className="bg-white p-6 rounded-md w-1/3">
            <h3 className="text-xl font-semibold mb-4">삭제 요청</h3>
            <textarea
              className="w-full border rounded-md p-4 h-48"
              placeholder="삭제 사유를 입력해주세요."
              onChange={(e) => setDeleteReason(e.target.value)}
            />

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setOpenDeleteModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md"
              >
                삭제
              </button>
            </div>
          </div>
        </motion.div>
      )}
      {openEditNotesModal && (
        <>
          <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-md w-1/3">
              <h2 className="text-xl font-bold mb-4">비고 추가/수정</h2>
              <textarea
                // placeholder="해당 과제의 유의사항 또는 담당자별 유의사항을 작성해주세요."
                className="w-full min-h-80 p-2 border border-gray-300 rounded-md"
                defaultValue={rndsDetail.notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex justify-end mt-4">
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2"
                  onClick={() => setOpenEditNotesModal(false)}
                >
                  취소
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                  onClick={handleUpdateNotes}
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}
