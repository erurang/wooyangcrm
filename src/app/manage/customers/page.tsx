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

interface Contact {
  contact_name: string;
  mobile: string;
  department: string;
  level: string;
  email: string;
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
  const [searchTerm, setSearchTerm] = useState<string>(""); // 거래처 검색어
  const [addressTerm, setAddressTerm] = useState<string>(""); // 주소 검색어
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>(
    []
  );
  const [saving, setSaving] = useState(false); // 🔹 저장 로딩 상태 추가

  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 상태
  const [totalPages, setTotalPages] = useState(1); // 총 페이지 수
  const companiesPerPage = 10; // 페이지당 거래처 수
  const [contactTerm, setContactTerm] = useState<string>(""); // 주소 검색어

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

  useEffect(() => {
    const fetchIndustries = async () => {
      const { data, error } = await supabase
        .from("industries")
        .select("id, name");
      if (error) {
        console.error("Failed to fetch industries:", error);
      } else {
        console.log("data", data);
        setIndustries(data || []);
      }
    };
    fetchIndustries();
  }, [currentPage]);

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
        { contact_name: "", mobile: "", department: "", level: "", email: "" },
        ...(currentCompany?.contact || []),
      ],
    });
  };

  // ui 담당자 수정
  const handleContactChange = (
    index: number,
    field: keyof Contact,
    value: string
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
    if (companyToDelete) {
      try {
        // 1️⃣ 해당 회사의 contacts 삭제
        await supabase
          .from("contacts")
          .delete()
          .eq("company_id", companyToDelete.id);

        // 2️⃣ 회사 삭제 요청 추가
        const { error } = await supabase.from("deletion_requests").insert([
          {
            type: "company",
            related_id: companyToDelete.id,
            status: "pending",
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
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCompanyToDelete(null);
  };
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
      <p className="mb-4 font-semibold">거래처 관리</p>
      <div>
        {/* 검색란 */}
        {/* <div className="bg-[#FBFBFB] rounded-md border-[1px] h-20 px-4 py-3 grid grid-cols-5 marker:items-center space-x-4"> */}
        <div className="bg-[#FBFBFB] rounded-md border-[1px] p-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="flex items-center justify-center">
            <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
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
              className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
              whileFocus={{
                scale: 1.05, // 입력 시 약간 확대
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
              }}
            />
          </div>
          <div className="flex items-center justify-center">
            <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
              주소
            </label>
            <motion.input
              whileFocus={{
                scale: 1.05, // 입력 시 약간 확대
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
              }}
              value={addressTerm}
              onChange={(e) => {
                setAddressTerm(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={handleKeyPress} // 🔹 Enter 누르면 검색 실행
              placeholder="주소"
              className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
            />
          </div>
          <div className="flex items-center justify-center">
            <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
              담당자
            </label>
            <motion.input
              whileFocus={{
                scale: 1.05, // 입력 시 약간 확대
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
              }}
              value={contactTerm}
              onChange={(e) => {
                setContactTerm(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={handleKeyPress} // 🔹 Enter 누르면 검색 실행
              placeholder="담당자"
              className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
            />
          </div>
          {/* 나중에 업종해야함 */}
          <div className="flex items-center justify-center">
            <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
              업종
            </label>
            <select
              // onChange={(e) =>
              //   fetchCompaniesByIndustry(parseInt(e.target.value))
              // }
              className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
            >
              <option value="">업종 선택</option>
              {/* {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))} */}
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setSearchTerm("");
                setAddressTerm("");
                setContactTerm("");
                setCurrentPage(1); // 페이지 초기화
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md"
            >
              필터리셋
            </button>
            {/* <button
              onClick={() => {
                setCurrentPage(1); // 페이지 번호 초기화
              }} // 검색 버튼 클릭 시 호출
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              검색
            </button> */}
          </div>
        </div>
      </div>

      <div className="flex my-4">
        <div
          className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
          onClick={handleAdd}
        >
          <span className="mr-2">+</span>
          <span>추가</span>
        </div>
      </div>

      <div>
        <div className="bg-[#FBFBFB] rounded-md border">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 text-center">
                <th className="px-4 py-2 border-b border-r-[1px]">거래처명</th>
                <th className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
                  주소
                </th>
                {/* <th className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
                  업종
                </th> */}
                <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                  대표 담당자
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                  번호
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                  택배/화물
                </th>
                <th className="px-4 py-2 border-b border-r-[1px]">수정</th>
                <th className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
                  삭제
                </th>
              </tr>
            </thead>
            <tbody>
              {companies?.map((company: any) => (
                <tr key={company.id} className="hover:bg-gray-100 text-center">
                  <td
                    className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer "
                    onClick={() => router.push(`/consultations/${company.id}`)}
                  >
                    {company.name}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
                    {company.address}
                  </td>
                  {/* <td className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
                    {company.industry?.join(", ")}
                  </td> */}
                  <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                    {company.contact[0]?.contact_name}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                    {company.phone}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                    {company.parcel}
                  </td>
                  <td
                    className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
                    onClick={() => handleEdit(company)}
                  >
                    수정
                  </td>
                  <td
                    className="px-4 py-2 border-b border-r-[1px] text-red-500 cursor-pointer hidden md:table-cell"
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
            initial={{ opacity: 0, scale: 1 }} // 시작 애니메이션
            animate={{ opacity: 1, scale: 1 }} // 나타나는 애니메이션
            exit={{ opacity: 0, scale: 1 }} // 사라질 때 애니메이션
            transition={{ duration: 0.3 }}
          >
            <div
              className="bg-white p-6 rounded-md 
                    w-11/12 md:w-2/3 
                    max-h-[75vh] md:max-h-[85vh] 
                    overflow-y-auto"
            >
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">
                거래처 수정
              </h3>

              {/* 📌 반응형: 모바일 1열, 데스크톱 4열 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="mb-2">
                  <label className="block mb-1">거래처명</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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

              {/* 📌 반응형: 모바일은 1열, 데스크톱은 4열 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="mb-2">
                  <label className="block mb-1">주소</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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

                {/* 📌 담당자 한 줄 표현 */}
                <div className="space-y-2">
                  {(currentCompany?.contact || []).map((contact, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap md:flex-nowrap gap-2"
                    >
                      <motion.input
                        whileFocus={{
                          scale: 1.05, // 입력 시 약간 확대
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                          scale: 1.05, // 입력 시 약간 확대
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                          scale: 1.05, // 입력 시 약간 확대
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                          scale: 1.05, // 입력 시 약간 확대
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                          scale: 1.05, // 입력 시 약간 확대
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                  value={currentCompany.notes || ""}
                  onChange={(e) =>
                    setCurrentCompany({
                      ...currentCompany,
                      notes: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
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
            initial={{ opacity: 0, scale: 1 }} // 시작 애니메이션
            animate={{ opacity: 1, scale: 1 }} // 나타나는 애니메이션
            exit={{ opacity: 0, scale: 1 }} // 사라질 때 애니메이션
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50"
          >
            <div className="bg-white p-6 rounded-md w-1/3">
              <h3 className="text-xl font-semibold mb-4">삭제 확인</h3>
              <p>정말로 이 거래처를 삭제하시겠습니까?</p>
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
            initial={{ opacity: 0, scale: 1 }} // 시작 애니메이션
            animate={{ opacity: 1, scale: 1 }} // 나타나는 애니메이션
            exit={{ opacity: 0, scale: 1 }} // 사라질 때 애니메이션
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50 px-2"
          >
            <div
              className="bg-white p-6 rounded-md 
                  w-11/12 md:w-2/3 
                  max-h-[75vh] md:max-h-[85vh] 
                  overflow-y-auto"
            >
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">
                거래처 추가
              </h3>

              {/* 📌 반응형: 모바일 2열, 데스크톱 4열 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="mb-2">
                  <label className="block mb-1">거래처명</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                    }}
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
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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

              {/* 📌 반응형: 모바일은 2열, 데스크톱은 4열 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="mb-2">
                  <label className="block mb-1">주소</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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

                {/* 📌 담당자 한 줄 표현 & 추가 버튼 클릭 시 맨 위로 */}
                <div className="space-y-2">
                  {(currentCompany?.contact || []).map((contact, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap md:flex-nowrap gap-2"
                    >
                      <motion.input
                        whileFocus={{
                          scale: 1.05, // 입력 시 약간 확대
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                          scale: 1.05, // 입력 시 약간 확대
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                          scale: 1.05, // 입력 시 약간 확대
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                          scale: 1.05, // 입력 시 약간 확대
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                          scale: 1.05, // 입력 시 약간 확대
                          boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
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
                  value={currentCompany?.notes || ""}
                  onChange={(e) =>
                    setCurrentCompany({
                      ...currentCompany,
                      notes: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
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
  );
}

// //test
// "use client";

// import { AnimatePresence, motion } from "framer-motion";
// import { useState, useEffect, useCallback } from "react";
// import { supabase } from "@/lib/supabaseClient";
// import { CircularProgress } from "@mui/material"; // MUI Snackbar 임포트
// import { useRouter } from "next/navigation";
// import SnackbarComponent from "@/components/Snackbar";

// interface Contact {
//   contact_name: string;
//   mobile: string;
//   department: string;
//   level: string;
//   email: string;
// }

// interface Company {
//   id: string;
//   company_code: string;
//   name: string;
//   business_number: string;
//   address: string;
//   industry: string[]; // 업종을 배열로 저장
//   phone: string;
//   fax: string;
//   email: string;
//   notes: string;
//   contact: Contact[]; // 연락처 배열 추가
//   parcel: string;
// }

// export default function Page() {
//   const [companies, setCompanies] = useState<Company[]>([]); // 거래처 리스트
//   const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]); // 필터링된 거래처 리스트
//   const [searchTerm, setSearchTerm] = useState<string>(""); // 거래처 검색어
//   const [addressTerm, setAddressTerm] = useState<string>(""); // 주소 검색어
//   const [industries, setIndustries] = useState<{ id: number; name: string }[]>(
//     []
//   );
//   const [saving, setSaving] = useState(false); // 🔹 저장 로딩 상태 추가

//   const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 상태
//   const [totalPages, setTotalPages] = useState(1); // 총 페이지 수
//   const companiesPerPage = 10; // 페이지당 거래처 수
//   const [contactTerm, setContactTerm] = useState<string>(""); // 주소 검색어

//   const [loading, setLoading] = useState(false); // 로딩 상태
//   const router = useRouter();

//   // 토스트 관련 상태
//   const [openSnackbar, setOpenSnackbar] = useState(false); // 스낵바 상태
//   const [snackbarMessage, setSnackbarMessage] = useState<string>(""); // 스낵바 메시지

//   // 모달 관련 상태
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false); // 추가 모달 상태
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // 삭제 모달 상태
//   const [currentCompany, setCurrentCompany] = useState<Company>({
//     id: "", // id 필드 반드시 문자열로 초기화
//     company_code: "", // 빈 문자열로 초기화
//     name: "",
//     business_number: "",
//     address: "",
//     industry: [], // 업종을 비워둠
//     phone: "",
//     fax: "",
//     email: "",
//     notes: "",
//     contact: [], // 기본값은 빈 배열
//     parcel: "",
//   }); // 현재 거래처 정보

//   const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null); // 삭제할 거래처 정보

//   // 최초 데이터 로딩: 처음 화면에 기본적으로 15개를 가져옴

//   const paginationNumbers = () => {
//     let pageNumbers = [];
//     for (let i = 1; i <= totalPages; i++) {
//       if (
//         i === 1 ||
//         i === totalPages ||
//         (i >= currentPage - 2 && i <= currentPage + 2)
//       ) {
//         pageNumbers.push(i);
//       } else if (i === currentPage - 3 || i === currentPage + 3) {
//         pageNumbers.push("...");
//       }
//     }
//     return pageNumbers;
//   };

//   const fetchCompanies = useCallback(
//     async (pageNumber: number) => {
//       setLoading(true);

//       try {
//         let companyIds: string[] = [];

//         // 🔹 담당자 검색어가 있을 경우 `contacts` 테이블에서 검색하여 `company_id` 가져오기
//         if (contactTerm.trim()) {
//           const { data: contactCompanies, error: contactError } = await supabase
//             .from("contacts")
//             .select("company_id")
//             .ilike("contact_name", `%${contactTerm}%`);

//           if (contactError) {
//             console.error("Error fetching contacts:", contactError);
//             setLoading(false);
//             return;
//           }

//           companyIds = contactCompanies.map((c) => c.company_id);

//           if (companyIds.length === 0) {
//             setCompanies([]);
//             setFilteredCompanies([]);
//             setLoading(false);
//             return;
//           }
//         }

//         // 🔹 `companies` 테이블에서 검색
//         const response = await fetch(
//           `/api/companies?page=${pageNumber}&limit=${companiesPerPage}&name=${searchTerm}&address=${addressTerm}&companyIds=${companyIds.join(
//             ","
//           )}`
//         );

//         const { companies: baseCompanies, total } = await response.json();

//         const calculatedTotalPages = Math.ceil(total / companiesPerPage);
//         setTotalPages(calculatedTotalPages);

//         if (baseCompanies?.length === 0) {
//           setCompanies([]);
//           setFilteredCompanies([]);
//           setLoading(false);
//           return;
//         }

//         // 🔹 기존 contacts 관련 로직 유지
//         const companyIdsToFetch = baseCompanies?.map(
//           (company: Company) => company.id
//         );

//         const { data: contactsData, error: contactsError } = await supabase
//           .from("contacts")
//           .select("company_id, contact_name, mobile, department, level, email")
//           .in("company_id", companyIdsToFetch);

//         if (contactsError) {
//           console.error("Error fetching contacts:", contactsError);
//           setLoading(false);
//           return;
//         }

//         // 🔹 `company_id`를 기준으로 `contacts`를 그룹화
//         const contactsByCompany = companyIdsToFetch.reduce(
//           (acc: any, companyId: any) => {
//             acc[companyId] = contactsData.filter(
//               (contact) => contact.company_id === companyId
//             );
//             return acc;
//           },
//           {} as Record<string, Contact[]>
//         );

//         // 🔹 `companies` 데이터와 `contacts` 병합
//         const formattedCompanies = baseCompanies.map((company: Company) => ({
//           ...company,
//           contact: contactsByCompany[company.id] || [], // `contacts`가 없으면 빈 배열 설정
//         }));

//         setCompanies(formattedCompanies);
//         setFilteredCompanies(formattedCompanies);
//         setLoading(false);
//       } catch (error) {
//         console.error("Error fetching companies:", error);
//         setLoading(false);
//       }
//     },
//     [loading, searchTerm, addressTerm, contactTerm]
//   );

//   useEffect(() => {
//     const fetchIndustries = async () => {
//       const { data, error } = await supabase
//         .from("industries")
//         .select("id, name");
//       if (error) {
//         console.error("Failed to fetch industries:", error);
//       } else {
//         console.log("data", data);
//         setIndustries(data || []);
//       }
//     };
//     fetchCompanies(currentPage);
//     fetchIndustries();
//   }, [currentPage]);

//   useEffect(() => {
//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (event.key === "Escape") {
//         if (isModalOpen) closeModal();
//         if (isAddModalOpen) closeAddModal();
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => {
//       window.removeEventListener("keydown", handleKeyDown);
//     };
//   }, [isModalOpen, isAddModalOpen]);

//   const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
//     if (event.key === "Enter") {
//       setCurrentPage(1); // 1페이지로 이동
//       fetchCompanies(1); // 검색 실행
//     }
//   };

//   // 추가 버튼 클릭 시 모달 열기
//   const handleAdd = () => {
//     setCurrentCompany({
//       id: "",
//       company_code: "",
//       name: "",
//       business_number: "",
//       address: "",
//       industry: [], // 업종은 기본적으로 빈 배열
//       phone: "",
//       fax: "",
//       email: "",
//       notes: "",
//       contact: [],
//       parcel: "",
//     });
//     setIsAddModalOpen(true); // 추가 모달 열기
//   };

//   // 수정 버튼 클릭 시 모달 열기
//   const handleEdit = (company: Company) => {
//     try {
//       const relatedIndustries = industries
//         .filter((ind) => (company.industry ?? []).includes(ind.name))
//         .map((ind) => String(ind.id));

//       setCurrentCompany({
//         ...company,
//         industry: relatedIndustries,
//         contact: company.contact || [], // 🚀 contacts가 없으면 빈 배열을 설정
//       });

//       setIsModalOpen(true);
//     } catch (error) {
//       console.error("Error in handleEdit:", error);
//     }
//   };

//   // 모달 닫기
//   const closeModal = () => {
//     setIsModalOpen(false);
//     setCurrentCompany({
//       id: "", // id 필드 반드시 문자열로 초기화
//       company_code: "", // 빈 문자열로 초기화
//       name: "",
//       business_number: "",
//       address: "",
//       industry: [], // 업종을 비워둠
//       phone: "",
//       fax: "",
//       email: "",
//       notes: "",
//       contact: [],
//       parcel: "",
//     });
//   };

//   const handleContactChange = (
//     index: number,
//     field: keyof Contact,
//     value: string
//   ) => {
//     setCurrentCompany((prev) => {
//       const updatedContact = [...prev.contact];
//       updatedContact[index] = { ...updatedContact[index], [field]: value };
//       return { ...prev, contact: updatedContact };
//     });
//   };

//   const addContact = () => {
//     setCurrentCompany({
//       ...currentCompany,
//       contact: [
//         { contact_name: "", mobile: "", department: "", level: "", email: "" },
//         ...(currentCompany?.contact || []),
//       ],
//     });
//   };

//   const removeContact = (index: number) => {
//     const updatedContact = [...currentCompany.contact];
//     updatedContact.splice(index, 1);
//     setCurrentCompany({ ...currentCompany, contact: updatedContact });
//   };

//   // 저장 버튼 클릭 시 업데이트
//   const handleSave = async () => {
//     if (!currentCompany.name || !currentCompany.contact.length) {
//       setSnackbarMessage("필수 입력값을 모두 채워주세요.");
//       setOpenSnackbar(true);
//       return;
//     }

//     setSaving(true); // 🔹 저장 시작 → 로딩 활성화

//     try {
//       // 🔹 기존 연락처 데이터 가져오기
//       const { data: existingContacts, error: contactsFetchError } =
//         await supabase
//           .from("contacts")
//           .select("id, contact_name, mobile, department, level, email")
//           .eq("company_id", currentCompany.id);

//       if (contactsFetchError) throw contactsFetchError;

//       const existingContactsMap = new Map(
//         existingContacts.map((c) => [
//           `${c.contact_name}-${c.mobile}-${c.email}`,
//           c.id,
//         ])
//       );

//       // 🔹 새로운 연락처 리스트 (consultation_id를 `null`로 설정)
//       const newContacts = currentCompany.contact.map((contact) => ({
//         company_id: currentCompany.id,
//         contact_name: contact.contact_name,
//         mobile: contact.mobile,
//         department: contact.department,
//         level: contact.level,
//         email: contact.email,
//       }));

//       const newContactsMap = new Map(
//         newContacts.map((c) => [`${c.contact_name}-${c.mobile}-${c.email}`, c])
//       );

//       // 🔹 삭제해야 할 기존 연락처
//       const contactsToDelete = existingContacts.filter(
//         (c) => !newContactsMap.has(`${c.contact_name}-${c.mobile}-${c.email}`)
//       );

//       // 🔹 추가해야 할 새로운 연락처
//       const contactsToAdd = newContacts.filter(
//         (c) =>
//           !existingContactsMap.has(`${c.contact_name}-${c.mobile}-${c.email}`)
//       );

//       // 🔹 연락처 삭제
//       if (contactsToDelete.length > 0) {
//         await supabase
//           .from("contacts")
//           .delete()
//           .in(
//             "id",
//             contactsToDelete.map((c) => c.id)
//           );
//       }

//       // 🔹 연락처 추가 (`consultation_id = null` 설정 포함)
//       if (contactsToAdd.length > 0) {
//         await supabase.from("contacts").insert(contactsToAdd);
//       }

//       // 🔹 회사 정보 업데이트
//       const { data: updatedCompany, error } = await supabase
//         .from("companies")
//         .update({
//           name: currentCompany.name,
//           address: currentCompany.address,
//           phone: currentCompany.phone,
//           fax: currentCompany.fax,
//           email: currentCompany.email,
//           notes: currentCompany.notes,
//           business_number: currentCompany.business_number,
//           parcel: currentCompany.parcel,
//         })
//         .eq("id", currentCompany.id)
//         .select();

//       if (error) throw error;

//       // 🔹 업데이트된 연락처 가져오기
//       const { data: updatedContacts, error: updatedContactsError } =
//         await supabase
//           .from("contacts")
//           .select("company_id, contact_name, mobile, department, level, email")
//           .eq("company_id", currentCompany.id);

//       if (updatedContactsError) throw updatedContactsError;

//       // 🔹 업데이트된 회사 객체 생성하여 리스트 반영
//       const updatedCompanyWithContacts = {
//         ...updatedCompany[0],
//         contact: updatedContacts || [],
//       };

//       setCompanies((prevCompanies) =>
//         prevCompanies.map((company) =>
//           company.id === currentCompany.id
//             ? updatedCompanyWithContacts
//             : company
//         )
//       );

//       setFilteredCompanies((prevCompanies) =>
//         prevCompanies.map((company) =>
//           company.id === currentCompany.id
//             ? updatedCompanyWithContacts
//             : company
//         )
//       );

//       setSnackbarMessage("수정 완료");
//       setOpenSnackbar(true);
//       closeModal();
//     } catch (error) {
//       console.error("Error saving company:", error);
//       setSnackbarMessage("수정 실패");
//       setOpenSnackbar(true);
//     } finally {
//       setSaving(false); // 🔹 저장 완료 → 로딩 해제
//     }
//   };

//   // 삭제 버튼 클릭 시 삭제 요청 처리
//   const handleDelete = (company: Company) => {
//     setCompanyToDelete(company);
//     setIsDeleteModalOpen(true);
//   };

//   // 삭제 승인
//   const confirmDelete = async () => {
//     if (companyToDelete) {
//       try {
//         // 1️⃣ 해당 회사의 contacts 삭제
//         await supabase
//           .from("contacts")
//           .delete()
//           .eq("company_id", companyToDelete.id);

//         // 2️⃣ 회사 삭제 요청 추가
//         const { error } = await supabase.from("deletion_requests").insert([
//           {
//             type: "company",
//             related_id: companyToDelete.id,
//             status: "pending",
//           },
//         ]);

//         if (error) throw error;

//         setSnackbarMessage("삭제 요청 완료");
//         setOpenSnackbar(true);
//         setIsDeleteModalOpen(false);
//         setCurrentPage(1);
//       } catch (error) {
//         console.error("Error deleting company:", error);
//         setSnackbarMessage("삭제 요청 실패");
//         setOpenSnackbar(true);
//       }
//     }
//   };

//   // 삭제 모달 닫기
//   const closeDeleteModal = () => {
//     setIsDeleteModalOpen(false);
//     setCompanyToDelete(null);
//   };

//   // 삭제 모달에서 취소 클릭 시
//   const cancelDelete = () => {
//     setIsDeleteModalOpen(false);
//     setCompanyToDelete(null);
//   };

//   // 추가 모달 닫기
//   const closeAddModal = () => {
//     setIsAddModalOpen(false);
//     setCurrentCompany({
//       id: "", // id 필드 반드시 문자열로 초기화
//       company_code: "", // 빈 문자열로 초기화
//       name: "",
//       business_number: "",
//       address: "",
//       industry: [], // 업종을 비워둠
//       phone: "",
//       fax: "",
//       email: "",
//       notes: "",
//       contact: [],
//       parcel: "",
//     });
//   };

//   // 회사 추가 처리
//   const handleAddCompany = async () => {
//     if (!currentCompany.name || !currentCompany.contact.length) {
//       setSnackbarMessage("필수 입력값을 모두 채워주세요.");
//       setOpenSnackbar(true);
//       return;
//     }

//     setSaving(true); // 🔹 저장 시작 → 로딩 활성화

//     try {
//       // 🔹 Step 1: 동일한 이름의 회사가 존재하는지 확인
//       const { data: existingCompanies, error: existingCompaniesError } =
//         await supabase
//           .from("companies")
//           .select("id")
//           .eq("name", currentCompany.name);

//       if (existingCompaniesError) throw existingCompaniesError;

//       // 🔹 Step 2: 동일한 이름의 회사가 있으면 추가하지 않고 경고 메시지 출력
//       if (existingCompanies.length > 0) {
//         setSnackbarMessage("⚠️ 이미 존재하는 회사입니다.");
//         setOpenSnackbar(true);
//         setSaving(false);
//         return;
//       }

//       // 🔹 Step 3: `companies` 테이블에 새로운 회사 추가
//       const { data: companyData, error: companyError } = await supabase
//         .from("companies")
//         .insert([
//           {
//             name: currentCompany.name,
//             address: currentCompany.address,
//             phone: currentCompany.phone,
//             fax: currentCompany.fax,
//             email: currentCompany.email,
//             notes: currentCompany.notes,
//             business_number: currentCompany.business_number,
//             parcel: currentCompany.parcel,
//           },
//         ])
//         .select()
//         .single();

//       if (companyError || !companyData) {
//         throw new Error("거래처 추가 실패");
//       }

//       const companyId = companyData.id; // 🔥 생성된 거래처 ID

//       // 🔹 Step 4: `contacts` 테이블에 추가 (`consultation_id`를 NULL로 설정)
//       const newContacts = currentCompany.contact.map((contact) => ({
//         company_id: companyId,
//         contact_name: contact.contact_name,
//         mobile: contact.mobile,
//         department: contact.department,
//         level: contact.level,
//         email: contact.email,
//       }));

//       if (newContacts.length > 0) {
//         await supabase.from("contacts").insert(newContacts);
//       }

//       // 🔹 Step 5: 추가된 회사 정보를 가져와 리스트 업데이트
//       const { data: contactsData, error: contactsError } = await supabase
//         .from("contacts")
//         .select("company_id, contact_name, mobile, department, level, email")
//         .eq("company_id", companyId);

//       if (contactsError) throw contactsError;

//       const newCompany = {
//         ...companyData,
//         contact: contactsData || [],
//       };

//       setCompanies((prevCompanies) => [newCompany, ...prevCompanies]);
//       setFilteredCompanies((prevCompanies) => [newCompany, ...prevCompanies]);

//       setSnackbarMessage("✅ 거래처 추가 완료");
//       setOpenSnackbar(true);
//       closeAddModal();
//     } catch (error) {
//       console.error("Error adding company:", error);
//       setSnackbarMessage("❌ 거래처 추가 실패");
//       setOpenSnackbar(true);
//     } finally {
//       setSaving(false); // 🔹 저장 완료 → 로딩 해제
//     }
//   };

//   const fetchCompaniesByIndustry = async (industryId: number) => {
//     try {
//       if (!industryId) {
//         // 업종 선택 해제 시 전체 데이터를 다시 표시
//         setFilteredCompanies(companies);
//         return;
//       }

//       // 업종 ID에 따라 필터링된 회사 데이터 가져오기
//       const { data, error } = await supabase
//         .from("company_industries")
//         .select(
//           `
//           company_id,
//           companies (
//             id,
//             company_code,
//             name,
//             address,
//             phone,
//             fax,
//             email,
//             notes,
//             parcel,
//             contact,
//             created_at
//           ),
//           industries (name)
//         `
//         )
//         .eq("industry_id", industryId);

//       if (error) {
//         console.error("Failed to fetch companies by industry:", error);
//         return;
//       }

//       // 필터링된 데이터를 처리
//       const filtered = data.map((relation: any) => {
//         const company = relation.companies;
//         const industryName = relation.industries?.name || ""; // 업종 이름 가져오기

//         return {
//           ...company,
//           industry: [industryName], // 업종 이름 배열로 설정
//         };
//       });

//       setFilteredCompanies(filtered);
//     } catch (error) {
//       console.error("Error filtering companies by industry:", error);
//     }
//   };

//   return (
//     <div className="text-sm text-[#37352F]">
//       <p className="mb-4 font-semibold">거래처 관리</p>
//       <div>
//         {/* 검색란 */}
//         {/* <div className="bg-[#FBFBFB] rounded-md border-[1px] h-20 px-4 py-3 grid grid-cols-5 marker:items-center space-x-4"> */}
//         <div className="bg-[#FBFBFB] rounded-md border-[1px] p-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
//           <div className="flex items-center justify-center">
//             <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
//               거래처명
//             </label>
//             <motion.input
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               onKeyDown={handleKeyPress} // 🔹 Enter 누르면 검색 실행
//               placeholder="거래처명"
//               className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
//               whileFocus={{
//                 scale: 1.05, // 입력 시 약간 확대
//                 boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//               }}
//             />
//           </div>
//           <div className="flex items-center justify-center">
//             <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
//               주소
//             </label>
//             <motion.input
//               whileFocus={{
//                 scale: 1.05, // 입력 시 약간 확대
//                 boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//               }}
//               value={addressTerm}
//               onChange={(e) => setAddressTerm(e.target.value)}
//               onKeyDown={handleKeyPress} // 🔹 Enter 누르면 검색 실행
//               placeholder="주소"
//               className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
//             />
//           </div>
//           <div className="flex items-center justify-center">
//             <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
//               담당자
//             </label>
//             <motion.input
//               whileFocus={{
//                 scale: 1.05, // 입력 시 약간 확대
//                 boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//               }}
//               value={contactTerm}
//               onChange={(e) => setContactTerm(e.target.value)}
//               onKeyDown={handleKeyPress} // 🔹 Enter 누르면 검색 실행
//               placeholder="담당자"
//               className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
//             />
//           </div>
//           {/* 나중에 업종해야함 */}
//           <div className="flex items-center justify-center">
//             <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
//               업종
//             </label>
//             <select
//               // onChange={(e) =>
//               //   fetchCompaniesByIndustry(parseInt(e.target.value))
//               // }
//               className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
//             >
//               <option value="">업종 선택</option>
//               {/* {industries.map((industry) => (
//                 <option key={industry.id} value={industry.id}>
//                   {industry.name}
//                 </option>
//               ))} */}
//             </select>
//           </div>
//           <div className="flex justify-end space-x-2">
//             <button
//               onClick={() => {
//                 setSearchTerm("");
//                 setAddressTerm("");
//                 setContactTerm("");
//                 setCurrentPage(1); // 페이지 초기화
//                 fetchCompanies(1); // 🔹 검색 필터 리셋 후 다시 데이터 가져오기
//               }}
//               className="px-4 py-2 bg-gray-500 text-white rounded-md"
//             >
//               필터리셋
//             </button>
//             <button
//               onClick={() => {
//                 setCurrentPage(1); // 페이지 번호 초기화
//                 fetchCompanies(1); // 첫 페이지 데이터를 다시 가져옴
//               }} // 검색 버튼 클릭 시 호출
//               className="px-4 py-2 bg-blue-500 text-white rounded-md"
//             >
//               검색
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="flex mt-6">
//         <div
//           className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
//           onClick={handleAdd}
//         >
//           <span className="mr-2">+</span>
//           <span>추가</span>
//         </div>
//       </div>

//       <div>
//         <div className="bg-[#FBFBFB] rounded-md border">
//           <table className="min-w-full table-auto border-collapse">
//             <thead>
//               <tr className="bg-gray-100 text-left">
//                 <th className="px-4 py-2 border-b border-r-[1px]">거래처명</th>
//                 <th className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
//                   주소
//                 </th>
//                 {/* <th className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
//                   업종
//                 </th> */}
//                 <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
//                   대표 담당자
//                 </th>
//                 <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
//                   번호
//                 </th>
//                 <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
//                   택배/화물
//                 </th>
//                 <th className="px-4 py-2 border-b border-r-[1px]">수정</th>
//                 <th className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
//                   삭제
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredCompanies?.map((company) => (
//                 <tr key={company.id} className="hover:bg-gray-100">
//                   <td
//                     className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
//                     onClick={() => router.push(`/consultations/${company.id}`)}
//                   >
//                     {company.name}
//                   </td>
//                   <td className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
//                     {company.address}
//                   </td>
//                   {/* <td className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
//                     {company.industry?.join(", ")}
//                   </td> */}
//                   <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
//                     {company.contact[0]?.contact_name}
//                   </td>
//                   <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
//                     {company.phone}
//                   </td>
//                   <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
//                     {company.parcel}
//                   </td>
//                   <td
//                     className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
//                     onClick={() => handleEdit(company)}
//                   >
//                     수정
//                   </td>
//                   <td
//                     className="px-4 py-2 border-b border-r-[1px] text-red-500 cursor-pointer hidden md:table-cell"
//                     onClick={() => handleDelete(company)}
//                   >
//                     삭제
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* 모달 */}
//       <AnimatePresence>
//         {isModalOpen && currentCompany && (
//           <motion.div
//             className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50 px-2"
//             initial={{ opacity: 0, scale: 1 }} // 시작 애니메이션
//             animate={{ opacity: 1, scale: 1 }} // 나타나는 애니메이션
//             exit={{ opacity: 0, scale: 1 }} // 사라질 때 애니메이션
//             transition={{ duration: 0.3 }}
//           >
//             <div
//               className="bg-white p-6 rounded-md
//                     w-11/12 md:w-2/3
//                     max-h-[75vh] md:max-h-[85vh]
//                     overflow-y-auto"
//             >
//               <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">
//                 거래처 수정
//               </h3>

//               {/* 📌 반응형: 모바일 1열, 데스크톱 4열 */}
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                 <div className="mb-2">
//                   <label className="block mb-1">거래처명</label>
//                   <motion.input
//                     whileFocus={{
//                       scale: 1.05, // 입력 시 약간 확대
//                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                     }}
//                     type="text"
//                     value={currentCompany.name || ""}
//                     onChange={(e) =>
//                       setCurrentCompany({
//                         ...currentCompany,
//                         name: e.target.value,
//                       })
//                     }
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                   />
//                 </div>
//                 <div className="mb-2">
//                   <label className="block mb-1">사업자 번호</label>
//                   <motion.input
//                     whileFocus={{
//                       scale: 1.05, // 입력 시 약간 확대
//                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                     }}
//                     type="text"
//                     value={currentCompany.business_number || ""}
//                     onChange={(e) =>
//                       setCurrentCompany({
//                         ...currentCompany,
//                         business_number: e.target.value,
//                       })
//                     }
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                   />
//                 </div>
//                 <div className="mb-2">
//                   <label className="block mb-1">이메일</label>
//                   <motion.input
//                     whileFocus={{
//                       scale: 1.05, // 입력 시 약간 확대
//                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                     }}
//                     type="email"
//                     value={currentCompany.email || ""}
//                     onChange={(e) =>
//                       setCurrentCompany({
//                         ...currentCompany,
//                         email: e.target.value,
//                       })
//                     }
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                   />
//                 </div>
//                 <div className="mb-2">
//                   <label className="block mb-1">택배/화물</label>
//                   <motion.input
//                     whileFocus={{
//                       scale: 1.05, // 입력 시 약간 확대
//                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                     }}
//                     type="text"
//                     value={currentCompany?.parcel || ""}
//                     onChange={(e) =>
//                       setCurrentCompany({
//                         ...currentCompany,
//                         parcel: e.target.value,
//                       })
//                     }
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                   />
//                 </div>
//               </div>

//               {/* 📌 반응형: 모바일은 1열, 데스크톱은 4열 */}
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                 <div className="mb-2">
//                   <label className="block mb-1">주소</label>
//                   <motion.input
//                     whileFocus={{
//                       scale: 1.05, // 입력 시 약간 확대
//                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                     }}
//                     type="text"
//                     value={currentCompany.address || ""}
//                     onChange={(e) =>
//                       setCurrentCompany({
//                         ...currentCompany,
//                         address: e.target.value,
//                       })
//                     }
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                   />
//                 </div>
//                 <div className="mb-2">
//                   <label className="block mb-1">전화번호</label>
//                   <motion.input
//                     whileFocus={{
//                       scale: 1.05, // 입력 시 약간 확대
//                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                     }}
//                     type="text"
//                     value={currentCompany.phone || ""}
//                     onChange={(e) =>
//                       setCurrentCompany({
//                         ...currentCompany,
//                         phone: e.target.value,
//                       })
//                     }
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                   />
//                 </div>
//                 <div className="mb-2">
//                   <label className="block mb-1">팩스</label>
//                   <motion.input
//                     whileFocus={{
//                       scale: 1.05, // 입력 시 약간 확대
//                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                     }}
//                     type="text"
//                     value={currentCompany.fax || ""}
//                     onChange={(e) =>
//                       setCurrentCompany({
//                         ...currentCompany,
//                         fax: e.target.value,
//                       })
//                     }
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                   />
//                 </div>
//               </div>

//               {/* 담당자 목록 */}
//               <div className="mb-4">
//                 <div className="flex justify-between items-center">
//                   <label className="block mb-1">담당자</label>
//                   <button
//                     className="px-3 py-1 bg-gray-200 text-xs md:text-sm rounded-md hover:bg-gray-300"
//                     onClick={addContact}
//                   >
//                     + 추가
//                   </button>
//                 </div>

//                 {/* 📌 담당자 한 줄 표현 */}
//                 <div className="space-y-2">
//                   {(currentCompany?.contact || []).map((contact, index) => (
//                     <div
//                       key={index}
//                       className="flex flex-wrap md:flex-nowrap gap-2"
//                     >
//                       <motion.input
//                         whileFocus={{
//                           scale: 1.05, // 입력 시 약간 확대
//                           boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                         }}
//                         type="text"
//                         value={contact?.contact_name || ""}
//                         onChange={(e) =>
//                           handleContactChange(
//                             index,
//                             "contact_name",
//                             e.target.value
//                           )
//                         }
//                         placeholder="이름"
//                         className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
//                       />
//                       <motion.input
//                         whileFocus={{
//                           scale: 1.05, // 입력 시 약간 확대
//                           boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                         }}
//                         type="text"
//                         value={contact?.mobile || ""}
//                         onChange={(e) =>
//                           handleContactChange(index, "mobile", e.target.value)
//                         }
//                         placeholder="휴대폰"
//                         className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
//                       />
//                       <motion.input
//                         whileFocus={{
//                           scale: 1.05, // 입력 시 약간 확대
//                           boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                         }}
//                         type="text"
//                         value={contact?.department || ""}
//                         onChange={(e) =>
//                           handleContactChange(
//                             index,
//                             "department",
//                             e.target.value
//                           )
//                         }
//                         placeholder="부서"
//                         className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
//                       />
//                       <motion.input
//                         whileFocus={{
//                           scale: 1.05, // 입력 시 약간 확대
//                           boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                         }}
//                         type="text"
//                         value={contact?.level || ""}
//                         onChange={(e) =>
//                           handleContactChange(index, "level", e.target.value)
//                         }
//                         placeholder="직급"
//                         className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
//                       />
//                       <motion.input
//                         whileFocus={{
//                           scale: 1.05, // 입력 시 약간 확대
//                           boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                         }}
//                         type="email"
//                         value={contact?.email || ""}
//                         onChange={(e) =>
//                           handleContactChange(index, "email", e.target.value)
//                         }
//                         placeholder="이메일"
//                         className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
//                       />
//                       <button
//                         onClick={() => removeContact(index)}
//                         className="px-4 py-2 bg-red-500 text-white text-xs md:text-sm rounded-md"
//                       >
//                         삭제
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* 비고 */}
//               <div className="mb-2">
//                 <label className="block mb-1">비고</label>
//                 <textarea
//                   value={currentCompany.notes || ""}
//                   onChange={(e) =>
//                     setCurrentCompany({
//                       ...currentCompany,
//                       notes: e.target.value,
//                     })
//                   }
//                   className="w-full p-2 border border-gray-300 rounded-md"
//                 ></textarea>
//               </div>

//               {/* 버튼 영역 */}
//               <div className="flex justify-end space-x-2">
//                 <button
//                   onClick={closeModal}
//                   className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
//                     saving ? "opacity-50 cursor-not-allowed" : ""
//                   }`}
//                   disabled={saving}
//                 >
//                   취소
//                 </button>
//                 <button
//                   onClick={handleSave}
//                   className={`bg-blue-500 text-white px-4 py-2 rounded-md text-xs md:text-sm flex items-center ${
//                     saving ? "opacity-50 cursor-not-allowed" : ""
//                   }`}
//                   disabled={saving}
//                 >
//                   저장
//                   {saving && <CircularProgress size={18} className="ml-2" />}
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         )}
//         {/* 삭제 확인 모달 */}

//         {isDeleteModalOpen && companyToDelete && (
//           <motion.div
//             initial={{ opacity: 0, scale: 1 }} // 시작 애니메이션
//             animate={{ opacity: 1, scale: 1 }} // 나타나는 애니메이션
//             exit={{ opacity: 0, scale: 1 }} // 사라질 때 애니메이션
//             transition={{ duration: 0.3 }}
//             className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50"
//           >
//             <div className="bg-white p-6 rounded-md w-1/3">
//               <h3 className="text-xl font-semibold mb-4">삭제 확인</h3>
//               <p>정말로 이 거래처를 삭제하시겠습니까?</p>
//               <div className="flex justify-end space-x-4">
//                 <button
//                   onClick={cancelDelete}
//                   className="bg-gray-500 text-white px-4 py-2 rounded-md"
//                 >
//                   취소
//                 </button>
//                 <button
//                   onClick={confirmDelete}
//                   className="bg-red-500 text-white px-4 py-2 rounded-md"
//                 >
//                   삭제
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         )}

//         {/* 추가 모달 */}
//         {isAddModalOpen && (
//           <motion.div
//             initial={{ opacity: 0, scale: 1 }} // 시작 애니메이션
//             animate={{ opacity: 1, scale: 1 }} // 나타나는 애니메이션
//             exit={{ opacity: 0, scale: 1 }} // 사라질 때 애니메이션
//             transition={{ duration: 0.3 }}
//             className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50 px-2"
//           >
//             <div
//               className="bg-white p-6 rounded-md
//                   w-11/12 md:w-2/3
//                   max-h-[75vh] md:max-h-[85vh]
//                   overflow-y-auto"
//             >
//               <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">
//                 거래처 추가
//               </h3>

//               {/* 📌 반응형: 모바일 2열, 데스크톱 4열 */}
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                 <div className="mb-2">
//                   <label className="block mb-1">거래처명</label>
//                   <motion.input
//                     whileFocus={{
//                       scale: 1.05, // 입력 시 약간 확대
//                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                     }}
//                     type="text"
//                     value={currentCompany?.name || ""}
//                     onChange={(e) =>
//                       setCurrentCompany({
//                         ...currentCompany,
//                         name: e.target.value,
//                       })
//                     }
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                   />
//                 </div>
//                 <div className="mb-2">
//                   <label className="block mb-1">사업자 번호</label>
//                   <motion.input
//                     whileFocus={{
//                       scale: 1.05, // 입력 시 약간 확대
//                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                     }}
//                     type="text"
//                     value={currentCompany?.business_number || ""}
//                     onChange={(e) =>
//                       setCurrentCompany({
//                         ...currentCompany,
//                         business_number: e.target.value,
//                       })
//                     }
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                   />
//                 </div>
//                 <div className="mb-2">
//                   <label className="block mb-1">이메일</label>
//                   <motion.input
//                     whileFocus={{
//                       scale: 1.05, // 입력 시 약간 확대
//                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                     }}
//                     type="email"
//                     value={currentCompany?.email || ""}
//                     onChange={(e) =>
//                       setCurrentCompany({
//                         ...currentCompany,
//                         email: e.target.value,
//                       })
//                     }
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                   />
//                 </div>
//                 <div className="mb-2">
//                   <label className="block mb-1">택배/화물</label>
//                   <motion.input
//                     whileFocus={{
//                       scale: 1.05, // 입력 시 약간 확대
//                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                     }}
//                     type="text"
//                     value={currentCompany?.parcel || ""}
//                     onChange={(e) =>
//                       setCurrentCompany({
//                         ...currentCompany,
//                         parcel: e.target.value,
//                       })
//                     }
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                   />
//                 </div>
//               </div>

//               {/* 📌 반응형: 모바일은 2열, 데스크톱은 4열 */}
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                 <div className="mb-2">
//                   <label className="block mb-1">주소</label>
//                   <motion.input
//                     whileFocus={{
//                       scale: 1.05, // 입력 시 약간 확대
//                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                     }}
//                     type="text"
//                     value={currentCompany?.address || ""}
//                     onChange={(e) =>
//                       setCurrentCompany({
//                         ...currentCompany,
//                         address: e.target.value,
//                       })
//                     }
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                   />
//                 </div>
//                 <div className="mb-2">
//                   <label className="block mb-1">전화번호</label>
//                   <motion.input
//                     whileFocus={{
//                       scale: 1.05, // 입력 시 약간 확대
//                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                     }}
//                     type="text"
//                     value={currentCompany?.phone || ""}
//                     onChange={(e) =>
//                       setCurrentCompany({
//                         ...currentCompany,
//                         phone: e.target.value,
//                       })
//                     }
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                   />
//                 </div>
//                 <div className="mb-2">
//                   <label className="block mb-1">팩스</label>
//                   <motion.input
//                     whileFocus={{
//                       scale: 1.05, // 입력 시 약간 확대
//                       boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                     }}
//                     type="text"
//                     value={currentCompany?.fax || ""}
//                     onChange={(e) =>
//                       setCurrentCompany({
//                         ...currentCompany,
//                         fax: e.target.value,
//                       })
//                     }
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                   />
//                 </div>
//               </div>

//               {/* 담당자 목록 */}
//               <div className="mb-4">
//                 <div className="flex justify-between items-center">
//                   <label className="block mb-1">담당자</label>
//                   <button
//                     className="px-3 py-1 bg-gray-200 text-xs md:text-sm rounded-md hover:bg-gray-300"
//                     onClick={addContact}
//                   >
//                     + 추가
//                   </button>
//                 </div>

//                 {/* 📌 담당자 한 줄 표현 & 추가 버튼 클릭 시 맨 위로 */}
//                 <div className="space-y-2">
//                   {(currentCompany?.contact || []).map((contact, index) => (
//                     <div
//                       key={index}
//                       className="flex flex-wrap md:flex-nowrap gap-2"
//                     >
//                       <motion.input
//                         whileFocus={{
//                           scale: 1.05, // 입력 시 약간 확대
//                           boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                         }}
//                         type="text"
//                         value={contact?.contact_name || ""}
//                         onChange={(e) =>
//                           handleContactChange(
//                             index,
//                             "contact_name",
//                             e.target.value
//                           )
//                         }
//                         placeholder="이름"
//                         className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
//                       />
//                       <motion.input
//                         whileFocus={{
//                           scale: 1.05, // 입력 시 약간 확대
//                           boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                         }}
//                         type="text"
//                         value={contact?.mobile || ""}
//                         onChange={(e) =>
//                           handleContactChange(index, "mobile", e.target.value)
//                         }
//                         placeholder="휴대폰"
//                         className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
//                       />
//                       <motion.input
//                         whileFocus={{
//                           scale: 1.05, // 입력 시 약간 확대
//                           boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                         }}
//                         type="text"
//                         value={contact?.department || ""}
//                         onChange={(e) =>
//                           handleContactChange(
//                             index,
//                             "department",
//                             e.target.value
//                           )
//                         }
//                         placeholder="부서"
//                         className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
//                       />
//                       <motion.input
//                         whileFocus={{
//                           scale: 1.05, // 입력 시 약간 확대
//                           boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                         }}
//                         type="text"
//                         value={contact?.level || ""}
//                         onChange={(e) =>
//                           handleContactChange(index, "level", e.target.value)
//                         }
//                         placeholder="직급"
//                         className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
//                       />
//                       <motion.input
//                         whileFocus={{
//                           scale: 1.05, // 입력 시 약간 확대
//                           boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
//                         }}
//                         type="email"
//                         value={contact?.email || ""}
//                         onChange={(e) =>
//                           handleContactChange(index, "email", e.target.value)
//                         }
//                         placeholder="이메일"
//                         className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
//                       />
//                       <button
//                         onClick={() => removeContact(index)}
//                         className="px-4 py-2 bg-red-500 text-white text-xs md:text-sm rounded-md"
//                       >
//                         삭제
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* 비고 */}
//               <div className="mb-2">
//                 <label className="block mb-1">비고</label>
//                 <textarea
//                   value={currentCompany?.notes || ""}
//                   onChange={(e) =>
//                     setCurrentCompany({
//                       ...currentCompany,
//                       notes: e.target.value,
//                     })
//                   }
//                   className="w-full p-2 border border-gray-300 rounded-md"
//                 ></textarea>
//               </div>

//               {/* 버튼 영역 */}
//               <div className="flex justify-end space-x-2">
//                 <button
//                   onClick={closeAddModal}
//                   className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
//                     saving ? "opacity-50 cursor-not-allowed" : ""
//                   }`}
//                   disabled={saving}
//                 >
//                   취소
//                 </button>
//                 <button
//                   onClick={handleAddCompany}
//                   className={`bg-blue-500 text-white px-4 py-2 rounded-md text-xs md:text-sm flex items-center ${
//                     saving ? "opacity-50 cursor-not-allowed" : ""
//                   }`}
//                   disabled={saving}
//                 >
//                   저장
//                   {saving && <CircularProgress size={18} className="ml-2" />}
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <div className="flex justify-center mt-4 overflow-x-auto space-x-1 md:space-x-2">
//         <div className="flex justify-center mt-4 space-x-2">
//           <button
//             onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//             disabled={currentPage === 1}
//             className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
//           >
//             이전
//           </button>

//           {paginationNumbers().map((page, index) => (
//             <button
//               key={index}
//               onClick={() => setCurrentPage(Number(page))}
//               className={`px-3 py-1 border rounded ${
//                 currentPage === page
//                   ? "bg-blue-500 text-white font-bold"
//                   : "bg-gray-50 text-gray-600 hover:bg-gray-200"
//               }`}
//             >
//               {page}
//             </button>
//           ))}

//           <button
//             onClick={() =>
//               setCurrentPage((prev) => Math.min(prev + 1, totalPages))
//             }
//             disabled={currentPage === totalPages}
//             className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
//           >
//             다음
//           </button>
//         </div>
//       </div>
//       {/* 스낵바 */}

//       <SnackbarComponent
//         onClose={() => setSnackbarMessage("")}
//         message={snackbarMessage}
//       />
//     </div>
//   );
// }
