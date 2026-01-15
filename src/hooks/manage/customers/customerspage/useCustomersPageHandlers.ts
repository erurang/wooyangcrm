"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Contact {
  contact_name: string;
  mobile: string;
  department: string;
  level: string;
  email: string;
  resign: boolean;
}

interface Company {
  id: string;
  company_code: string;
  name: string;
  business_number: string;
  address: string;
  industry: string[];
  phone: string;
  fax: string;
  email: string;
  notes: string;
  contact: Contact[];
  parcel: string;
}

interface UseCustomersPageHandlersProps {
  userId: string;
  addCompany: (company: Company) => Promise<{ id: string }>;
  addContacts: (contacts: Contact[], companyId: string) => Promise<void>;
  updateCompany: (company: Company) => Promise<void>;
  updateContacts: (contacts: Contact[], companyId: string) => Promise<void>;
  refreshCompanies: (key?: unknown, opts?: { revalidate: boolean }) => Promise<void>;
}

export function useCustomersPageHandlers({
  userId,
  addCompany,
  addContacts,
  updateCompany,
  updateContacts,
  refreshCompanies,
}: UseCustomersPageHandlersProps) {
  const [saving, setSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // 거래처 추가
  const handleAddCompany = useCallback(async (
    company: Company,
    onSuccess: () => void
  ) => {
    if (!company.name || !company.contact.length) {
      setSnackbarMessage("필수 입력값을 모두 채워주세요.");
      return;
    }

    setSaving(true);

    try {
      const data = await addCompany(company);
      await addContacts(company.contact, data.id);
      await refreshCompanies();

      setSnackbarMessage("거래처 추가 완료");
      onSuccess();
    } catch (error) {
      console.error("Error adding company:", error);
      setSnackbarMessage("거래처 추가 실패");
    } finally {
      setSaving(false);
    }
  }, [addCompany, addContacts, refreshCompanies]);

  // 거래처 수정
  const handleUpdateCompany = useCallback(async (
    company: Company,
    onSuccess: () => void
  ) => {
    if (!company.name || !company.contact.length) {
      setSnackbarMessage("필수 입력값을 모두 채워주세요.");
      return;
    }

    setSaving(true);

    try {
      await updateCompany(company);
      await updateContacts(company.contact, company.id);
      setSnackbarMessage("거래처 수정 완료");
      await refreshCompanies(undefined, { revalidate: true });
      onSuccess();
    } catch (error) {
      console.error("Error updating company:", error);
      setSnackbarMessage("거래처 수정 실패");
    } finally {
      setSaving(false);
    }
  }, [updateCompany, updateContacts, refreshCompanies]);

  // 삭제 요청
  const handleConfirmDelete = useCallback(async (
    companyToDelete: Company | null,
    deleteReason: string,
    onSuccess: () => void
  ) => {
    if (deleteReason.length === 0 || !companyToDelete) return;

    try {
      const { error } = await supabase.from("deletion_requests").insert([
        {
          type: "companies",
          related_id: companyToDelete.id,
          status: "pending",
          request_date: new Date(),
          user_id: userId,
          delete_reason: deleteReason,
          content: {
            companies: `거래처삭제 : ${companyToDelete.name}`,
          },
        },
      ]);

      if (error) throw error;

      setSnackbarMessage("삭제 요청 완료");
      onSuccess();
    } catch (error) {
      console.error("Error deleting company:", error);
      setSnackbarMessage("삭제 요청 실패");
    }
  }, [userId]);

  return {
    saving,
    snackbarMessage,
    setSnackbarMessage,
    handleAddCompany,
    handleUpdateCompany,
    handleConfirmDelete,
  };
}
