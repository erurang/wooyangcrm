"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Globe, X } from "lucide-react";

import SnackbarComponent from "@/components/Snackbar";
import {
  OverseasCompanyTable,
  OverseasCompanyFormModal,
} from "@/components/overseas";
import { useOverseasCompanies, useAddOverseasCompany } from "@/hooks/overseas";
import { useDebounce } from "@/hooks/useDebounce";
import { OverseasCompany, OverseasContact } from "@/types/overseas";

interface OverseasCompanyFormData {
  id?: string;
  name: string;
  address: string;
  email: string;
  website: string;
  notes: string;
  contacts: OverseasContact[];
}

const emptyCompany: OverseasCompanyFormData = {
  name: "",
  address: "",
  email: "",
  website: "",
  notes: "",
  contacts: [],
};

export default function OverseasCompaniesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터
  const initialPage = searchParams.get("page")
    ? parseInt(searchParams.get("page") as string)
    : 1;
  const initialSearchTerm = searchParams.get("search") || "";
  const initialPerPage = searchParams.get("perPage")
    ? parseInt(searchParams.get("perPage") as string)
    : 20;

  // 상태
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [companiesPerPage, setCompaniesPerPage] = useState(initialPerPage);
  const [totalPages, setTotalPages] = useState(1);

  // 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<OverseasCompanyFormData>(emptyCompany);
  const [saving, setSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Hooks
  const { companies, total, isLoading, mutate } = useOverseasCompanies({
    page: currentPage,
    limit: companiesPerPage,
    name: debouncedSearchTerm,
  });
  const { addCompany } = useAddOverseasCompany();

  // URL 업데이트
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage !== 1) params.set("page", currentPage.toString());
    if (searchTerm) params.set("search", searchTerm);
    if (companiesPerPage !== 20) params.set("perPage", companiesPerPage.toString());
    router.replace(`/overseas?${params.toString()}`);
  }, [currentPage, searchTerm, companiesPerPage, router]);

  // 페이지 수 업데이트
  useEffect(() => {
    if (!isLoading) {
      setTotalPages(Math.ceil(total / companiesPerPage));
    }
  }, [total, isLoading, companiesPerPage]);

  // 거래처 추가
  const handleAddCompany = async () => {
    setSaving(true);
    try {
      await addCompany(currentCompany);
      setSnackbarMessage("해외 거래처가 추가되었습니다.");
      setIsAddModalOpen(false);
      setCurrentCompany(emptyCompany);
      mutate();
    } catch (error) {
      setSnackbarMessage("거래처 추가에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 거래처 수정
  const handleEditCompany = async () => {
    setSaving(true);
    try {
      // TODO: 수정 API 호출
      setSnackbarMessage("해외 거래처가 수정되었습니다.");
      setIsEditModalOpen(false);
      setCurrentCompany(emptyCompany);
      mutate();
    } catch (error) {
      setSnackbarMessage("거래처 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 모달 열기
  const openAddModal = () => {
    setCurrentCompany(emptyCompany);
    setIsAddModalOpen(true);
  };

  const openEditModal = (company: OverseasCompany) => {
    setCurrentCompany({
      id: company.id,
      name: company.name,
      address: company.address || "",
      email: company.email || "",
      website: company.website || "",
      notes: company.notes || "",
      contacts: company.contacts || [],
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (company: OverseasCompany) => {
    // TODO: 삭제 모달 구현
    console.log("Delete:", company);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-sm text-gray-800">
      {/* 검색 필터 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Globe size={20} className="text-blue-500" />
              <span className="font-medium">해외거래처 검색</span>
            </div>
            <div className="relative min-w-[300px]">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="거래처명 검색"
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X size={14} />
                초기화
              </button>
            )}
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            거래처 추가
          </button>
        </div>
      </div>

      {/* 거래처 테이블 */}
      <OverseasCompanyTable
        companies={companies}
        total={total}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        companiesPerPage={companiesPerPage}
        onPageChange={setCurrentPage}
        onPerPageChange={setCompaniesPerPage}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onAdd={openAddModal}
        hasSearchQuery={!!searchTerm}
      />

      {/* 추가 모달 */}
      <OverseasCompanyFormModal
        mode="add"
        isOpen={isAddModalOpen}
        company={currentCompany}
        setCompany={setCurrentCompany}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddCompany}
        saving={saving}
      />

      {/* 수정 모달 */}
      <OverseasCompanyFormModal
        mode="edit"
        isOpen={isEditModalOpen}
        company={currentCompany}
        setCompany={setCurrentCompany}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditCompany}
        saving={saving}
      />

      {/* 스낵바 */}
      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}
