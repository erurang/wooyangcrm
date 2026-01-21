"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import SnackbarComponent from "@/components/Snackbar";
import ErrorState from "@/components/ui/ErrorState";
import {
  CompanyFormModal,
  CompanyDeleteModal,
  CompaniesTable,
  SearchFilters,
} from "@/components/manage/customers";

import { useCompaniesList } from "@/hooks/manage/customers/useCompaniesList";
import { useContactsBySearch } from "@/hooks/manage/customers/useContactsBySearch";
import { useAddCompany } from "@/hooks/manage/customers/useAddCompany";
import { useAddContacts } from "@/hooks/manage/customers/useAddContacts";
import { useUpdateCompany } from "@/hooks/manage/customers/useUpdateCompany";
import { useUpdateContacts } from "@/hooks/manage/customers/useUpdateContacts";
import { useDebounce } from "@/hooks/useDebounce";
import { useLoginUser } from "@/context/login";
import {
  useCustomersPageModals,
  useCustomersPageHandlers,
} from "@/hooks/manage/customers/customerspage";

export default function CompanySearchPage() {
  const user = useLoginUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 쿼리 파라미터에서 상태 초기화
  const initialPage = searchParams.get("page")
    ? Number.parseInt(searchParams.get("page") as string)
    : 1;
  const initialSearchTerm = searchParams.get("search") || "";
  const initialAddressTerm = searchParams.get("address") || "";
  const initialContactTerm = searchParams.get("contact") || "";
  const initialCompaniesPerPage = searchParams.get("perPage")
    ? Number.parseInt(searchParams.get("perPage") as string)
    : 10;

  // 검색 상태
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
  const [addressTerm, setAddressTerm] = useState<string>(initialAddressTerm);
  const [contactTerm, setContactTerm] = useState<string>(initialContactTerm);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [companiesPerPage, setCompaniesPerPage] = useState(initialCompaniesPerPage);

  // Debounced search terms
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedAddressTerm = useDebounce(addressTerm, 300);
  const debouncedContactTerm = useDebounce(contactTerm, 300);

  // SWR hooks
  const { companyIds } = useContactsBySearch(debouncedContactTerm);
  const { companies, total, isLoading, isError, refreshCompanies } = useCompaniesList(
    currentPage,
    companiesPerPage,
    debouncedSearchTerm,
    debouncedAddressTerm,
    companyIds
  );
  const { addCompany } = useAddCompany();
  const { addContacts } = useAddContacts();
  const { updateCompany } = useUpdateCompany();
  const { updateContacts } = useUpdateContacts();

  // 커스텀 훅 - 모달 관리
  const {
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
  } = useCustomersPageModals();

  // 커스텀 훅 - 핸들러
  const {
    saving,
    snackbarMessage,
    setSnackbarMessage,
    handleAddCompany,
    handleUpdateCompany,
    handleConfirmDelete,
  } = useCustomersPageHandlers({
    userId: user?.id || "",
    addCompany,
    addContacts,
    updateCompany,
    updateContacts,
    refreshCompanies,
  });

  // URL 업데이트 함수
  const updateUrl = () => {
    const params = new URLSearchParams();
    if (currentPage !== 1) params.set("page", currentPage.toString());
    if (searchTerm) params.set("search", searchTerm);
    if (addressTerm) params.set("address", addressTerm);
    if (contactTerm) params.set("contact", contactTerm);
    if (companiesPerPage !== 10) params.set("perPage", companiesPerPage.toString());
    router.replace(`/manage/customers?${params.toString()}`);
  };

  // 상태가 변경될 때마다 URL 업데이트
  useEffect(() => {
    updateUrl();
  }, [currentPage, searchTerm, addressTerm, contactTerm, companiesPerPage]);

  // Update total pages when data changes
  useEffect(() => {
    if (!isLoading && !isError && companies) {
      setTotalPages(Math.ceil(total / companiesPerPage));
    }
  }, [companies, total, isLoading, isError, companiesPerPage]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setCurrentPage(1);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setAddressTerm("");
    setContactTerm("");
    setCurrentPage(1);
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <ErrorState
          type="server"
          title="거래처 목록을 불러올 수 없습니다"
          message="서버와의 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
          onRetry={refreshCompanies}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SearchFilters
        searchTerm={searchTerm}
        addressTerm={addressTerm}
        contactTerm={contactTerm}
        total={total}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
        onAddressChange={(value) => {
          setAddressTerm(value);
          setCurrentPage(1);
        }}
        onContactChange={(value) => {
          setContactTerm(value);
          setCurrentPage(1);
        }}
        onResetFilters={resetFilters}
        onAddCompany={openAddModal}
        onKeyPress={handleKeyPress}
      />

      <CompaniesTable
        companies={companies || []}
        total={total}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        companiesPerPage={companiesPerPage}
        onPageChange={setCurrentPage}
        onPerPageChange={setCompaniesPerPage}
        onEdit={(company) => openEditModal(company)}
        onDelete={openDeleteModal}
        onAdd={openAddModal}
        hasSearchQuery={!!(searchTerm || addressTerm || contactTerm)}
      />

      <CompanyFormModal
        mode="edit"
        isOpen={isModalOpen}
        company={currentCompany}
        setCompany={setCurrentCompany}
        onClose={closeEditModal}
        onSubmit={() => handleUpdateCompany(currentCompany, closeEditModal)}
        saving={saving}
      />

      <CompanyFormModal
        mode="add"
        isOpen={isAddModalOpen}
        company={currentCompany}
        setCompany={setCurrentCompany}
        onClose={closeAddModal}
        onSubmit={() => handleAddCompany(currentCompany, closeAddModal)}
        saving={saving}
      />

      <CompanyDeleteModal
        isOpen={isDeleteModalOpen && companyToDelete !== null}
        companyName={companyToDelete?.name || ""}
        deleteReason={deleteReason}
        setDeleteReason={setDeleteReason}
        onClose={closeDeleteModal}
        onConfirm={() => handleConfirmDelete(companyToDelete, deleteReason, () => {
          closeDeleteModal();
          setCurrentPage(1);
        })}
      />

      <SnackbarComponent
        onClose={() => setSnackbarMessage("")}
        message={snackbarMessage}
      />
    </div>
  );
}
