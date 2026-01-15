"use client";

import { useState, useEffect, useCallback } from "react";

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

const emptyCompany: Company = {
  id: "",
  company_code: "",
  name: "",
  business_number: "",
  address: "",
  industry: [],
  phone: "",
  fax: "",
  email: "",
  notes: "",
  contact: [],
  parcel: "",
};

export function useCustomersPageModals() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [currentCompany, setCurrentCompany] = useState<Company>(emptyCompany);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  // ESC 키 이벤트
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        setIsAddModalOpen(false);
        setIsDeleteModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openAddModal = useCallback(() => {
    setCurrentCompany(emptyCompany);
    setIsAddModalOpen(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setCurrentCompany(emptyCompany);
  }, []);

  const openEditModal = useCallback((company: Company) => {
    setCurrentCompany({
      ...company,
      industry: company.industry || [],
      contact: company.contact || [],
    });
    setIsModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsModalOpen(false);
    setCurrentCompany(emptyCompany);
  }, []);

  const openDeleteModal = useCallback((company: Company) => {
    setCompanyToDelete(company);
    setDeleteReason("");
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setCompanyToDelete(null);
    setDeleteReason("");
  }, []);

  return {
    isModalOpen,
    isAddModalOpen,
    isDeleteModalOpen,
    currentCompany,
    setCurrentCompany,
    companyToDelete,
    deleteReason,
    setDeleteReason,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    emptyCompany,
  };
}
