//test
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CircularProgress } from "@mui/material"; // MUI Snackbar 임포트
import { useRouter } from "next/navigation";

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
  industry: string[]; // 업종을 배열로 저장
  phone: string;
  fax: string;
  email: string;
  notes: string;
  contact: Contact[]; // 연락처 배열 추가
  parcel: string;
}

export default function Page() {
  const user = useLoginUser();
  const [searchTerm, setSearchTerm] = useState<string>(""); // 거래처 검색어
  const [addressTerm, setAddressTerm] = useState<string>(""); // 주소 검색어
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>(
    []
  );
  const [saving, setSaving] = useState(false); // 🔹 저장 로딩 상태 추가

  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 상태
  const [totalPages, setTotalPages] = useState(1); // 총 페이지 수
  const [companiesPerPage, setCompaniesPerPage] = useState(10);
  const [contactTerm, setContactTerm] = useState<string>(""); // 주소 검색어
  const [deleteReason, setDeleteReason] = useState("");

  const router = useRouter();

  // 토스트 관련 상태
  const [snackbarMessage, setSnackbarMessage] = useState<string>(""); // 스낵바 메시지

  // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // 추가 모달 상태
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // 삭제 모달 상태
  const [currentCompany, setCurrentCompany] = useState<Company>({
    id: "", // id 필드 반드시 문자열로 초기화
    company_code: "", // 빈 문자열로 초기화
    name: "",
    business_number: "",
    address: "",
    industry: [], // 업종을 비워둠
    phone: "",
    fax: "",
    email: "",
    notes: "",
    contact: [], // 기본값은 빈 배열
    parcel: "",
  }); // 현재 거래처 정보

  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null); // 삭제할 거래처 정보

  // debounce
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedAddressTerm = useDebounce(addressTerm, 300);
  const debouncedContactTerm = useDebounce(contactTerm, 300);

  //// Swr test ////

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
  //// swr test ////

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

  // 페이징 정보 업데이트
  useEffect(() => {
    if (!isLoading && !isError && companies) {
      setTotalPages(Math.ceil(total / companiesPerPage));
    }
  }, [companies, total, isLoading, isError]);

  // useEffect(() => {
  //   const fetchIndustries = async () => {
  //     const { data, error } = await supabase
  //       .from("industries")
  //       .select("id, name");
  //     if (error) {
  //       console.error("Failed to fetch industries:", error);
  //     } else {
  //       console.log("data", data);
  //       setIndustries(data || []);
  //     }
  //   };
  //   fetchIndustries();
  // }, [currentPage]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isModalOpen) closeModal();
        if (isAddModalOpen) closeAddModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, isAddModalOpen]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setCurrentPage(1); // 1페이지로 이동
    }
  };

  // ui담당자 추가
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

  // ui 담당자 수정
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

  // ui 담당자 삭제
  const removeContact = (index: number) => {
    const updatedContact = [...currentCompany.contact];
    updatedContact.splice(index, 1);
    setCurrentCompany({ ...currentCompany, contact: updatedContact });
  };
  /////

  // api추가
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

  // api 수정/저장
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
  //

  // 회사 ui삭제관련
  // 삭제 버튼 클릭 시 삭제 요청 처리
  const handleDelete = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteReason.length === 0) return;
    if (companyToDelete) {
      try {
        // 2️⃣ 회사 삭제 요청 추가
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

  // const confirmDelete = async () => {
  //   if (companyToDelete) {
  //     try {
  //       // 1️⃣ 해당 회사의 contacts 삭제
  // await supabase
  //   .from("contacts")
  //   .delete()
  //   .eq("company_id", companyToDelete.id);

  //       // 2️⃣ 회사 삭제 요청 추가
  //       const { error } = await supabase.from("deletion_requests").insert([
  //         {
  //           type: "company",
  //           related_id: companyToDelete.id,
  //           status: "pending",
  //         },
  //       ]);

  //       if (error) throw error;

  //       setSnackbarMessage("삭제 요청 완료");

  //       setIsDeleteModalOpen(false);
  //       setCurrentPage(1);
  //     } catch (error) {
  //       console.error("Error deleting company:", error);
  //       setSnackbarMessage("삭제 요청 실패");
  //     }
  //   }
  // };

  // const closeDeleteModal = () => {
  //   setIsDeleteModalOpen(false);
  //   setCompanyToDelete(null);
  // };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setCompanyToDelete(null);
  };

  // 모달 관련
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setCurrentCompany({
      id: "", // id 필드 반드시 문자열로 초기화
      company_code: "", // 빈 문자열로 초기화
      name: "",
      business_number: "",
      address: "",
      industry: [], // 업종을 비워둠
      phone: "",
      fax: "",
      email: "",
      notes: "",
      contact: [],
      parcel: "",
    });
  };
  // 추가 버튼 클릭 시 모달 열기
  const handleAdd = () => {
    setCurrentCompany({
      id: "",
      company_code: "",
      name: "",
      business_number: "",
      address: "",
      industry: [], // 업종은 기본적으로 빈 배열
      phone: "",
      fax: "",
      email: "",
      notes: "",
      contact: [],
      parcel: "",
    });
    setIsAddModalOpen(true); // 추가 모달 열기
  };

  // 수정 버튼 클릭 시 모달 열기
  const handleEdit = (company: Company) => {
    try {
      const relatedIndustries = industries
        .filter((ind) => (company.industry ?? []).includes(ind.name))
        .map((ind) => String(ind.id));

      setCurrentCompany({
        ...company,
        industry: relatedIndustries,
        contact: company.contact || [], // 🚀 contacts가 없으면 빈 배열을 설정
      });

      setIsModalOpen(true);
    } catch (error) {
      console.error("Error in handleEdit:", error);
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCompany({
      id: "", // id 필드 반드시 문자열로 초기화
      company_code: "", // 빈 문자열로 초기화
      name: "",
      business_number: "",
      address: "",
      industry: [], // 업종을 비워둠
      phone: "",
      fax: "",
      email: "",
      notes: "",
      contact: [],
      parcel: "",
    });
  };
  ///

  // 업종관련 < 아직안함
  const fetchCompaniesByIndustry = async (industryId: number) => {
    try {
      if (!industryId) {
        // 업종 선택 해제 시 전체 데이터를 다시 표시

        return;
      }

      // 업종 ID에 따라 필터링된 회사 데이터 가져오기
      const { data, error } = await supabase
        .from("company_industries")
        .select(
          `
          company_id,
          companies (
            id,
            company_code,
            name,
            address,
            phone,
            fax,
            email,
            notes,
            parcel,
            contact,
            created_at
          ),
          industries (name)
        `
        )
        .eq("industry_id", industryId);

      if (error) {
        console.error("Failed to fetch companies by industry:", error);
        return;
      }

      // 필터링된 데이터를 처리
      const filtered = data.map((relation: any) => {
        const company = relation.companies;
        const industryName = relation.industries?.name || ""; // 업종 이름 가져오기

        return {
          ...company,
          industry: [industryName], // 업종 이름 배열로 설정
        };
      });
    } catch (error) {
      console.error("Error filtering companies by industry:", error);
    }
  };

  return (
    <div className="text-sm text-[#37352F]">
      {/* 검색란 */}
      <div className="bg-[#FBFBFB] rounded-md border border-gray-300 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_0.5fr] gap-4">
        {/* 거래처명 */}
        <div className="flex items-center">
          <label className="w-1/4 min-w-[60px] p-2 border-t border-l border-b border-gray-300 rounded-l">
            거래처
          </label>
          <motion.input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            onKeyDown={handleKeyPress}
            placeholder="거래처명"
            className="w-3/4 p-2 border border-gray-300 rounded-r"
            whileFocus={{
              scale: 1.05,
              boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
            }}
          />
        </div>

        {/* 주소 */}
        <div className="flex items-center">
          <label className="w-1/4 min-w-[60px] p-2 border-t border-l border-b border-gray-300 rounded-l">
            주소
          </label>
          <motion.input
            value={addressTerm}
            onChange={(e) => {
              setAddressTerm(e.target.value);
              setCurrentPage(1);
            }}
            onKeyDown={handleKeyPress}
            placeholder="주소"
            className="w-3/4 p-2 border border-gray-300 rounded-r"
            whileFocus={{
              scale: 1.05,
              boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
            }}
          />
        </div>

        {/* 담당자 */}
        <div className="flex items-center">
          <label className="w-1/4 min-w-[60px] p-2 border-t border-l border-b border-gray-300 rounded-l">
            담당자
          </label>
          <motion.input
            value={contactTerm}
            onChange={(e) => {
              setContactTerm(e.target.value);
              setCurrentPage(1);
            }}
            onKeyDown={handleKeyPress}
            placeholder="담당자"
            className="w-3/4 p-2 border border-gray-300 rounded-r"
            whileFocus={{
              scale: 1.05,
              boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
            }}
          />
        </div>

        {/* 업종 */}
        <div className="items-center hidden md:flex lg:flex">
          <label className="w-1/4 min-w-[60px] p-2 border-t border-l border-b border-gray-300 rounded-l">
            업종
          </label>
          <select className="w-3/4 p-2 border border-gray-300 rounded-r h-full">
            <option value="">업종 선택</option>
            {/* {industries.map((industry) => (
              <option key={industry.id} value={industry.id}>
                {industry.name}
              </option>
            ))} */}
          </select>
        </div>

        {/* 필터리셋 버튼 */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => {
              setSearchTerm("");
              setAddressTerm("");
              setContactTerm("");
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-md"
          >
            필터리셋
          </button>
        </div>
      </div>

      {/* 상단 버튼 & 표시 개수 */}
      <div className="flex justify-between items-center my-4">
        <div className="flex">
          <div
            className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
            onClick={handleAdd}
          >
            <span className="mr-2">+</span>
            <span>추가</span>
          </div>
        </div>
        <div className="flex items-center">
          <label className="mr-2 text-sm text-gray-600">표시 개수:</label>
          <select
            value={companiesPerPage}
            onChange={(e) => {
              setCompaniesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 p-2 rounded-md text-sm"
          >
            <option value="10">10개</option>
            <option value="20">20개</option>
            <option value="30">30개</option>
            <option value="50">50개</option>
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-[#FBFBFB] rounded-md border overflow-x-auto">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-center">
              {/* 모바일에서만 보이는 3열 (거래처명, 주소, 수정) */}
              {/* 데스크톱에서만 보이는 추가 열 (담당자, 번호, 팩스, 삭제) */}
              <th className="px-4 py-2 border-b border-r  ">거래처명</th>
              <th className="px-4 py-2 border-b border-r ">주소</th>
              <th className="px-4 py-2 border-b border-r hidden md:table-cell">
                담당자
              </th>
              <th className="px-4 py-2 border-b border-r hidden lg:table-cell">
                번호
              </th>
              <th className="px-4 py-2 border-b border-r hidden lg:table-cell">
                팩스
              </th>
              <th className="px-4 py-2 border-b border-r hidden md:table-cell">
                수정
              </th>
              <th className="px-4 py-2 border-b border-r hidden md:table-cell">
                삭제
              </th>
            </tr>
          </thead>
          <tbody>
            {companies?.map((company: Company) => (
              <tr key={company.id} className="hover:bg-gray-100 text-center">
                {/* 거래처명 (모바일 & 데스크톱 모두 표시) */}
                <td
                  className="px-4 py-2 border-b border-r text-blue-500 cursor-pointer"
                  onClick={() => router.push(`/consultations/${company.id}`)}
                >
                  {company.name}
                </td>

                {/* 주소 (모바일 & 데스크톱 모두 표시) */}
                <td className="px-4 py-2 border-b border-r w-2/5">
                  {company.address}
                </td>

                {/* 수정 (모바일 & 데스크톱 모두 표시) */}

                {/* 담당자 (md 이상에서만 표시) */}
                <td className="px-4 py-2 border-b border-r hidden md:table-cell">
                  {company.contact[0]?.contact_name} ..
                </td>

                {/* 번호 (lg 이상에서만 표시) */}
                <td className="px-4 py-2 border-b border-r hidden lg:table-cell">
                  {company.phone}
                </td>

                {/* 팩스 (lg 이상에서만 표시) */}
                <td className="px-4 py-2 border-b border-r hidden lg:table-cell">
                  {company.fax}
                </td>

                <td
                  className="px-4 py-2 border-b border-r text-blue-500 cursor-pointer hidden md:table-cell"
                  onClick={() => handleEdit(company)}
                >
                  수정
                </td>

                {/* 삭제 (md 이상에서만 표시) */}
                <td
                  className="px-4 py-2 border-b border-r text-red-500 cursor-pointer hidden md:table-cell"
                  onClick={() => handleDelete(company)}
                >
                  삭제
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모달 (수정) */}
      <AnimatePresence>
        {isModalOpen && currentCompany && (
          <motion.div
            className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50 px-2"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white p-6 rounded-md w-11/12 md:w-2/3 max-h-[75vh] md:max-h-[85vh] overflow-y-auto">
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">
                거래처 수정
              </h3>

              {/* 모바일 1열, 데스크톱 4열 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* 거래처명 */}
                <div className="mb-2">
                  <label className="block mb-1">거래처명</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany.name || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        name: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                {/* 사업자번호 */}
                <div className="mb-2">
                  <label className="block mb-1">사업자 번호</label>
                  <motion.input
                    placeholder="000-00-00000"
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany.business_number || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        business_number: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                {/* 이메일 */}
                <div className="mb-2">
                  <label className="block mb-1">이메일</label>
                  <motion.input
                    placeholder="...@....com"
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="email"
                    value={currentCompany.email || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        email: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                {/* 택배/화물 */}
                <div className="mb-2">
                  <label className="block mb-1">택배/화물</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    placeholder="경동화물,대신화물,로젠택배, 직송 등.."
                    type="text"
                    value={currentCompany?.parcel || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        parcel: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* 모바일 1열, 데스크톱 4열 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* 주소 */}
                <div className="mb-2">
                  <label className="block mb-1">주소</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany.address || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        address: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                {/* 전화번호 */}
                <div className="mb-2">
                  <label className="block mb-1">전화번호</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany.phone || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        phone: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                {/* 팩스 */}
                <div className="mb-2">
                  <label className="block mb-1">팩스</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany.fax || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        fax: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* 담당자 목록 */}
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <label className="block mb-1">담당자</label>
                  <button
                    className="px-3 py-1 bg-gray-200 text-xs md:text-sm rounded-md hover:bg-gray-300"
                    onClick={addContact}
                  >
                    + 추가
                  </button>
                </div>
                <div className="space-y-2">
                  {(currentCompany?.contact || []).map((contact, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap md:flex-nowrap gap-2"
                    >
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="text"
                        value={contact?.contact_name || ""}
                        onChange={(e) =>
                          handleContactChange(
                            index,
                            "contact_name",
                            e.target.value
                          )
                        }
                        placeholder="이름"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="text"
                        value={contact?.mobile || ""}
                        onChange={(e) =>
                          handleContactChange(index, "mobile", e.target.value)
                        }
                        placeholder="휴대폰"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="text"
                        value={contact?.department || ""}
                        onChange={(e) =>
                          handleContactChange(
                            index,
                            "department",
                            e.target.value
                          )
                        }
                        placeholder="부서"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="text"
                        value={contact?.level || ""}
                        onChange={(e) =>
                          handleContactChange(index, "level", e.target.value)
                        }
                        placeholder="직급"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="email"
                        value={contact?.email || ""}
                        onChange={(e) =>
                          handleContactChange(index, "email", e.target.value)
                        }
                        placeholder="이메일"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <button
                        onClick={() => removeContact(index)}
                        className="px-4 py-2 bg-red-500 text-white text-xs md:text-sm rounded-md"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 비고 */}
              <div className="mb-2">
                <label className="block mb-1">비고</label>
                <textarea
                  placeholder="거래처의 유의사항 또는 담당자별 유의사항을 작성해주세요. 거래처 등록을 위해 최소 1명의 담당자를 설정해주세요."
                  value={currentCompany.notes || ""}
                  onChange={(e) =>
                    setCurrentCompany({
                      ...currentCompany,
                      notes: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md min-h-52"
                ></textarea>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeModal}
                  className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
                    saving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && companyToDelete && (
        <motion.div
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50"
        >
          <div className="bg-white p-6 rounded-md w-11/12 md:w-1/3">
            <h3 className="text-xl font-semibold mb-4">삭제 요청</h3>
            <textarea
              className="w-full border rounded-md p-4 h-48"
              placeholder="삭제 사유를 입력해주세요."
              onChange={(e) => setDeleteReason(e.target.value)}
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDelete}
                className="bg-gray-500 text-white px-4 py-2 rounded-md"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md"
              >
                삭제
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 추가 모달 */}
      {isAddModalOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50 px-2"
        >
          <div className="bg-white p-6 rounded-md w-11/12 md:w-2/3 max-h-[75vh] md:max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">
              거래처 추가
            </h3>

            {/* 반응형: 모바일 2열, 데스크톱 4열 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="mb-2">
                <label className="block mb-1">거래처명</label>
                <motion.input
                  placeholder="우양신소재..."
                  whileFocus={{
                    scale: 1.05,
                    boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                  }}
                  type="text"
                  value={currentCompany?.name || ""}
                  onChange={(e) =>
                    setCurrentCompany({
                      ...currentCompany,
                      name: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-1">사업자 번호</label>
                <motion.input
                  placeholder="000-00-00000"
                  whileFocus={{
                    scale: 1.05,
                    boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                  }}
                  type="text"
                  value={currentCompany?.business_number || ""}
                  onChange={(e) =>
                    setCurrentCompany({
                      ...currentCompany,
                      business_number: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-1">이메일</label>
                <motion.input
                  whileFocus={{
                    scale: 1.05,
                    boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                  }}
                  placeholder="...@....com"
                  type="email"
                  value={currentCompany?.email || ""}
                  onChange={(e) =>
                    setCurrentCompany({
                      ...currentCompany,
                      email: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-1">택배/화물</label>
                <motion.input
                  placeholder="경동화물,대신화물,로젠택배, 직송 등.."
                  whileFocus={{
                    scale: 1.05,
                    boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                  }}
                  type="text"
                  value={currentCompany?.parcel || ""}
                  onChange={(e) =>
                    setCurrentCompany({
                      ...currentCompany,
                      parcel: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* 반응형: 모바일 2열, 데스크톱 4열 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="mb-2">
                <label className="block mb-1">주소</label>
                <motion.input
                  placeholder="첨단기업 3로 81.."
                  whileFocus={{
                    scale: 1.05,
                    boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                  }}
                  type="text"
                  value={currentCompany?.address || ""}
                  onChange={(e) =>
                    setCurrentCompany({
                      ...currentCompany,
                      address: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-1">전화번호</label>
                <motion.input
                  placeholder="000-0000-0000"
                  whileFocus={{
                    scale: 1.05,
                    boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                  }}
                  type="text"
                  value={currentCompany?.phone || ""}
                  onChange={(e) =>
                    setCurrentCompany({
                      ...currentCompany,
                      phone: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-1">팩스</label>
                <motion.input
                  placeholder="000-0000-0000"
                  whileFocus={{
                    scale: 1.05,
                    boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                  }}
                  type="text"
                  value={currentCompany?.fax || ""}
                  onChange={(e) =>
                    setCurrentCompany({
                      ...currentCompany,
                      fax: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* 담당자 목록 */}
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <label className="block mb-1">담당자</label>
                <button
                  className="px-3 py-1 bg-gray-200 text-xs md:text-sm rounded-md hover:bg-gray-300"
                  onClick={addContact}
                >
                  + 추가
                </button>
              </div>
              <div className="space-y-2">
                {(currentCompany?.contact || []).map((contact, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap md:flex-nowrap gap-2"
                  >
                    <motion.input
                      whileFocus={{
                        scale: 1.05,
                        boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                      }}
                      type="text"
                      value={contact?.contact_name || ""}
                      onChange={(e) =>
                        handleContactChange(
                          index,
                          "contact_name",
                          e.target.value
                        )
                      }
                      placeholder="이름"
                      className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                    />
                    <motion.input
                      whileFocus={{
                        scale: 1.05,
                        boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                      }}
                      type="text"
                      value={contact?.level || ""}
                      onChange={(e) =>
                        handleContactChange(index, "level", e.target.value)
                      }
                      placeholder="직급"
                      className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                    />
                    <motion.input
                      whileFocus={{
                        scale: 1.05,
                        boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                      }}
                      type="text"
                      value={contact?.department || ""}
                      onChange={(e) =>
                        handleContactChange(index, "department", e.target.value)
                      }
                      placeholder="부서"
                      className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                    />
                    <motion.input
                      whileFocus={{
                        scale: 1.05,
                        boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                      }}
                      type="text"
                      value={contact?.mobile || ""}
                      onChange={(e) =>
                        handleContactChange(index, "mobile", e.target.value)
                      }
                      placeholder="휴대폰"
                      className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                    />
                    <motion.input
                      whileFocus={{
                        scale: 1.05,
                        boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                      }}
                      type="email"
                      value={contact?.email || ""}
                      onChange={(e) =>
                        handleContactChange(index, "email", e.target.value)
                      }
                      placeholder="이메일"
                      className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                    />
                    <button
                      onClick={() => removeContact(index)}
                      className="px-4 py-2 bg-red-500 text-white text-xs md:text-sm rounded-md"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 비고 */}
            <div className="mb-2">
              <label className="block mb-1">비고</label>
              <textarea
                placeholder="거래처의 유의사항 또는 담당자별 유의사항을 작성해주세요. 거래처 등록을 위해 최소 1명의 담당자를 설정해주세요."
                value={currentCompany?.notes || ""}
                onChange={(e) =>
                  setCurrentCompany({
                    ...currentCompany,
                    notes: e.target.value,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-md min-h-52"
              ></textarea>
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeAddModal}
                className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={handleAddCompany}
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
        </motion.div>
      )}

      {/* 페이지네이션 */}
      <div className="flex justify-center mt-4 overflow-x-auto space-x-1 md:space-x-2">
        <div className="flex justify-center mt-4 space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
          >
            이전
          </button>

          {paginationNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(Number(page))}
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
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
          >
            다음
          </button>
        </div>
      </div>

      {/* 스낵바 */}
      <SnackbarComponent
        onClose={() => setSnackbarMessage("")}
        message={snackbarMessage}
      />
    </div>
  );

  return (
    <div className="text-sm text-[#37352F]">
      <div>
        {/* 검색란 */}
        <div className="bg-[#FBFBFB] rounded-md border border-gray-300 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_0.5fr] gap-4">
          {/* 거래처명 */}
          <div className="flex flex-col sm:flex-row items-center justify-center">
            <label className="w-full sm:w-1/4 block p-2 border border-gray-300 rounded-t sm:rounded-l sm:rounded-tr-none">
              거래처명
            </label>
            <motion.input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={handleKeyPress} // 🔹 Enter 누르면 검색 실행
              placeholder="거래처명"
              className="w-full sm:w-3/4 p-2 border border-gray-300 rounded-b sm:rounded-r sm:rounded-bl-none"
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>
          {/* 주소 */}
          <div className="flex flex-col sm:flex-row items-center justify-center">
            <label className="w-full sm:w-1/4 block p-2 border border-gray-300 rounded-t sm:rounded-l sm:rounded-tr-none">
              주소
            </label>
            <motion.input
              value={addressTerm}
              onChange={(e) => {
                setAddressTerm(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={handleKeyPress}
              placeholder="주소"
              className="w-full sm:w-3/4 p-2 border border-gray-300 rounded-b sm:rounded-r sm:rounded-bl-none"
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>
          {/* 담당자 */}
          <div className="flex flex-col sm:flex-row items-center justify-center">
            <label className="w-full sm:w-1/4 block p-2 border border-gray-300 rounded-t sm:rounded-l sm:rounded-tr-none">
              담당자
            </label>
            <motion.input
              value={contactTerm}
              onChange={(e) => {
                setContactTerm(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={handleKeyPress}
              placeholder="담당자"
              className="w-full sm:w-3/4 p-2 border border-gray-300 rounded-b sm:rounded-r sm:rounded-bl-none"
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>
          {/* 업종 */}
          <div className="flex flex-col sm:flex-row items-center justify-center">
            <label className="w-full sm:w-1/4 block p-2 border border-gray-300 rounded-t sm:rounded-l sm:rounded-tr-none">
              업종
            </label>
            <select className="w-full sm:w-3/4 p-2 border border-gray-300 rounded-b sm:rounded-r sm:rounded-bl-none">
              <option value="">업종 선택</option>
              {/* {industries.map((industry) => (
            <option key={industry.id} value={industry.id}>
              {industry.name}
            </option>
          ))} */}
            </select>
          </div>
          {/* 필터리셋 버튼 */}
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setAddressTerm("");
                setContactTerm("");
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-md"
            >
              필터리셋
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center my-4">
          <div className="flex">
            <div
              className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
              onClick={handleAdd}
            >
              <span className="mr-2">+</span>
              <span>추가</span>
            </div>
          </div>

          <div className="flex items-center">
            <label className="mr-2 text-sm text-gray-600">표시 개수:</label>
            <select
              value={companiesPerPage}
              onChange={(e) => {
                setCompaniesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 p-2 rounded-md text-sm"
            >
              <option value="10">10개</option>
              <option value="20">20개</option>
              <option value="30">30개</option>
              <option value="50">50개</option>
            </select>
          </div>
        </div>
        <div className="bg-[#FBFBFB] rounded-md border">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 text-center">
                <th className="px-4 py-2 border-b border-r w-1/6">거래처명</th>
                <th className="px-4 py-2 border-b border-r hidden md:table-cell">
                  주소
                </th>
                <th className="px-4 py-2 border-b border-r hidden lg:table-cell">
                  담당자
                </th>
                <th className="px-4 py-2 border-b border-r hidden lg:table-cell">
                  번호
                </th>
                <th className="px-4 py-2 border-b border-r hidden lg:table-cell">
                  팩스
                </th>
                <th className="px-4 py-2 border-b border-r">수정</th>
                <th className="px-4 py-2 border-b border-r hidden md:table-cell">
                  삭제
                </th>
              </tr>
            </thead>
            <tbody>
              {companies?.map((company: Company) => (
                <tr key={company.id} className="hover:bg-gray-100 text-center">
                  <td
                    className="px-4 py-2 border-b border-r text-blue-500 cursor-pointer"
                    onClick={() => router.push(`/consultations/${company.id}`)}
                  >
                    {company.name}
                  </td>
                  <td className="px-4 py-2 border-b border-r hidden md:table-cell">
                    {company.address}
                  </td>
                  <td className="px-4 py-2 border-b border-r hidden lg:table-cell">
                    {company.contact[0]?.contact_name} ..
                  </td>
                  <td className="px-4 py-2 border-b border-r hidden lg:table-cell">
                    {company.phone}
                  </td>
                  <td className="px-4 py-2 border-b border-r hidden lg:table-cell">
                    {company.fax}
                  </td>
                  <td
                    className="px-4 py-2 border-b border-r text-blue-500 cursor-pointer"
                    onClick={() => handleEdit(company)}
                  >
                    수정
                  </td>
                  <td
                    className="px-4 py-2 border-b border-r text-red-500 cursor-pointer hidden md:table-cell"
                    onClick={() => handleDelete(company)}
                  >
                    삭제
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 모달 */}
      <AnimatePresence>
        {isModalOpen && currentCompany && (
          <motion.div
            className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50 px-2"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white p-6 rounded-md w-11/12 md:w-2/3 max-h-[75vh] md:max-h-[85vh] overflow-y-auto">
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">
                거래처 수정
              </h3>

              {/* 반응형: 모바일 1열, 데스크톱 4열 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="mb-2">
                  <label className="block mb-1">거래처명</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany.name || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        name: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">사업자 번호</label>
                  <motion.input
                    placeholder="000-00-00000"
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany.business_number || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        business_number: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">이메일</label>
                  <motion.input
                    placeholder="...@....com"
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="email"
                    value={currentCompany.email || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        email: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">택배/화물</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    placeholder="경동화물,대신화물,로젠택배, 직송 등.."
                    type="text"
                    value={currentCompany?.parcel || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        parcel: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* 반응형: 모바일 1열, 데스크톱 4열 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="mb-2">
                  <label className="block mb-1">주소</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany.address || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        address: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">전화번호</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany.phone || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        phone: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">팩스</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany.fax || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        fax: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* 담당자 목록 */}
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <label className="block mb-1">담당자</label>
                  <button
                    className="px-3 py-1 bg-gray-200 text-xs md:text-sm rounded-md hover:bg-gray-300"
                    onClick={addContact}
                  >
                    + 추가
                  </button>
                </div>

                <div className="space-y-2">
                  {(currentCompany?.contact || []).map((contact, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap md:flex-nowrap gap-2"
                    >
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="text"
                        value={contact?.contact_name || ""}
                        onChange={(e) =>
                          handleContactChange(
                            index,
                            "contact_name",
                            e.target.value
                          )
                        }
                        placeholder="이름"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="text"
                        value={contact?.mobile || ""}
                        onChange={(e) =>
                          handleContactChange(index, "mobile", e.target.value)
                        }
                        placeholder="휴대폰"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="text"
                        value={contact?.department || ""}
                        onChange={(e) =>
                          handleContactChange(
                            index,
                            "department",
                            e.target.value
                          )
                        }
                        placeholder="부서"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="text"
                        value={contact?.level || ""}
                        onChange={(e) =>
                          handleContactChange(index, "level", e.target.value)
                        }
                        placeholder="직급"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="email"
                        value={contact?.email || ""}
                        onChange={(e) =>
                          handleContactChange(index, "email", e.target.value)
                        }
                        placeholder="이메일"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.label className="flex items-center space-x-2">
                        <motion.input
                          whileTap={{ scale: 0.9 }}
                          type="checkbox"
                          checked={contact?.resign || false}
                          onChange={(e) =>
                            handleContactChange(
                              index,
                              "resign",
                              e.target.checked
                            )
                          }
                          className="w-5 h-5 accent-blue-500 cursor-pointer"
                        />
                        <span className="text-gray-700">퇴사</span>
                      </motion.label>
                      <button
                        onClick={() => removeContact(index)}
                        className="px-4 py-2 bg-red-500 text-white text-xs md:text-sm rounded-md"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 비고 */}
              <div className="mb-2">
                <label className="block mb-1">비고</label>
                <textarea
                  placeholder="거래처의 유의사항 또는 담당자별 유의사항을 작성해주세요. 거래처 등록을 위해 최소 1명의 담당자를 설정해주세요."
                  value={currentCompany.notes || ""}
                  onChange={(e) =>
                    setCurrentCompany({
                      ...currentCompany,
                      notes: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md min-h-52"
                ></textarea>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeModal}
                  className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
                    saving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
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
          </motion.div>
        )}

        {/* 삭제 확인 모달 */}
        {isDeleteModalOpen && companyToDelete && (
          <motion.div
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50"
          >
            <div className="bg-white p-6 rounded-md w-11/12 md:w-1/3">
              <h3 className="text-xl font-semibold mb-4">삭제 요청</h3>
              <textarea
                className="w-full border rounded-md p-4 h-48"
                placeholder="삭제 사유를 입력해주세요."
                onChange={(e) => setDeleteReason(e.target.value)}
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelDelete}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md"
                >
                  취소
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-500 text-white px-4 py-2 rounded-md"
                >
                  삭제
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 추가 모달 */}
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50 px-2"
          >
            <div className="bg-white p-6 rounded-md w-11/12 md:w-2/3 max-h-[75vh] md:max-h-[85vh] overflow-y-auto">
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">
                거래처 추가
              </h3>

              {/* 반응형: 모바일 2열, 데스크톱 4열 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="mb-2">
                  <label className="block mb-1">거래처명</label>
                  <motion.input
                    placeholder="우양신소재..."
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany?.name || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        name: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">사업자 번호</label>
                  <motion.input
                    placeholder="000-00-00000"
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany?.business_number || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        business_number: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">이메일</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    placeholder="...@....com"
                    type="email"
                    value={currentCompany?.email || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        email: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">택배/화물</label>
                  <motion.input
                    placeholder="경동화물,대신화물,로젠택배, 직송 등.."
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany?.parcel || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        parcel: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* 반응형: 모바일 2열, 데스크톱 4열 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="mb-2">
                  <label className="block mb-1">주소</label>
                  <motion.input
                    placeholder="첨단기업 3로 81.."
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany?.address || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        address: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">전화번호</label>
                  <motion.input
                    placeholder="000-0000-0000"
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany?.phone || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        phone: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">팩스</label>
                  <motion.input
                    placeholder="000-0000-0000"
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany?.fax || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        fax: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* 담당자 목록 */}
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <label className="block mb-1">담당자</label>
                  <button
                    className="px-3 py-1 bg-gray-200 text-xs md:text-sm rounded-md hover:bg-gray-300"
                    onClick={addContact}
                  >
                    + 추가
                  </button>
                </div>

                <div className="space-y-2">
                  {(currentCompany?.contact || []).map((contact, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap md:flex-nowrap gap-2"
                    >
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="text"
                        value={contact?.contact_name || ""}
                        onChange={(e) =>
                          handleContactChange(
                            index,
                            "contact_name",
                            e.target.value
                          )
                        }
                        placeholder="이름"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="text"
                        value={contact?.level || ""}
                        onChange={(e) =>
                          handleContactChange(index, "level", e.target.value)
                        }
                        placeholder="직급"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="text"
                        value={contact?.department || ""}
                        onChange={(e) =>
                          handleContactChange(
                            index,
                            "department",
                            e.target.value
                          )
                        }
                        placeholder="부서"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="text"
                        value={contact?.mobile || ""}
                        onChange={(e) =>
                          handleContactChange(index, "mobile", e.target.value)
                        }
                        placeholder="휴대폰"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="email"
                        value={contact?.email || ""}
                        onChange={(e) =>
                          handleContactChange(index, "email", e.target.value)
                        }
                        placeholder="이메일"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <button
                        onClick={() => removeContact(index)}
                        className="px-4 py-2 bg-red-500 text-white text-xs md:text-sm rounded-md"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 비고 */}
              <div className="mb-2">
                <label className="block mb-1">비고</label>
                <textarea
                  placeholder="거래처의 유의사항 또는 담당자별 유의사항을 작성해주세요. 거래처 등록을 위해 최소 1명의 담당자를 설정해주세요."
                  value={currentCompany?.notes || ""}
                  onChange={(e) =>
                    setCurrentCompany({
                      ...currentCompany,
                      notes: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md min-h-52"
                ></textarea>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeModal}
                  className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
                    saving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
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
          </motion.div>
        )}

        {/* 삭제 확인 모달 */}
        {isDeleteModalOpen && companyToDelete && (
          <motion.div
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50"
          >
            <div className="bg-white p-6 rounded-md w-11/12 md:w-1/3">
              <h3 className="text-xl font-semibold mb-4">삭제 요청</h3>
              <textarea
                className="w-full border rounded-md p-4 h-48"
                placeholder="삭제 사유를 입력해주세요."
                onChange={(e) => setDeleteReason(e.target.value)}
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelDelete}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md"
                >
                  취소
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-500 text-white px-4 py-2 rounded-md"
                >
                  삭제
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 추가 모달 */}
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50 px-2"
          >
            <div className="bg-white p-6 rounded-md w-11/12 md:w-2/3 max-h-[75vh] md:max-h-[85vh] overflow-y-auto">
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">
                거래처 추가
              </h3>

              {/* 반응형: 모바일 2열, 데스크톱 4열 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="mb-2">
                  <label className="block mb-1">거래처명</label>
                  <motion.input
                    placeholder="우양신소재..."
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany?.name || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        name: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">사업자 번호</label>
                  <motion.input
                    placeholder="000-00-00000"
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany?.business_number || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        business_number: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">이메일</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    placeholder="...@....com"
                    type="email"
                    value={currentCompany?.email || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        email: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">택배/화물</label>
                  <motion.input
                    placeholder="경동화물,대신화물,로젠택배, 직송 등.."
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany?.parcel || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        parcel: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* 반응형: 모바일 2열, 데스크톱 4열 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="mb-2">
                  <label className="block mb-1">주소</label>
                  <motion.input
                    placeholder="첨단기업 3로 81.."
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany?.address || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        address: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">전화번호</label>
                  <motion.input
                    placeholder="000-0000-0000"
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany?.phone || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        phone: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">팩스</label>
                  <motion.input
                    placeholder="000-0000-0000"
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    type="text"
                    value={currentCompany?.fax || ""}
                    onChange={(e) =>
                      setCurrentCompany({
                        ...currentCompany,
                        fax: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* 담당자 목록 */}
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <label className="block mb-1">담당자</label>
                  <button
                    className="px-3 py-1 bg-gray-200 text-xs md:text-sm rounded-md hover:bg-gray-300"
                    onClick={addContact}
                  >
                    + 추가
                  </button>
                </div>

                <div className="space-y-2">
                  {(currentCompany?.contact || []).map((contact, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap md:flex-nowrap gap-2"
                    >
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="text"
                        value={contact?.contact_name || ""}
                        onChange={(e) =>
                          handleContactChange(
                            index,
                            "contact_name",
                            e.target.value
                          )
                        }
                        placeholder="이름"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="text"
                        value={contact?.level || ""}
                        onChange={(e) =>
                          handleContactChange(index, "level", e.target.value)
                        }
                        placeholder="직급"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="text"
                        value={contact?.department || ""}
                        onChange={(e) =>
                          handleContactChange(
                            index,
                            "department",
                            e.target.value
                          )
                        }
                        placeholder="부서"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="text"
                        value={contact?.mobile || ""}
                        onChange={(e) =>
                          handleContactChange(index, "mobile", e.target.value)
                        }
                        placeholder="휴대폰"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                        }}
                        type="email"
                        value={contact?.email || ""}
                        onChange={(e) =>
                          handleContactChange(index, "email", e.target.value)
                        }
                        placeholder="이메일"
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <button
                        onClick={() => removeContact(index)}
                        className="px-4 py-2 bg-red-500 text-white text-xs md:text-sm rounded-md"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 비고 */}
              <div className="mb-2">
                <label className="block mb-1">비고</label>
                <textarea
                  placeholder="거래처의 유의사항 또는 담당자별 유의사항을 작성해주세요. 거래처 등록을 위해 최소 1명의 담당자를 설정해주세요."
                  value={currentCompany?.notes || ""}
                  onChange={(e) =>
                    setCurrentCompany({
                      ...currentCompany,
                      notes: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md min-h-52"
                ></textarea>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeAddModal}
                  className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
                    saving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  onClick={handleAddCompany}
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
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center mt-4 overflow-x-auto space-x-1 md:space-x-2">
        <div className="flex justify-center mt-4 space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
          >
            이전
          </button>

          {paginationNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(Number(page))}
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
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
          >
            다음
          </button>
        </div>
      </div>
      {/* 스낵바 */}
      <SnackbarComponent
        onClose={() => setSnackbarMessage("")}
        message={snackbarMessage}
      />
    </div>
    // <div className="text-sm text-[#37352F]">
    //   <p className="mb-4 font-semibold">거래처 검색</p>
    //   <div>
    //     {/* 검색란 */}
    //     <div className="bg-[#FBFBFB] rounded-md border-[1px] p-4 grid grid-cols-[1fr_1fr_1fr_1fr_0.5fr] gap-4">
    //       <div className="flex items-center justify-center">
    //         <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
    //           거래처명
    //         </label>
    //         <motion.input
    //           value={searchTerm}
    //           onChange={(e) => {
    //             setSearchTerm(e.target.value);
    //             setCurrentPage(1);
    //           }}
    //           onKeyDown={handleKeyPress} // 🔹 Enter 누르면 검색 실행
    //           placeholder="거래처명"
    //           className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
    //           whileFocus={{
    //             scale: 1.05, // 입력 시 약간 확대
    //             boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //           }}
    //         />
    //       </div>
    //       <div className="flex items-center justify-center">
    //         <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
    //           주소
    //         </label>
    //         <motion.input
    //           whileFocus={{
    //             scale: 1.05, // 입력 시 약간 확대
    //             boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //           }}
    //           value={addressTerm}
    //           onChange={(e) => {
    //             setAddressTerm(e.target.value);
    //             setCurrentPage(1);
    //           }}
    //           onKeyDown={handleKeyPress} // 🔹 Enter 누르면 검색 실행
    //           placeholder="주소"
    //           className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
    //         />
    //       </div>
    //       <div className="flex items-center justify-center">
    //         <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
    //           담당자
    //         </label>
    //         <motion.input
    //           whileFocus={{
    //             scale: 1.05, // 입력 시 약간 확대
    //             boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //           }}
    //           value={contactTerm}
    //           onChange={(e) => {
    //             setContactTerm(e.target.value);
    //             setCurrentPage(1);
    //           }}
    //           onKeyDown={handleKeyPress} // 🔹 Enter 누르면 검색 실행
    //           placeholder="담당자"
    //           className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
    //         />
    //       </div>
    //       {/* 나중에 업종해야함 */}
    //       <div className="flex items-center justify-center">
    //         <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
    //           업종
    //         </label>
    //         <select
    //           // onChange={(e) =>
    //           //   fetchCompaniesByIndustry(parseInt(e.target.value))
    //           // }
    //           className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
    //         >
    //           <option value="">업종 선택</option>
    //           {/* {industries.map((industry) => (
    //             <option key={industry.id} value={industry.id}>
    //               {industry.name}
    //             </option>
    //           ))} */}
    //         </select>
    //       </div>
    //       <div className="flex justify-end space-x-2">
    //         <button
    //           onClick={() => {
    //             setSearchTerm("");
    //             setAddressTerm("");
    //             setContactTerm("");
    //             setCurrentPage(1); // 페이지 초기화
    //           }}
    //           className="px-4 py-2 bg-gray-500 text-white rounded-md"
    //         >
    //           필터리셋
    //         </button>
    //       </div>
    //     </div>
    //   </div>

    //   <div>
    //     <div className="flex justify-between items-center my-4">
    //       <div className="flex">
    //         <div
    //           className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
    //           onClick={handleAdd}
    //         >
    //           <span className="mr-2">+</span>
    //           <span>추가</span>
    //         </div>
    //       </div>

    //       <div className="flex items-center">
    //         <label className="mr-2 text-sm text-gray-600">표시 개수:</label>
    //         <select
    //           value={companiesPerPage}
    //           onChange={(e) => {
    //             setCompaniesPerPage(Number(e.target.value));
    //             setCurrentPage(1); // ✅ 페이지 변경 시 첫 페이지로 이동
    //           }}
    //           className="border border-gray-300 p-2 rounded-md text-sm"
    //         >
    //           <option value="10">10개</option>
    //           <option value="20">20개</option>
    //           <option value="30">30개</option>
    //           <option value="50">50개</option>
    //         </select>
    //       </div>
    //     </div>
    //     <div className="bg-[#FBFBFB] rounded-md border">
    //       <table className="min-w-full table-auto border-collapse">
    //         <thead>
    //           <tr className="bg-gray-100 text-center">
    //             <th className="px-4 py-2 border-b border-r-[1px] w-1/6">
    //               거래처명
    //             </th>
    //             <th className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
    //               주소
    //             </th>
    //             {/* <th className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
    //               업종
    //             </th> */}
    //             <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
    //               담당자
    //             </th>
    //             <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
    //               번호
    //             </th>
    //             <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
    //               팩스
    //             </th>
    //             <th className="px-4 py-2 border-b border-r-[1px]">수정</th>
    //             <th className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
    //               삭제
    //             </th>
    //           </tr>
    //         </thead>
    //         <tbody>
    //           {companies?.map((company: any) => (
    //             <tr key={company.id} className="hover:bg-gray-100 text-center">
    //               <td
    //                 className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer "
    //                 onClick={() => router.push(`/consultations/${company.id}`)}
    //               >
    //                 {company.name}
    //               </td>
    //               <td className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
    //                 {company.address}
    //               </td>
    //               {/* <td className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
    //                 {company.industry?.join(", ")}
    //               </td> */}
    //               <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
    //                 {company.contact[0]?.contact_name} ..
    //               </td>
    //               <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
    //                 {company.phone}
    //               </td>
    //               <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
    //                 {company.fax}
    //               </td>
    //               <td
    //                 className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
    //                 onClick={() => handleEdit(company)}
    //               >
    //                 수정
    //               </td>
    //               <td
    //                 className="px-4 py-2 border-b border-r-[1px] text-red-500 cursor-pointer hidden md:table-cell"
    //                 onClick={() => handleDelete(company)}
    //               >
    //                 삭제
    //               </td>
    //             </tr>
    //           ))}
    //         </tbody>
    //       </table>
    //     </div>
    //   </div>

    //   {/* 모달 */}
    //   <AnimatePresence>
    //     {isModalOpen && currentCompany && (
    //       <motion.div
    //         className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50 px-2"
    //         initial={{ opacity: 0, scale: 1 }} // 시작 애니메이션
    //         animate={{ opacity: 1, scale: 1 }} // 나타나는 애니메이션
    //         exit={{ opacity: 0, scale: 1 }} // 사라질 때 애니메이션
    //         transition={{ duration: 0.3 }}
    //       >
    //         <div
    //           className="bg-white p-6 rounded-md
    //                 w-11/12 md:w-2/3
    //                 max-h-[75vh] md:max-h-[85vh]
    //                 overflow-y-auto"
    //         >
    //           <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">
    //             거래처 수정
    //           </h3>

    //           {/* 📌 반응형: 모바일 1열, 데스크톱 4열 */}
    //           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    //             <div className="mb-2">
    //               <label className="block mb-1">거래처명</label>
    //               <motion.input
    //                 whileFocus={{
    //                   scale: 1.05, // 입력 시 약간 확대
    //                   boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                 }}
    //                 type="text"
    //                 value={currentCompany.name || ""}
    //                 onChange={(e) =>
    //                   setCurrentCompany({
    //                     ...currentCompany,
    //                     name: e.target.value,
    //                   })
    //                 }
    //                 className="w-full p-2 border border-gray-300 rounded-md"
    //               />
    //             </div>
    //             <div className="mb-2">
    //               <label className="block mb-1">사업자 번호</label>
    //               <motion.input
    //                 placeholder="000-00-00000"
    //                 whileFocus={{
    //                   scale: 1.05, // 입력 시 약간 확대
    //                   boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                 }}
    //                 type="text"
    //                 value={currentCompany.business_number || ""}
    //                 onChange={(e) =>
    //                   setCurrentCompany({
    //                     ...currentCompany,
    //                     business_number: e.target.value,
    //                   })
    //                 }
    //                 className="w-full p-2 border border-gray-300 rounded-md"
    //               />
    //             </div>
    //             <div className="mb-2">
    //               <label className="block mb-1">이메일</label>
    //               <motion.input
    //                 placeholder="...@....com"
    //                 whileFocus={{
    //                   scale: 1.05, // 입력 시 약간 확대
    //                   boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                 }}
    //                 type="email"
    //                 value={currentCompany.email || ""}
    //                 onChange={(e) =>
    //                   setCurrentCompany({
    //                     ...currentCompany,
    //                     email: e.target.value,
    //                   })
    //                 }
    //                 className="w-full p-2 border border-gray-300 rounded-md"
    //               />
    //             </div>
    //             <div className="mb-2">
    //               <label className="block mb-1">택배/화물</label>
    //               <motion.input
    //                 whileFocus={{
    //                   scale: 1.05, // 입력 시 약간 확대
    //                   boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                 }}
    //                 placeholder="경동화물,대신화물,로젠택배, 직송 등.."
    //                 type="text"
    //                 value={currentCompany?.parcel || ""}
    //                 onChange={(e) =>
    //                   setCurrentCompany({
    //                     ...currentCompany,
    //                     parcel: e.target.value,
    //                   })
    //                 }
    //                 className="w-full p-2 border border-gray-300 rounded-md"
    //               />
    //             </div>
    //           </div>

    //           {/* 📌 반응형: 모바일은 1열, 데스크톱은 4열 */}
    //           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    //             <div className="mb-2">
    //               <label className="block mb-1">주소</label>
    //               <motion.input
    //                 whileFocus={{
    //                   scale: 1.05, // 입력 시 약간 확대
    //                   boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                 }}
    //                 type="text"
    //                 value={currentCompany.address || ""}
    //                 onChange={(e) =>
    //                   setCurrentCompany({
    //                     ...currentCompany,
    //                     address: e.target.value,
    //                   })
    //                 }
    //                 className="w-full p-2 border border-gray-300 rounded-md"
    //               />
    //             </div>
    //             <div className="mb-2">
    //               <label className="block mb-1">전화번호</label>
    //               <motion.input
    //                 whileFocus={{
    //                   scale: 1.05, // 입력 시 약간 확대
    //                   boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                 }}
    //                 type="text"
    //                 value={currentCompany.phone || ""}
    //                 onChange={(e) =>
    //                   setCurrentCompany({
    //                     ...currentCompany,
    //                     phone: e.target.value,
    //                   })
    //                 }
    //                 className="w-full p-2 border border-gray-300 rounded-md"
    //               />
    //             </div>
    //             <div className="mb-2">
    //               <label className="block mb-1">팩스</label>
    //               <motion.input
    //                 whileFocus={{
    //                   scale: 1.05, // 입력 시 약간 확대
    //                   boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                 }}
    //                 type="text"
    //                 value={currentCompany.fax || ""}
    //                 onChange={(e) =>
    //                   setCurrentCompany({
    //                     ...currentCompany,
    //                     fax: e.target.value,
    //                   })
    //                 }
    //                 className="w-full p-2 border border-gray-300 rounded-md"
    //               />
    //             </div>
    //           </div>

    //           {/* 담당자 목록 */}
    //           <div className="mb-4">
    //             <div className="flex justify-between items-center">
    //               <label className="block mb-1">담당자</label>
    //               <button
    //                 className="px-3 py-1 bg-gray-200 text-xs md:text-sm rounded-md hover:bg-gray-300"
    //                 onClick={addContact}
    //               >
    //                 + 추가
    //               </button>
    //             </div>

    //             {/* 📌 담당자 한 줄 표현 */}
    //             <div className="space-y-2">
    //               {(currentCompany?.contact || []).map((contact, index) => (
    //                 <div
    //                   key={index}
    //                   className="flex flex-wrap md:flex-nowrap gap-2"
    //                 >
    //                   <motion.input
    //                     whileFocus={{
    //                       scale: 1.05, // 입력 시 약간 확대
    //                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                     }}
    //                     type="text"
    //                     value={contact?.contact_name || ""}
    //                     onChange={(e) =>
    //                       handleContactChange(
    //                         index,
    //                         "contact_name",
    //                         e.target.value
    //                       )
    //                     }
    //                     placeholder="이름"
    //                     className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
    //                   />
    //                   <motion.input
    //                     whileFocus={{
    //                       scale: 1.05, // 입력 시 약간 확대
    //                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                     }}
    //                     type="text"
    //                     value={contact?.mobile || ""}
    //                     onChange={(e) =>
    //                       handleContactChange(index, "mobile", e.target.value)
    //                     }
    //                     placeholder="휴대폰"
    //                     className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
    //                   />
    //                   <motion.input
    //                     whileFocus={{
    //                       scale: 1.05, // 입력 시 약간 확대
    //                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                     }}
    //                     type="text"
    //                     value={contact?.department || ""}
    //                     onChange={(e) =>
    //                       handleContactChange(
    //                         index,
    //                         "department",
    //                         e.target.value
    //                       )
    //                     }
    //                     placeholder="부서"
    //                     className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
    //                   />
    //                   <motion.input
    //                     whileFocus={{
    //                       scale: 1.05, // 입력 시 약간 확대
    //                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                     }}
    //                     type="text"
    //                     value={contact?.level || ""}
    //                     onChange={(e) =>
    //                       handleContactChange(index, "level", e.target.value)
    //                     }
    //                     placeholder="직급"
    //                     className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
    //                   />
    //                   <motion.input
    //                     whileFocus={{
    //                       scale: 1.05, // 입력 시 약간 확대
    //                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                     }}
    //                     type="email"
    //                     value={contact?.email || ""}
    //                     onChange={(e) =>
    //                       handleContactChange(index, "email", e.target.value)
    //                     }
    //                     placeholder="이메일"
    //                     className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
    //                   />
    //                   <motion.label className="flex items-center space-x-2">
    //                     <motion.input
    //                       whileTap={{ scale: 0.9 }} // 클릭 시 약간 축소 효과
    //                       type="checkbox"
    //                       checked={contact?.resign || false}
    //                       onChange={(e) =>
    //                         handleContactChange(
    //                           index,
    //                           "resign",
    //                           e.target.checked
    //                         )
    //                       }
    //                       className="w-5 h-5 accent-blue-500 cursor-pointer"
    //                     />
    //                     <span className="text-gray-700">퇴사</span>
    //                   </motion.label>

    //                   <button
    //                     onClick={() => removeContact(index)}
    //                     className="px-4 py-2 bg-red-500 text-white text-xs md:text-sm rounded-md"
    //                   >
    //                     삭제
    //                   </button>
    //                 </div>
    //               ))}
    //             </div>
    //           </div>

    //           {/* 비고 */}
    //           <div className="mb-2">
    //             <label className="block mb-1">비고</label>
    //             <textarea
    //               placeholder="거래처의 유의사항 또는 담당자별 유의사항을 작성해주세요. 거래처 등록을 위해 최소 1명의 담당자를 설정해주세요."
    //               value={currentCompany.notes || ""}
    //               onChange={(e) =>
    //                 setCurrentCompany({
    //                   ...currentCompany,
    //                   notes: e.target.value,
    //                 })
    //               }
    //               className="w-full p-2 border border-gray-300 rounded-md min-h-52"
    //             ></textarea>
    //           </div>

    //           {/* 버튼 영역 */}
    //           <div className="flex justify-end space-x-2">
    //             <button
    //               onClick={closeModal}
    //               className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
    //                 saving ? "opacity-50 cursor-not-allowed" : ""
    //               }`}
    //               disabled={saving}
    //             >
    //               취소
    //             </button>
    //             <button
    //               onClick={handleSave}
    //               className={`bg-blue-500 text-white px-4 py-2 rounded-md text-xs md:text-sm flex items-center ${
    //                 saving ? "opacity-50 cursor-not-allowed" : ""
    //               }`}
    //               disabled={saving}
    //             >
    //               저장
    //               {saving && <CircularProgress size={18} className="ml-2" />}
    //             </button>
    //           </div>
    //         </div>
    //       </motion.div>
    //     )}
    //     {/* 삭제 확인 모달 */}

    //     {isDeleteModalOpen && companyToDelete && (
    //       <motion.div
    //         initial={{ opacity: 0, scale: 1 }} // 시작 애니메이션
    //         animate={{ opacity: 1, scale: 1 }} // 나타나는 애니메이션
    //         exit={{ opacity: 0, scale: 1 }} // 사라질 때 애니메이션
    //         transition={{ duration: 0.3 }}
    //         className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50"
    //       >
    //         <div className="bg-white p-6 rounded-md w-1/3">
    //           <h3 className="text-xl font-semibold mb-4">삭제 요청</h3>
    //           <textarea
    //             className="w-full border rounded-md p-4 h-48"
    //             placeholder="삭제 사유를 입력해주세요."
    //             onChange={(e) => setDeleteReason(e.target.value)}
    //           />

    //           <div className="flex justify-end space-x-4">
    //             <button
    //               onClick={cancelDelete}
    //               className="bg-gray-500 text-white px-4 py-2 rounded-md"
    //             >
    //               취소
    //             </button>
    //             <button
    //               onClick={confirmDelete}
    //               className="bg-red-500 text-white px-4 py-2 rounded-md"
    //             >
    //               삭제
    //             </button>
    //           </div>
    //         </div>
    //       </motion.div>
    //     )}

    //     {/* 추가 모달 */}
    //     {isAddModalOpen && (
    //       <motion.div
    //         initial={{ opacity: 0, scale: 1 }} // 시작 애니메이션
    //         animate={{ opacity: 1, scale: 1 }} // 나타나는 애니메이션
    //         exit={{ opacity: 0, scale: 1 }} // 사라질 때 애니메이션
    //         transition={{ duration: 0.3 }}
    //         className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50 px-2"
    //       >
    //         <div
    //           className="bg-white p-6 rounded-md
    //               w-11/12 md:w-2/3
    //               max-h-[75vh] md:max-h-[85vh]
    //               overflow-y-auto"
    //         >
    //           <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">
    //             거래처 추가
    //           </h3>

    //           {/* 📌 반응형: 모바일 2열, 데스크톱 4열 */}
    //           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    //             <div className="mb-2">
    //               <label className="block mb-1">거래처명</label>
    //               <motion.input
    //                 placeholder="우양신소재..."
    //                 whileFocus={{
    //                   scale: 1.05, // 입력 시 약간 확대
    //                   boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                 }}
    //                 type="text"
    //                 value={currentCompany?.name || ""}
    //                 onChange={(e) =>
    //                   setCurrentCompany({
    //                     ...currentCompany,
    //                     name: e.target.value,
    //                   })
    //                 }
    //                 className="w-full p-2 border border-gray-300 rounded-md"
    //               />
    //             </div>
    //             <div className="mb-2">
    //               <label className="block mb-1">사업자 번호</label>
    //               <motion.input
    //                 placeholder="000-00-00000"
    //                 whileFocus={{
    //                   scale: 1.05, // 입력 시 약간 확대
    //                   boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                 }}
    //                 type="text"
    //                 value={currentCompany?.business_number || ""}
    //                 onChange={(e) =>
    //                   setCurrentCompany({
    //                     ...currentCompany,
    //                     business_number: e.target.value,
    //                   })
    //                 }
    //                 className="w-full p-2 border border-gray-300 rounded-md"
    //               />
    //             </div>
    //             <div className="mb-2">
    //               <label className="block mb-1">이메일</label>
    //               <motion.input
    //                 whileFocus={{
    //                   scale: 1.05, // 입력 시 약간 확대
    //                   boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                 }}
    //                 placeholder="...@....com"
    //                 type="email"
    //                 value={currentCompany?.email || ""}
    //                 onChange={(e) =>
    //                   setCurrentCompany({
    //                     ...currentCompany,
    //                     email: e.target.value,
    //                   })
    //                 }
    //                 className="w-full p-2 border border-gray-300 rounded-md"
    //               />
    //             </div>
    //             <div className="mb-2">
    //               <label className="block mb-1">택배/화물</label>
    //               <motion.input
    //                 placeholder="경동화물,대신화물,로젠택배, 직송 등.."
    //                 whileFocus={{
    //                   scale: 1.05, // 입력 시 약간 확대
    //                   boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                 }}
    //                 type="text"
    //                 value={currentCompany?.parcel || ""}
    //                 onChange={(e) =>
    //                   setCurrentCompany({
    //                     ...currentCompany,
    //                     parcel: e.target.value,
    //                   })
    //                 }
    //                 className="w-full p-2 border border-gray-300 rounded-md"
    //               />
    //             </div>
    //           </div>

    //           {/* 📌 반응형: 모바일은 2열, 데스크톱은 4열 */}
    //           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    //             <div className="mb-2">
    //               <label className="block mb-1">주소</label>
    //               <motion.input
    //                 placeholder="첨단기업 3로 81.."
    //                 whileFocus={{
    //                   scale: 1.05, // 입력 시 약간 확대
    //                   boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                 }}
    //                 type="text"
    //                 value={currentCompany?.address || ""}
    //                 onChange={(e) =>
    //                   setCurrentCompany({
    //                     ...currentCompany,
    //                     address: e.target.value,
    //                   })
    //                 }
    //                 className="w-full p-2 border border-gray-300 rounded-md"
    //               />
    //             </div>
    //             <div className="mb-2">
    //               <label className="block mb-1">전화번호</label>
    //               <motion.input
    //                 placeholder="000-0000-0000"
    //                 whileFocus={{
    //                   scale: 1.05, // 입력 시 약간 확대
    //                   boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                 }}
    //                 type="text"
    //                 value={currentCompany?.phone || ""}
    //                 onChange={(e) =>
    //                   setCurrentCompany({
    //                     ...currentCompany,
    //                     phone: e.target.value,
    //                   })
    //                 }
    //                 className="w-full p-2 border border-gray-300 rounded-md"
    //               />
    //             </div>
    //             <div className="mb-2">
    //               <label className="block mb-1">팩스</label>
    //               <motion.input
    //                 placeholder="000-0000-0000"
    //                 whileFocus={{
    //                   scale: 1.05, // 입력 시 약간 확대
    //                   boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                 }}
    //                 type="text"
    //                 value={currentCompany?.fax || ""}
    //                 onChange={(e) =>
    //                   setCurrentCompany({
    //                     ...currentCompany,
    //                     fax: e.target.value,
    //                   })
    //                 }
    //                 className="w-full p-2 border border-gray-300 rounded-md"
    //               />
    //             </div>
    //           </div>

    //           {/* 담당자 목록 */}
    //           <div className="mb-4">
    //             <div className="flex justify-between items-center">
    //               <label className="block mb-1">담당자</label>
    //               <button
    //                 className="px-3 py-1 bg-gray-200 text-xs md:text-sm rounded-md hover:bg-gray-300"
    //                 onClick={addContact}
    //               >
    //                 + 추가
    //               </button>
    //             </div>

    //             {/* 📌 담당자 한 줄 표현 & 추가 버튼 클릭 시 맨 위로 */}
    //             <div className="space-y-2">
    //               {(currentCompany?.contact || []).map((contact, index) => (
    //                 <div
    //                   key={index}
    //                   className="flex flex-wrap md:flex-nowrap gap-2"
    //                 >
    //                   <motion.input
    //                     whileFocus={{
    //                       scale: 1.05, // 입력 시 약간 확대
    //                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                     }}
    //                     type="text"
    //                     value={contact?.contact_name || ""}
    //                     onChange={(e) =>
    //                       handleContactChange(
    //                         index,
    //                         "contact_name",
    //                         e.target.value
    //                       )
    //                     }
    //                     placeholder="이름"
    //                     className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
    //                   />
    //                   <motion.input
    //                     whileFocus={{
    //                       scale: 1.05, // 입력 시 약간 확대
    //                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                     }}
    //                     type="text"
    //                     value={contact?.level || ""}
    //                     onChange={(e) =>
    //                       handleContactChange(index, "level", e.target.value)
    //                     }
    //                     placeholder="직급"
    //                     className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
    //                   />
    //                   <motion.input
    //                     whileFocus={{
    //                       scale: 1.05, // 입력 시 약간 확대
    //                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                     }}
    //                     type="text"
    //                     value={contact?.department || ""}
    //                     onChange={(e) =>
    //                       handleContactChange(
    //                         index,
    //                         "department",
    //                         e.target.value
    //                       )
    //                     }
    //                     placeholder="부서"
    //                     className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
    //                   />
    //                   <motion.input
    //                     whileFocus={{
    //                       scale: 1.05, // 입력 시 약간 확대
    //                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                     }}
    //                     type="text"
    //                     value={contact?.mobile || ""}
    //                     onChange={(e) =>
    //                       handleContactChange(index, "mobile", e.target.value)
    //                     }
    //                     placeholder="휴대폰"
    //                     className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
    //                   />

    //                   <motion.input
    //                     whileFocus={{
    //                       scale: 1.05, // 입력 시 약간 확대
    //                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
    //                     }}
    //                     type="email"
    //                     value={contact?.email || ""}
    //                     onChange={(e) =>
    //                       handleContactChange(index, "email", e.target.value)
    //                     }
    //                     placeholder="이메일"
    //                     className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
    //                   />

    //                   <button
    //                     onClick={() => removeContact(index)}
    //                     className="px-4 py-2 bg-red-500 text-white text-xs md:text-sm rounded-md"
    //                   >
    //                     삭제
    //                   </button>
    //                 </div>
    //               ))}
    //             </div>
    //           </div>

    //           {/* 비고 */}
    //           <div className="mb-2">
    //             <label className="block mb-1">비고</label>
    //             <textarea
    //               placeholder="거래처의 유의사항 또는 담당자별 유의사항을 작성해주세요. 거래처 등록을 위해 최소 1명의 담당자를 설정해주세요."
    //               value={currentCompany?.notes || ""}
    //               onChange={(e) =>
    //                 setCurrentCompany({
    //                   ...currentCompany,
    //                   notes: e.target.value,
    //                 })
    //               }
    //               className="w-full p-2 border border-gray-300 rounded-md min-h-52"
    //             ></textarea>
    //           </div>

    //           {/* 버튼 영역 */}
    //           <div className="flex justify-end space-x-2">
    //             <button
    //               onClick={closeAddModal}
    //               className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
    //                 saving ? "opacity-50 cursor-not-allowed" : ""
    //               }`}
    //               disabled={saving}
    //             >
    //               취소
    //             </button>
    //             <button
    //               onClick={handleAddCompany}
    //               className={`bg-blue-500 text-white px-4 py-2 rounded-md text-xs md:text-sm flex items-center ${
    //                 saving ? "opacity-50 cursor-not-allowed" : ""
    //               }`}
    //               disabled={saving}
    //             >
    //               저장
    //               {saving && <CircularProgress size={18} className="ml-2" />}
    //             </button>
    //           </div>
    //         </div>
    //       </motion.div>
    //     )}
    //   </AnimatePresence>

    //   <div className="flex justify-center mt-4 overflow-x-auto space-x-1 md:space-x-2">
    //     <div className="flex justify-center mt-4 space-x-2">
    //       <button
    //         onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
    //         disabled={currentPage === 1}
    //         className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
    //       >
    //         이전
    //       </button>

    //       {paginationNumbers().map((page, index) => (
    //         <button
    //           key={index}
    //           onClick={() => setCurrentPage(Number(page))}
    //           className={`px-3 py-1 border rounded ${
    //             currentPage === page
    //               ? "bg-blue-500 text-white font-bold"
    //               : "bg-gray-50 text-gray-600 hover:bg-gray-200"
    //           }`}
    //         >
    //           {page}
    //         </button>
    //       ))}

    //       <button
    //         onClick={() =>
    //           setCurrentPage((prev) => Math.min(prev + 1, totalPages))
    //         }
    //         disabled={currentPage === totalPages}
    //         className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
    //       >
    //         다음
    //       </button>
    //     </div>
    //   </div>
    //   {/* 스낵바 */}

    //   <SnackbarComponent
    //     onClose={() => setSnackbarMessage("")}
    //     message={snackbarMessage}
    //   />
    // </div>
  );
}
