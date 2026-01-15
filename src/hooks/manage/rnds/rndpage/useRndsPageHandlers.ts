"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Consultation {
  id: string;
  date: string;
  content: string;
  start_date: string;
  end_date: string;
  participation: string;
  user_id: string;
  total_cost: string;
  gov_contribution: string;
  pri_contribution: string;
  org_id: string;
  rnd_id: string;
}

interface NewConsultation {
  date: string;
  content: string;
  start_date: string;
  end_date: string;
  participation: string;
  user_id: string;
  total_cost: string;
  gov_contribution: string;
  pri_contribution: string;
  org_id: string;
  rnd_id: string | string[];
}

interface RndDetail {
  id: string;
  rnd_orgs?: {
    id: string;
    name?: string;
  };
}

interface ConsultationRequestBody {
  date?: string;
  rnd_id?: string;
  org_id?: string;
  content?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  total_cost?: string;
  gov_contribution?: string;
  pri_contribution?: string;
  participation?: string;
  consultation_id?: string;
}

interface UseRndsPageHandlersProps {
  rndId: string;
  loginUserId: string;
  rndsDetail: RndDetail | null;
  addConsultation: (params: { method: string; body: ConsultationRequestBody }) => Promise<unknown>;
  updateRndsConsultations: (params: { method: string; body: ConsultationRequestBody }) => Promise<unknown>;
  refreshConsultations: () => Promise<void>;
  refreshRnds: () => Promise<void>;
  isAdding: boolean;
  isUpdating: boolean;
}

export function useRndsPageHandlers({
  rndId,
  loginUserId,
  rndsDetail,
  addConsultation,
  updateRndsConsultations,
  refreshConsultations,
  refreshRnds,
  isAdding,
  isUpdating,
}: UseRndsPageHandlersProps) {
  const [saving, setSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // 유효성 검사
  const validateConsultation = useCallback((consultation: NewConsultation): boolean => {
    const { participation, total_cost, gov_contribution, pri_contribution, start_date, end_date } = consultation;

    if (!participation) {
      setSnackbarMessage("참여유형을 선택해주세요.");
      return false;
    }
    if (!total_cost) {
      setSnackbarMessage("총사업비를 입력해주세요.");
      return false;
    }
    if (!gov_contribution) {
      setSnackbarMessage("정부출연금을 입력해주세요.");
      return false;
    }
    if (!pri_contribution) {
      setSnackbarMessage("민간부담금을 입력해주세요.");
      return false;
    }
    if (!start_date || !end_date) {
      setSnackbarMessage("날짜를 지정해주세요.");
      return false;
    }
    return true;
  }, []);

  // 상담 추가
  const handleAddConsultation = useCallback(async (
    newConsultation: NewConsultation,
    onSuccess: () => void
  ) => {
    if (isAdding || !validateConsultation(newConsultation)) return;

    try {
      setSaving(true);
      await addConsultation({
        method: "POST",
        body: {
          date: new Date().toISOString().split("T")[0],
          rnd_id: rndId,
          org_id: rndsDetail?.rnd_orgs?.id,
          content: newConsultation.content,
          user_id: newConsultation.user_id,
          start_date: newConsultation.start_date,
          end_date: newConsultation.end_date,
          total_cost: newConsultation.total_cost,
          gov_contribution: newConsultation.gov_contribution,
          pri_contribution: newConsultation.pri_contribution,
          participation: newConsultation.participation,
        },
      });

      setSnackbarMessage("내역 추가 완료");
      onSuccess();
      await refreshConsultations();
    } catch {
      setSnackbarMessage("내역 추가 중 오류 발생");
    } finally {
      setSaving(false);
    }
  }, [isAdding, validateConsultation, addConsultation, rndId, rndsDetail, refreshConsultations]);

  // 상담 수정
  const handleUpdateConsultation = useCallback(async (
    selectedConsultation: Consultation | null,
    newConsultation: NewConsultation,
    onSuccess: () => void
  ) => {
    if (isUpdating || !validateConsultation(newConsultation)) return;

    try {
      setSaving(true);
      await updateRndsConsultations({
        method: "PATCH",
        body: {
          consultation_id: selectedConsultation?.id,
          rnd_id: selectedConsultation?.rnd_id,
          content: newConsultation.content,
          user_id: newConsultation.user_id,
          end_date: newConsultation.end_date,
          gov_contribution: newConsultation.gov_contribution,
          participation: newConsultation.participation,
          pri_contribution: newConsultation.pri_contribution,
          start_date: newConsultation.start_date,
          total_cost: newConsultation.total_cost,
        },
      });

      setSnackbarMessage("상담 내역 수정 완료");
      onSuccess();
      await refreshConsultations();
    } catch {
      setSnackbarMessage("상담 내역 수정 중 오류 발생");
    } finally {
      setSaving(false);
    }
  }, [isUpdating, validateConsultation, updateRndsConsultations, refreshConsultations]);

  // 삭제 요청
  const handleConfirmDelete = useCallback(async (
    consultationToDelete: Consultation | null,
    deleteReason: string,
    onSuccess: () => void
  ) => {
    if (!consultationToDelete || deleteReason.length === 0) return;

    try {
      const { error } = await supabase.from("deletion_requests").insert([
        {
          related_id: consultationToDelete.id,
          status: "pending",
          type: "rnds_consultations",
          request_date: new Date(),
          user_id: loginUserId,
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
        onSuccess();
      }
    } catch {
      setSnackbarMessage("삭제 요청 생성 중 오류가 발생했습니다.");
    }
  }, [loginUserId]);

  // 비고 수정
  const handleUpdateNotes = useCallback(async (
    notes: string,
    onSuccess: () => void
  ) => {
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
        onSuccess();
      }
    } catch {
      setSnackbarMessage("비고 수정 중 오류 발생");
    }
  }, [rndsDetail, refreshRnds]);

  return {
    saving,
    snackbarMessage,
    setSnackbarMessage,
    handleAddConsultation,
    handleUpdateConsultation,
    handleConfirmDelete,
    handleUpdateNotes,
  };
}
