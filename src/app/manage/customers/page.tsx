"use client";

import type React from "react";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CircularProgress } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  X,
  Edit,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Building,
  MapPin,
  AlertCircle,
} from "lucide-react";

import SnackbarComponent from "@/components/Snackbar";

import { useCompaniesList } from "@/hooks/manage/customers/useCompaniesList";
import { useContactsBySearch } from "@/hooks/manage/customers/useContactsBySearch";
import { useAddCompany } from "@/hooks/manage/customers/useAddCompany";
import { useAddContacts } from "@/hooks/manage/customers/useAddContacts";
import { useUpdateCompany } from "@/hooks/manage/customers/useUpdateCompany";
import { useUpdateContacts } from "@/hooks/manage/customers/useUpdateContacts";
import { useDebounce } from "@/hooks/useDebounce";
import { useLoginUser } from "@/context/login";

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

  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
  const [addressTerm, setAddressTerm] = useState<string>(initialAddressTerm);
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>(
    []
  );
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [companiesPerPage, setCompaniesPerPage] = useState(
    initialCompaniesPerPage
  );
  const [contactTerm, setContactTerm] = useState<string>(initialContactTerm);
  const [deleteReason, setDeleteReason] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company>({
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
  });
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  // URL 업데이트 함수
  const updateUrl = () => {
    const params = new URLSearchParams();

    if (currentPage !== 1) params.set("page", currentPage.toString());
    if (searchTerm) params.set("search", searchTerm);
    if (addressTerm) params.set("address", addressTerm);
    if (contactTerm) params.set("contact", contactTerm);
    if (companiesPerPage !== 10)
      params.set("perPage", companiesPerPage.toString());

    router.replace(`/manage/customers?${params.toString()}`);
  };

  // 상태가 변경될 때마다 URL 업데이트
  useEffect(() => {
    updateUrl();
  }, [currentPage, searchTerm, addressTerm, contactTerm, companiesPerPage]);

  // Debounced search terms
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedAddressTerm = useDebounce(addressTerm, 300);
  const debouncedContactTerm = useDebounce(contactTerm, 300);

  // SWR hooks
  const { companyIds, isLoading: contactLoading } =
    useContactsBySearch(debouncedContactTerm);
  const { companies, total, isLoading, isError, refreshCompanies } =
    useCompaniesList(
      currentPage,
      companiesPerPage,
      debouncedSearchTerm,
      debouncedAddressTerm,
      companyIds
    );
  const { addCompany, isLoading: isAdding } = useAddCompany();
  const { addContacts } = useAddContacts();
  const { updateCompany } = useUpdateCompany();
  const { updateContacts } = useUpdateContacts();

  // Pagination logic
  const paginationNumbers = () => {
    const pageNumbers = [];
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

  // Update total pages when data changes
  useEffect(() => {
    if (!isLoading && !isError && companies) {
      setTotalPages(Math.ceil(total / companiesPerPage));
    }
  }, [companies, total, isLoading, isError, companiesPerPage]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isModalOpen) closeModal();
        if (isAddModalOpen) closeAddModal();
        if (isDeleteModalOpen) cancelDelete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, isAddModalOpen, isDeleteModalOpen]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setCurrentPage(1);
    }
  };

  // Contact management
  const addContact = () => {
    setCurrentCompany({
      ...currentCompany,
      contact: [
        {
          contact_name: "",
          mobile: "",
          department: "",
          level: "",
          email: "",
          resign: false,
        },
        ...(currentCompany?.contact || []),
      ],
    });
  };

  const handleContactChange = (
    index: number,
    field: keyof Contact,
    value: any
  ) => {
    setCurrentCompany((prev) => {
      const updatedContact = [...prev.contact];
      updatedContact[index] = { ...updatedContact[index], [field]: value };
      return { ...prev, contact: updatedContact };
    });
  };

  const removeContact = (index: number) => {
    const updatedContact = [...currentCompany.contact];
    updatedContact.splice(index, 1);
    setCurrentCompany({ ...currentCompany, contact: updatedContact });
  };

  // Company CRUD operations
  const handleAddCompany = async () => {
    if (!currentCompany.name || !currentCompany.contact.length) {
      setSnackbarMessage("필수 입력값을 모두 채워주세요.");
      return;
    }

    setSaving(true);

    try {
      const data = await addCompany(currentCompany);
      await addContacts(currentCompany.contact, data.id);
      await refreshCompanies();

      setSnackbarMessage("거래처 추가 완료");
      closeAddModal();
    } catch (error) {
      console.error("Error adding company:", error);
      setSnackbarMessage("거래처 추가 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!currentCompany.name || !currentCompany.contact.length) {
      setSnackbarMessage("필수 입력값을 모두 채워주세요.");
      return;
    }

    setSaving(true);

    try {
      await updateCompany(currentCompany);
      await updateContacts(currentCompany.contact, currentCompany.id);
      setSnackbarMessage("거래처 수정 완료");
      await refreshCompanies(undefined, { revalidate: true });
      closeModal();
    } catch (error) {
      console.error("Error updating company:", error);
      setSnackbarMessage("거래처 수정 실패");
    } finally {
      setSaving(false);
    }
  };

  // Delete company
  const handleDelete = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteReason.length === 0) return;
    if (companyToDelete) {
      try {
        const { error } = await supabase.from("deletion_requests").insert([
          {
            type: "companies",
            related_id: companyToDelete.id,
            status: "pending",
            request_date: new Date(),
            user_id: user?.id || "",
            delete_reason: deleteReason,
            content: {
              companies: `거래처삭제 : ${companyToDelete.name}`,
            },
          },
        ]);

        if (error) throw error;

        setSnackbarMessage("삭제 요청 완료");
        setIsDeleteModalOpen(false);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error deleting company:", error);
        setSnackbarMessage("삭제 요청 실패");
      }
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setCompanyToDelete(null);
    setDeleteReason("");
  };

  // Modal management
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setCurrentCompany({
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
    });
  };

  const handleAdd = () => {
    setCurrentCompany({
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
    });
    setIsAddModalOpen(true);
  };

  const handleEdit = (company: Company) => {
    try {
      const relatedIndustries = industries
        .filter((ind) => (company.industry ?? []).includes(ind.name))
        .map((ind) => String(ind.id));

      setCurrentCompany({
        ...company,
        industry: relatedIndustries,
        contact: company.contact || [],
      });

      setIsModalOpen(true);
    } catch (error) {
      console.error("Error in handleEdit:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCompany({
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
    });
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setAddressTerm("");
    setContactTerm("");
    setCurrentPage(1);
  };

  return (
    <div className="text-sm text-gray-800">
      {/* Search Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Company Name */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              거래처명
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={handleKeyPress}
                placeholder="거래처명 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Building
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          {/* Address */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              주소
            </label>
            <div className="relative">
              <input
                type="text"
                value={addressTerm}
                onChange={(e) => {
                  setAddressTerm(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={handleKeyPress}
                placeholder="주소 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <MapPin
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          {/* Contact Person */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              담당자
            </label>
            <div className="relative">
              <input
                type="text"
                value={contactTerm}
                onChange={(e) => {
                  setContactTerm(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={handleKeyPress}
                placeholder="담당자 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          {/* Industry */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              업종
            </label>
            <div className="relative">
              <select className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none">
                <option value="">모든 업종</option>
                {industries.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </select>
              <Filter
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex justify-end mt-4 gap-4">
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <X size={16} />
            <span>필터 초기화</span>
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            <span>거래처 추가</span>
          </button>
        </div>
      </div>

      {/* Table Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          총 <span className="font-semibold text-blue-600">{total}</span>개
          거래처
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">표시 개수:</label>
          <select
            value={companiesPerPage}
            onChange={(e) => {
              setCompaniesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="10">10개</option>
            <option value="20">20개</option>
            <option value="30">30개</option>
            <option value="50">50개</option>
          </select>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <CircularProgress size={40} />
          </div>
        ) : companies && companies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    거래처명
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                  >
                    주소
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell"
                  >
                    번호
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell"
                  >
                    팩스
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    수정
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    삭제
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((company: Company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                        onClick={() =>
                          router.push(`/consultations/${company.id}`)
                        }
                      >
                        {company.name}
                      </div>
                      {company.business_number && (
                        <div className="text-xs text-gray-500 mt-1">
                          {company.business_number}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900 truncate max-w-xs">
                        {company.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900">
                        {company.phone || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900">
                        {company.fax || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleEdit(company)}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                        title="수정"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDelete(company)}
                        className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Search size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">검색 결과가 없습니다</p>
            <p className="text-gray-400 text-sm mt-2">
              다른 검색어로 시도해보세요
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ChevronLeft size={18} />
            </button>

            {paginationNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === "number" && setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-md ${
                  currentPage === page
                    ? "bg-blue-600 text-white font-medium"
                    : page === "..."
                    ? "text-gray-500 cursor-default"
                    : "text-gray-700 hover:bg-gray-100"
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
              className={`p-2 rounded-md ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {isModalOpen && currentCompany && (
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <motion.div
                className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-50"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                        거래처 수정
                      </h3>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Company Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            거래처명 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={currentCompany.name || ""}
                            onChange={(e) =>
                              setCurrentCompany({
                                ...currentCompany,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="거래처명 입력"
                          />
                        </div>

                        {/* Business Number */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            사업자 번호
                          </label>
                          <input
                            type="text"
                            value={currentCompany.business_number || ""}
                            onChange={(e) =>
                              setCurrentCompany({
                                ...currentCompany,
                                business_number: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="000-00-00000"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            이메일
                          </label>
                          <input
                            type="email"
                            value={currentCompany.email || ""}
                            onChange={(e) =>
                              setCurrentCompany({
                                ...currentCompany,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="company@example.com"
                          />
                        </div>

                        {/* Address */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            주소
                          </label>
                          <input
                            type="text"
                            value={currentCompany.address || ""}
                            onChange={(e) =>
                              setCurrentCompany({
                                ...currentCompany,
                                address: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="주소 입력"
                          />
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            전화번호
                          </label>
                          <input
                            type="text"
                            value={currentCompany.phone || ""}
                            onChange={(e) =>
                              setCurrentCompany({
                                ...currentCompany,
                                phone: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="000-0000-0000"
                          />
                        </div>

                        {/* Fax */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            팩스
                          </label>
                          <input
                            type="text"
                            value={currentCompany.fax || ""}
                            onChange={(e) =>
                              setCurrentCompany({
                                ...currentCompany,
                                fax: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="000-0000-0000"
                          />
                        </div>

                        {/* Parcel */}
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            택배/화물
                          </label>
                          <input
                            type="text"
                            value={currentCompany.parcel || ""}
                            onChange={(e) =>
                              setCurrentCompany({
                                ...currentCompany,
                                parcel: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="경동화물, 대신화물, 로젠택배, 직송 등"
                          />
                        </div>
                      </div>

                      {/* Contacts Section */}
                      <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-md font-medium text-gray-900">
                            담당자 <span className="text-red-500">*</span>
                          </h4>
                          <button
                            type="button"
                            onClick={addContact}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Plus size={14} className="mr-1" />
                            담당자 추가
                          </button>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          {currentCompany.contact &&
                          currentCompany.contact.length > 0 ? (
                            <div className="space-y-4">
                              {currentCompany.contact.map((contact, index) => (
                                <div
                                  key={index}
                                  className="bg-white p-4 rounded-md border border-gray-200 shadow-sm"
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <h5 className="text-sm font-medium text-gray-900">
                                      담당자 #{index + 1}
                                    </h5>
                                    <button
                                      type="button"
                                      onClick={() => removeContact(index)}
                                      className="inline-flex items-center p-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {/* Name */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        이름{" "}
                                        <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={contact.contact_name || ""}
                                        onChange={(e) =>
                                          handleContactChange(
                                            index,
                                            "contact_name",
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="이름"
                                      />
                                    </div>

                                    {/* Position */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        직급
                                      </label>
                                      <input
                                        type="text"
                                        value={contact.level || ""}
                                        onChange={(e) =>
                                          handleContactChange(
                                            index,
                                            "level",
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="직급"
                                      />
                                    </div>

                                    {/* Department */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        부서
                                      </label>
                                      <input
                                        type="text"
                                        value={contact.department || ""}
                                        onChange={(e) =>
                                          handleContactChange(
                                            index,
                                            "department",
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="부서"
                                      />
                                    </div>

                                    {/* Mobile */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        휴대폰
                                      </label>
                                      <input
                                        type="text"
                                        value={contact.mobile || ""}
                                        onChange={(e) =>
                                          handleContactChange(
                                            index,
                                            "mobile",
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="000-0000-0000"
                                      />
                                    </div>

                                    {/* Email */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        이메일
                                      </label>
                                      <input
                                        type="email"
                                        value={contact.email || ""}
                                        onChange={(e) =>
                                          handleContactChange(
                                            index,
                                            "email",
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="email@example.com"
                                      />
                                    </div>

                                    {/* Resigned */}
                                    <div className="flex items-center">
                                      <label className="inline-flex items-center mt-3">
                                        <input
                                          type="checkbox"
                                          checked={contact.resign || false}
                                          onChange={(e) =>
                                            handleContactChange(
                                              index,
                                              "resign",
                                              e.target.checked
                                            )
                                          }
                                          className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-gray-700">
                                          퇴사
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <User
                                size={32}
                                className="mx-auto text-gray-400 mb-2"
                              />
                              <p className="text-gray-500">
                                담당자가 없습니다. 담당자를 추가해주세요.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          비고
                        </label>
                        <textarea
                          value={currentCompany.notes || ""}
                          onChange={(e) =>
                            setCurrentCompany({
                              ...currentCompany,
                              notes: e.target.value,
                            })
                          }
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="거래처의 유의사항 또는 담당자별 유의사항을 작성해주세요."
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {saving ? (
                      <>
                        <CircularProgress size={18} className="mr-2" />
                        저장 중...
                      </>
                    ) : (
                      "저장"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    취소
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <motion.div
                className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-50"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                        거래처 추가
                      </h3>

                      {/* Same form fields as edit modal */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Company Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            거래처명 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={currentCompany.name || ""}
                            onChange={(e) =>
                              setCurrentCompany({
                                ...currentCompany,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="거래처명 입력"
                          />
                        </div>

                        {/* Business Number */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            사업자 번호
                          </label>
                          <input
                            type="text"
                            value={currentCompany.business_number || ""}
                            onChange={(e) =>
                              setCurrentCompany({
                                ...currentCompany,
                                business_number: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="000-00-00000"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            이메일
                          </label>
                          <input
                            type="email"
                            value={currentCompany.email || ""}
                            onChange={(e) =>
                              setCurrentCompany({
                                ...currentCompany,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="company@example.com"
                          />
                        </div>

                        {/* Address */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            주소
                          </label>
                          <input
                            type="text"
                            value={currentCompany.address || ""}
                            onChange={(e) =>
                              setCurrentCompany({
                                ...currentCompany,
                                address: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="주소 입력"
                          />
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            전화번호
                          </label>
                          <input
                            type="text"
                            value={currentCompany.phone || ""}
                            onChange={(e) =>
                              setCurrentCompany({
                                ...currentCompany,
                                phone: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="000-0000-0000"
                          />
                        </div>

                        {/* Fax */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            팩스
                          </label>
                          <input
                            type="text"
                            value={currentCompany.fax || ""}
                            onChange={(e) =>
                              setCurrentCompany({
                                ...currentCompany,
                                fax: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="000-0000-0000"
                          />
                        </div>

                        {/* Parcel */}
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            택배/화물
                          </label>
                          <input
                            type="text"
                            value={currentCompany.parcel || ""}
                            onChange={(e) =>
                              setCurrentCompany({
                                ...currentCompany,
                                parcel: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="경동화물, 대신화물, 로젠택배, 직송 등"
                          />
                        </div>
                      </div>

                      {/* Contacts Section */}
                      <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-md font-medium text-gray-900">
                            담당자 <span className="text-red-500">*</span>
                          </h4>
                          <button
                            type="button"
                            onClick={addContact}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Plus size={14} className="mr-1" />
                            담당자 추가
                          </button>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          {currentCompany.contact &&
                          currentCompany.contact.length > 0 ? (
                            <div className="space-y-4">
                              {currentCompany.contact.map((contact, index) => (
                                <div
                                  key={index}
                                  className="bg-white p-4 rounded-md border border-gray-200 shadow-sm"
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <h5 className="text-sm font-medium text-gray-900">
                                      담당자 #{index + 1}
                                    </h5>
                                    <button
                                      type="button"
                                      onClick={() => removeContact(index)}
                                      className="inline-flex items-center p-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {/* Name */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        이름{" "}
                                        <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={contact.contact_name || ""}
                                        onChange={(e) =>
                                          handleContactChange(
                                            index,
                                            "contact_name",
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="이름"
                                      />
                                    </div>

                                    {/* Position */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        직급
                                      </label>
                                      <input
                                        type="text"
                                        value={contact.level || ""}
                                        onChange={(e) =>
                                          handleContactChange(
                                            index,
                                            "level",
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="직급"
                                      />
                                    </div>

                                    {/* Department */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        부서
                                      </label>
                                      <input
                                        type="text"
                                        value={contact.department || ""}
                                        onChange={(e) =>
                                          handleContactChange(
                                            index,
                                            "department",
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="부서"
                                      />
                                    </div>

                                    {/* Mobile */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        휴대폰
                                      </label>
                                      <input
                                        type="text"
                                        value={contact.mobile || ""}
                                        onChange={(e) =>
                                          handleContactChange(
                                            index,
                                            "mobile",
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="000-0000-0000"
                                      />
                                    </div>

                                    {/* Email */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        이메일
                                      </label>
                                      <input
                                        type="email"
                                        value={contact.email || ""}
                                        onChange={(e) =>
                                          handleContactChange(
                                            index,
                                            "email",
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="email@example.com"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <User
                                size={32}
                                className="mx-auto text-gray-400 mb-2"
                              />
                              <p className="text-gray-500">
                                담당자가 없습니다. 담당자를 추가해주세요.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          비고
                        </label>
                        <textarea
                          value={currentCompany.notes || ""}
                          onChange={(e) =>
                            setCurrentCompany({
                              ...currentCompany,
                              notes: e.target.value,
                            })
                          }
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="거래처의 유의사항 또는 담당자별 유의사항을 작성해주세요."
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleAddCompany}
                    disabled={saving}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {saving ? (
                      <>
                        <CircularProgress size={18} className="mr-2" />
                        저장 중...
                      </>
                    ) : (
                      "저장"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeAddModal}
                    disabled={saving}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    취소
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && companyToDelete && (
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <motion.div
                className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-50"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        거래처 삭제 요청
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold text-gray-700">
                            {companyToDelete.name}
                          </span>{" "}
                          거래처를 삭제 요청하시겠습니까? 이 작업은 관리자 승인
                          후 완료됩니다.
                        </p>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            삭제 사유 <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="삭제 사유를 입력해주세요."
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={!deleteReason}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${
                      !deleteReason ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    삭제 요청
                  </button>
                  <button
                    type="button"
                    onClick={cancelDelete}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    취소
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snackbar for notifications */}
      <SnackbarComponent
        onClose={() => setSnackbarMessage("")}
        message={snackbarMessage}
      />
    </div>
  );
}
