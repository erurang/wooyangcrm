"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Search, Globe, X } from "lucide-react";

import SnackbarComponent from "@/components/Snackbar";
import {
  OverseasCompanyTable,
  OverseasCompanyFormModal,
} from "@/components/overseas";
import { useOverseasCompanies, useAddOverseasCompany, useUpdateOverseasCompany, useDeleteOverseasCompany } from "@/hooks/overseas";
import { AlertTriangle } from "lucide-react";
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<OverseasCompanyFormData>(emptyCompany);
  const [companyToDelete, setCompanyToDelete] = useState<OverseasCompany | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
  const { updateCompany } = useUpdateOverseasCompany();
  const { deleteCompany } = useDeleteOverseasCompany();

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
    if (!currentCompany.id) return;
    setSaving(true);
    try {
      await updateCompany({
        id: currentCompany.id,
        name: currentCompany.name,
        address: currentCompany.address,
        email: currentCompany.email,
        website: currentCompany.website,
        notes: currentCompany.notes,
        contacts: currentCompany.contacts,
      });
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
    setCompanyToDelete(company);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    setDeleting(true);
    try {
      await deleteCompany(companyToDelete.id);
      setSnackbarMessage("해외 거래처가 삭제되었습니다.");
      setIsDeleteModalOpen(false);
      setCompanyToDelete(null);
      mutate();
    } catch (error) {
      setSnackbarMessage("거래처 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setCompanyToDelete(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-sm text-slate-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* 검색 필터 */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          {/* 타이틀 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-50 rounded-lg">
                <Globe className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">해외 거래처</h1>
                <p className="text-xs text-slate-500">해외 거래처를 관리합니다</p>
              </div>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus size={16} />
              거래처 추가
            </button>
          </div>

          {/* 검색 필터 */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
                placeholder="거래처명 검색..."
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={14} />
                초기화
              </button>
            )}
          </div>
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
      </motion.div>

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

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && companyToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-5 border-b flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">거래처 삭제</h3>
            </div>

            <div className="p-5">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">&quot;{companyToDelete.name}&quot;</span> 거래처를 삭제하시겠습니까?
              </p>
              <p className="mt-2 text-sm text-gray-500">
                삭제된 거래처는 복구할 수 없습니다.
              </p>
            </div>

            <div className="flex justify-end items-center gap-3 px-5 py-4 bg-gray-50 border-t">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={deleting}
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                    삭제 중...
                  </>
                ) : (
                  "삭제"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 스낵바 */}
      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}
