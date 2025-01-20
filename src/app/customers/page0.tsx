"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Snackbar, Alert } from "@mui/material"; // MUI Snackbar 임포트
import { useRouter } from "next/navigation";
import useDebounce from "@/utils/useDebounce";

interface Contact {
  name: string;
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
  const [companies, setCompanies] = useState<Company[]>([]); // 거래처 리스트
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]); // 필터링된 거래처 리스트
  const [searchTerm, setSearchTerm] = useState<string>(""); // 거래처 검색어
  const [addressTerm, setAddressTerm] = useState<string>(""); // 주소 검색어
  const [contactTerm, setContactTerm] = useState<string>(""); // 주소 검색어
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>(
    []
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 200); // 300ms 지연
  const debouncedAddressTerm = useDebounce(addressTerm, 200); // 300ms 지연

  const [page, setPage] = useState(1); // 페이지 상태
  const [loading, setLoading] = useState(false); // 로딩 상태
  const [hasMore, setHasMore] = useState(true); // 더 이상 데이터가 있는지 여부
  const router = useRouter();

  // 토스트 관련 상태
  const [openSnackbar, setOpenSnackbar] = useState(false); // 스낵바 상태
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

  // 최초 데이터 로딩: 처음 화면에 기본적으로 15개를 가져옴

  const fetchCompanies = async () => {
    setLoading(true);

    try {
      // 1. 기존 API에서 회사 기본 데이터 가져오기
      const response = await fetch(
        // `/api/companies?page=${page}&limit=15&name=${searchTerm}&address=${addressTerm}&contact=${contactTerm}`
        `/api/companies?name=${searchTerm}&address=${addressTerm}&contact=${contactTerm}`
      );
      const baseCompanies = await response.json();

      if (baseCompanies.length === 0) {
        setHasMore(false);
        setCompanies([]);
        setFilteredCompanies([]);
        setLoading(false);
        return;
      }

      // 2. Supabase에서 company_industries와 industries 데이터 가져오기
      const companyIds = baseCompanies.map((company: Company) => company.id); // 가져온 회사들의 ID 리스트
      const { data: industriesData, error } = await supabase
        .from("company_industries")
        .select(
          `
          company_id,
          industries (name)
        `
        )
        .in("company_id", companyIds); // 회사 ID에 맞는 관계만 가져옴

      if (error) {
        console.error("Error fetching industries data:", error);
        setLoading(false);
        return;
      }

      // 3. 업종 데이터를 회사 데이터에 병합
      const companiesWithIndustries = baseCompanies.map((company: Company) => {
        const relatedIndustries = industriesData
          .filter((relation) => relation.company_id === company.id)
          .map((relation: any) => relation.industries?.name);

        return {
          ...company,
          industry: relatedIndustries, // 업종 이름 배열 추가
        };
      });
      console.log("companiesWithIndustries", companiesWithIndustries);

      setCompanies(companiesWithIndustries);
      setFilteredCompanies(companiesWithIndustries);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching companies:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debouncedSearchTerm || debouncedAddressTerm) {
      fetchCompanies();
    }
  }, [page, searchTerm, addressTerm, contactTerm, debouncedSearchTerm]);

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
  }, []);

  // 스크롤 이벤트 핸들러
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // 스크롤이 바닥에 가까워지면 다음 페이지를 로드
    if (scrollTop + clientHeight >= scrollHeight - 10 && hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
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
  const handleEdit = async (company: Company) => {
    try {
      // 현재 회사의 industry를 name -> id로 변환
      const relatedIndustries = industries
        .filter((ind) => company.industry.includes(ind.name))
        .map((ind) => String(ind.id)); // id를 문자열로 변환

      setCurrentCompany({
        ...company,
        industry: relatedIndustries, // id 배열로 업데이트
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

  const handleContactChange = (
    index: number,
    field: keyof Contact,
    value: string
  ) => {
    const updatedContact = [...currentCompany.contact];
    updatedContact[index] = { ...updatedContact[index], [field]: value };
    setCurrentCompany({ ...currentCompany, contact: updatedContact });
  };

  const addContact = () => {
    setCurrentCompany({
      ...currentCompany,
      contact: [
        ...currentCompany.contact,
        { name: "", mobile: "", department: "", level: "", email: "" },
      ],
    });
  };

  const removeContact = (index: number) => {
    const updatedContact = [...currentCompany.contact];
    updatedContact.splice(index, 1);
    setCurrentCompany({ ...currentCompany, contact: updatedContact });
  };

  // 저장 버튼 클릭 시 업데이트
  const handleSave = async () => {
    if (!currentCompany.name || !currentCompany.contact.length) {
      setSnackbarMessage("필수 입력값을 모두 채워주세요.");
      setOpenSnackbar(true);
      return;
    }

    try {
      // 1. 회사 정보 업데이트
      const { data: updatedCompany, error } = await supabase
        .from("companies")
        .update({
          name: currentCompany.name,
          address: currentCompany.address,
          phone: currentCompany.phone,
          fax: currentCompany.fax,
          email: currentCompany.email,
          notes: currentCompany.notes,
          business_number: currentCompany.business_number,
          contact: currentCompany.contact,
          parcel: currentCompany.parcel,
        })
        .eq("id", currentCompany.id)
        .select();

      if (error) {
        throw error;
      }

      // 2. 기존 업종 관계 삭제
      await supabase
        .from("company_industries")
        .delete()
        .eq("company_id", currentCompany.id);

      // 3. 새로운 업종 관계 저장
      const industryRelations = currentCompany.industry.map((industryId) => ({
        company_id: currentCompany.id,
        industry_id: Number(industryId), // 숫자로 변환
      }));

      const { error: relationError } = await supabase
        .from("company_industries")
        .insert(industryRelations);

      if (relationError) {
        throw relationError;
      }

      // 4. 새로 저장된 업종 이름 가져오기
      const updatedIndustries = currentCompany.industry.map((industryId) => {
        const industry = industries.find(
          (ind) => String(ind.id) === String(industryId)
        );
        return industry ? industry.name : "";
      });

      // 5. 상태 업데이트
      const updatedCompanyWithIndustries = {
        ...updatedCompany[0],
        industry: updatedIndustries, // 업종 이름으로 변환
      };

      setCompanies((prevCompanies) =>
        prevCompanies.map((company) =>
          company.id === currentCompany.id
            ? updatedCompanyWithIndustries
            : company
        )
      );

      setFilteredCompanies((prevCompanies) =>
        prevCompanies.map((company) =>
          company.id === currentCompany.id
            ? updatedCompanyWithIndustries
            : company
        )
      );

      setSnackbarMessage("수정 완료");
      setOpenSnackbar(true);
      closeModal();
    } catch (error) {
      console.error("Error saving company:", error);
      setSnackbarMessage("수정 실패");
      setOpenSnackbar(true);
    }
  };

  // 삭제 버튼 클릭 시 삭제 요청 처리
  const handleDelete = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteModalOpen(true);
  };

  // 삭제 승인
  const confirmDelete = async () => {
    if (companyToDelete) {
      const { error } = await supabase.from("deletion_requests").insert([
        {
          type: "company",
          related_id: companyToDelete.id,
          status: "pending",
        },
      ]);

      if (error) {
        setSnackbarMessage("삭제 요청 실패");
        setOpenSnackbar(true);
      } else {
        setSnackbarMessage("삭제 요청 완료");
        setOpenSnackbar(true);
        setIsDeleteModalOpen(false);
        setPage(1);
      }
    }
  };

  // 삭제 모달 닫기
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCompanyToDelete(null);
  };

  // 삭제 모달에서 취소 클릭 시
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setCompanyToDelete(null);
  };

  // 추가 모달 닫기
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

  // 회사 추가 처리
  const handleAddCompany = async () => {
    if (!currentCompany.name || !currentCompany.contact.length) {
      setSnackbarMessage("필수 입력값을 모두 채워주세요.");
      setOpenSnackbar(true);
      return;
    }

    try {
      // 1. 회사 정보 추가
      const { data, error } = await supabase
        .from("companies")
        .insert([
          {
            name: currentCompany.name,
            address: currentCompany.address,
            phone: currentCompany.phone,
            fax: currentCompany.fax,
            email: currentCompany.email,
            notes: currentCompany.notes,
            business_number: currentCompany.business_number,
            contact: currentCompany.contact,
            parcel: currentCompany.parcel,
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      const companyId = data[0].id;

      // 2. 회사와 업종 관계 저장
      const industryRelations = currentCompany.industry.map((industryId) => ({
        company_id: companyId,
        industry_id: Number(industryId), // 숫자로 변환
      }));

      const { error: relationError } = await supabase
        .from("company_industries")
        .insert(industryRelations);

      if (relationError) {
        throw relationError;
      }

      // 3. 새로 추가된 회사의 업종 정보 포함하여 상태 업데이트
      const relatedIndustries = currentCompany.industry.map((industryId) => {
        const industry = industries.find(
          (ind) => String(ind.id) === String(industryId)
        );
        return industry ? industry.name : "";
      });

      const newCompany = {
        ...data[0],
        industry: relatedIndustries, // 업종 이름으로 표시
      };

      setCompanies((prevCompanies) => [newCompany, ...prevCompanies]);
      setFilteredCompanies((prevCompanies) => [newCompany, ...prevCompanies]);

      setSnackbarMessage("추가 완료");
      setOpenSnackbar(true);
      closeAddModal();
    } catch (error) {
      console.error("Error adding company:", error);
      setSnackbarMessage("추가 실패");
      setOpenSnackbar(true);
    }
  };

  const fetchCompaniesByIndustry = async (industryId: number) => {
    try {
      if (!industryId) {
        // 업종 선택 해제 시 전체 데이터를 다시 표시
        setFilteredCompanies(companies);
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

      setFilteredCompanies(filtered);
    } catch (error) {
      console.error("Error filtering companies by industry:", error);
    }
  };

  return (
    <div className="text-sm text-[#37352F]">
      <p className="mb-4">거래처 관리</p>
      <div>
        {/* 검색란 */}
        <div className="bg-[#FBFBFB] rounded-md border-[1px] h-20 px-4 py-3 grid grid-cols-3 items-center space-x-4">
          <div className="mb-4">
            <label className="block mb-1">거래처명</label>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="거래처명/거래처코드"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">주소</label>
            <input
              value={addressTerm}
              onChange={(e) => setAddressTerm(e.target.value)}
              placeholder="주소"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">업종</label>
            <select
              onChange={(e) =>
                fetchCompaniesByIndustry(parseInt(e.target.value))
              }
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">업종 선택</option>
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex mt-6">
        <div
          className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
          onClick={handleAdd}
        >
          <span className="mr-2">+</span>
          <span>추가</span>
        </div>
      </div>

      <div>
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2 border-b border-r-[1px]">
                  거래처 코드
                </th>
                <th className="px-4 py-2 border-b border-r-[1px]">거래처명</th>
                <th className="px-4 py-2 border-b border-r-[1px]">업종</th>
                <th className="px-4 py-2 border-b border-r-[1px]">
                  대표 담당자
                </th>
                <th className="px-4 py-2 border-b border-r-[1px]">주소</th>
                <th className="px-4 py-2 border-b border-r-[1px]">번호</th>
                <th className="px-4 py-2 border-b border-r-[1px]">택배/화물</th>
                <th className="px-4 py-2 border-b border-r-[1px]">수정</th>
                <th className="px-4 py-2 border-b border-r-[1px]">삭제</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies?.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {company.company_code}
                  </td>
                  <td
                    className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
                    onClick={() => router.push(`/consultations/${company.id}`)}
                  >
                    {company.name}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {company.industry?.join(", ")}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {company.contact &&
                      company.contact[0] &&
                      company.contact[0].name}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {company.address}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {company.phone}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {company.parcel}
                  </td>
                  <td
                    className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
                    onClick={() => handleEdit(company)}
                  >
                    수정
                  </td>
                  <td
                    className="px-4 py-2 border-b border-r-[1px] text-red-500 cursor-pointer"
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

      {/* 로딩 인디케이터 */}
      {loading && (
        <div className="text-center py-4">
          <span>로딩 중...</span>
        </div>
      )}

      {/* 모달 */}
      {isModalOpen && currentCompany && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md w-1/2">
            <h3 className="text-xl font-semibold mb-4">거래처 수정</h3>
            <div className="grid grid-cols-4 space-x-3">
              <div className="mb-2">
                <label className="block mb-1">거래처명</label>
                <input
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
                <input
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
                <input
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
                <label className="block mb-1">업종</label>

                <div className="flex flex-wrap gap-2">
                  {industries.map((industry) => {
                    // id 기반 선택 여부 확인
                    const isSelected = currentCompany.industry.includes(
                      String(industry.id)
                    );

                    return (
                      <span
                        key={industry.id}
                        onClick={() => {
                          const updatedIndustries = isSelected
                            ? currentCompany.industry.filter(
                                (id) => id !== String(industry.id)
                              ) // 선택 해제
                            : [...currentCompany.industry, String(industry.id)]; // 선택 추가

                          setCurrentCompany({
                            ...currentCompany,
                            industry: updatedIndustries,
                          });
                        }}
                        className={`cursor-pointer px-3 py-1 rounded-md ${
                          isSelected
                            ? "text-blue-500 font-bold"
                            : "text-gray-400"
                        }`}
                      >
                        {industry.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 space-x-3">
              <div className="mb-2">
                <label className="block mb-1">주소</label>
                <input
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
                <input
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
                <input
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
              <div className="mb-2">
                <label className="block mb-1">택배/화물</label>
                <input
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

            <div className="mb-4">
              <div className="flex justify-between items-center">
                <label className="block mb-1">담당자</label>
                <div className="flex">
                  <div
                    className="px-4 py-2 font-semibold cursor-pointer hover:bg-gray-50 hover:rounded-md text-xs"
                    onClick={addContact} // 모달 열기
                  >
                    <span className="mr-2">+</span>
                    <span>추가</span>
                  </div>
                </div>
              </div>

              {currentCompany?.contact.map((contact, index) => (
                <div key={index} className="mb-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) =>
                        handleContactChange(index, "name", e.target.value)
                      }
                      placeholder="이름"
                      className="p-2 border border-gray-300 rounded-md w-2/12"
                    />
                    <input
                      type="text"
                      value={contact.mobile}
                      onChange={(e) =>
                        handleContactChange(index, "mobile", e.target.value)
                      }
                      placeholder="휴대폰"
                      className="p-2 border border-gray-300 rounded-md w-2/12"
                    />
                    <input
                      type="text"
                      value={contact.department}
                      onChange={(e) =>
                        handleContactChange(index, "department", e.target.value)
                      }
                      placeholder="부서"
                      className="p-2 border border-gray-300 rounded-md w-2/12"
                    />
                    <input
                      type="text"
                      value={contact.level}
                      onChange={(e) =>
                        handleContactChange(index, "level", e.target.value)
                      }
                      placeholder="직급"
                      className="p-2 border border-gray-300 rounded-md w-2/12"
                    />
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) =>
                        handleContactChange(index, "email", e.target.value)
                      }
                      placeholder="이메일"
                      className="p-2 border border-gray-300 rounded-md w-3/12"
                    />
                    <button
                      onClick={() => removeContact(index)} // 삭제 함수
                      className="px-4 py-2 bg-red-500 text-white rounded-md cursor-pointer w-1/12"
                    >
                      삭제
                    </button>
                  </div>
                  {/* 담당자 삭제 버튼 */}
                </div>
              ))}
            </div>

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
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white px-4 py-2 rounded-md"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-500 text-white px-4 py-2 rounded-md"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && companyToDelete && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
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
        </div>
      )}

      {/* 추가 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md w-1/2">
            <h3 className="text-xl font-semibold mb-4">거래처 추가</h3>
            <div className="grid grid-cols-4 space-x-3">
              <div className="mb-2">
                <label className="block mb-1">거래처명</label>
                <input
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
                <input
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
                <input
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
                <label className="block mb-1">업종</label>

                <div className="flex flex-wrap gap-2">
                  {industries.map((industry) => (
                    <span
                      key={industry.id}
                      onClick={() => {
                        const isSelected = currentCompany.industry.includes(
                          String(industry.id)
                        );
                        const updatedIndustries = isSelected
                          ? currentCompany.industry.filter(
                              (id) => id !== String(industry.id)
                            ) // 선택 해제
                          : [...currentCompany.industry, String(industry.id)]; // 선택 추가

                        setCurrentCompany({
                          ...currentCompany,
                          industry: updatedIndustries,
                        });
                      }}
                      className={`cursor-pointer px-3 py-1 rounded-md ${
                        currentCompany.industry.includes(String(industry.id))
                          ? "text-blue-500 font-bold"
                          : "text-gray-400"
                      }`}
                    >
                      {industry.name}
                    </span>
                  ))}
                </div>

                {/* select로? */}
                {/* <input
                  type="text"
                  value={currentCompany?.email || ""}
                  onChange={(e) =>
                    setCurrentCompany({
                      ...currentCompany,
                      email: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                /> */}
              </div>
            </div>
            <div className="grid grid-cols-4 space-x-3">
              <div className="mb-2">
                <label className="block mb-1">주소</label>
                <input
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
                <input
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
                <input
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
              <div className="mb-2">
                <label className="block mb-1">택배/화물</label>
                <input
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

            <div className="mb-4">
              <div className="flex justify-between items-center">
                <label className="block mb-1">담당자</label>
                <div className="flex">
                  <div
                    className="px-4 py-2 font-semibold cursor-pointer hover:bg-gray-50 hover:rounded-md text-xs"
                    onClick={addContact} // 모달 열기
                  >
                    <span className="mr-2">+</span>
                    <span>추가</span>
                  </div>
                </div>
              </div>

              {currentCompany?.contact.map((contact, index) => (
                <div key={index} className="mb-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) =>
                        handleContactChange(index, "name", e.target.value)
                      }
                      placeholder="이름"
                      className="p-2 border border-gray-300 rounded-md w-2/12"
                    />
                    <input
                      type="text"
                      value={contact.mobile}
                      onChange={(e) =>
                        handleContactChange(index, "mobile", e.target.value)
                      }
                      placeholder="휴대폰"
                      className="p-2 border border-gray-300 rounded-md w-2/12"
                    />
                    <input
                      type="text"
                      value={contact.department}
                      onChange={(e) =>
                        handleContactChange(index, "department", e.target.value)
                      }
                      placeholder="부서"
                      className="p-2 border border-gray-300 rounded-md w-2/12"
                    />
                    <input
                      type="text"
                      value={contact.level}
                      onChange={(e) =>
                        handleContactChange(index, "level", e.target.value)
                      }
                      placeholder="직급"
                      className="p-2 border border-gray-300 rounded-md w-2/12"
                    />
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) =>
                        handleContactChange(index, "email", e.target.value)
                      }
                      placeholder="이메일"
                      className="p-2 border border-gray-300 rounded-md w-3/12"
                    />
                    <button
                      onClick={() => removeContact(index)} // 삭제 함수
                      className="px-4 py-2 bg-red-500 text-white rounded-md cursor-pointer w-1/12"
                    >
                      삭제
                    </button>
                  </div>
                  {/* 담당자 삭제 버튼 */}
                </div>
              ))}
            </div>
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
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeAddModal}
                className="bg-gray-500 text-white px-4 py-2 rounded-md"
              >
                취소
              </button>
              <button
                onClick={handleAddCompany}
                className="bg-blue-500 text-white px-4 py-2 rounded-md"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 스낵바 */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{
          vertical: "bottom", // 하단
          horizontal: "right", // 오른쪽
        }}
      >
        <Alert severity="success">{snackbarMessage}</Alert>
      </Snackbar>
    </div>
  );
}
