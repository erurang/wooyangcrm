"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Snackbar, Alert } from "@mui/material"; // MUI Snackbar 임포트
import { useRouter } from "next/navigation";

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
}

export default function Page() {
  const [companies, setCompanies] = useState<Company[]>([]); // 거래처 리스트
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]); // 필터링된 거래처 리스트
  const [searchTerm, setSearchTerm] = useState<string>(""); // 거래처 검색어
  const [addressTerm, setAddressTerm] = useState<string>(""); // 주소 검색어
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
  }); // 현재 거래처 정보

  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null); // 삭제할 거래처 정보

  // 최초 데이터 로딩: 처음 화면에 기본적으로 15개를 가져옴
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      const response = await fetch(
        `/api/companies?page=${page}&limit=15&name=${searchTerm}&address=${addressTerm}`
      );
      const data = await response.json();
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setCompanies(data);
        setFilteredCompanies(data);
      }
      setLoading(false);
    };

    fetchCompanies();
  }, [page, searchTerm, addressTerm]);

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
    });
    setIsAddModalOpen(true); // 추가 모달 열기
  };

  // 수정 버튼 클릭 시 모달 열기
  const handleEdit = (company: Company) => {
    setCurrentCompany(company);
    setIsModalOpen(true);
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
    if (currentCompany) {
      const { error } = await supabase
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
        })
        .eq("id", currentCompany.id);

      if (error) {
        setSnackbarMessage("수정 실패");
        setOpenSnackbar(true);
      } else {
        setSnackbarMessage("수정 완료");
        setOpenSnackbar(true);

        // 수정된 회사 데이터를 companies 배열에서 찾아 업데이트
        setCompanies((prevCompanies) => {
          return prevCompanies.map((company) =>
            company.id === currentCompany.id
              ? { ...company, ...currentCompany }
              : company
          );
        });

        // 필터링된 회사 데이터도 갱신
        setFilteredCompanies((prevCompanies) => {
          return prevCompanies.map((company) =>
            company.id === currentCompany.id
              ? { ...company, ...currentCompany }
              : company
          );
        });

        closeModal(); // 수정 후 모달 닫기
        setPage(1); // 페이지 리셋하여 다시 데이터 로드
      }
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
    });
  };

  // 회사 추가 처리
  const handleAddCompany = async () => {
    // 필수 입력값 확인
    if (!currentCompany.name) {
      setSnackbarMessage("필수 입력값을 모두 채워주세요.");
      setOpenSnackbar(true);
      return;
    }

    // 회사 추가 API 호출
    if (currentCompany) {
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
          },
        ])
        .select();

      if (error) {
        setSnackbarMessage("추가 실패");
        setOpenSnackbar(true);
      } else {
        setSnackbarMessage("추가 완료");
        setOpenSnackbar(true);

        console.log("추가완료,", data);
        // 추가된 회사 데이터를 companies 배열에 추가
        const addedCurrentCompany = {
          ...currentCompany,
          company_code: data[0].company_code,
        };

        setCompanies((prevCompanies) => [
          ...prevCompanies,
          addedCurrentCompany,
        ]);

        // 필터링된 회사 데이터도 갱신
        setFilteredCompanies((prevCompanies) => [
          ...prevCompanies,
          addedCurrentCompany,
        ]);

        closeAddModal(); // 추가 후 모달 닫기
        setPage(1); // 페이지 리셋하여 다시 데이터 로드
      }
    }
  };

  return (
    <div className="text-sm text-[#37352F]">
      <p className="mb-4">거래처 관리</p>
      <div>
        {/* 검색란 */}
        <div className="bg-[#FBFBFB] rounded-md border-[1px] h-20 px-4 py-3 grid grid-cols-3 items-center space-x-4">
          <div className="flex border-[1px] rounded-md ">
            <div className="p-2 border-r-[1px]">
              <span>거래처명</span>
            </div>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="거래처명/거래처코드"
              className="pl-2"
            />
          </div>
          <div className="flex border-[1px] rounded-md ">
            <div className="p-2 border-r-[1px]">
              <span>주소</span>
            </div>
            <input
              value={addressTerm}
              onChange={(e) => setAddressTerm(e.target.value)}
              placeholder="주소"
              className="pl-2"
            />
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
                <th className="px-4 py-2 border-b border-r-[1px]">No.</th>
                <th className="px-4 py-2 border-b border-r-[1px]">
                  거래처 코드
                </th>
                <th className="px-4 py-2 border-b border-r-[1px]">거래처명</th>
                <th className="px-4 py-2 border-b border-r-[1px]">
                  대표 담당자
                </th>
                <th className="px-4 py-2 border-b border-r-[1px]">주소</th>
                <th className="px-4 py-2 border-b border-r-[1px]">업종</th>
                <th className="px-4 py-2 border-b border-r-[1px]">수정</th>
                <th className="px-4 py-2 border-b border-r-[1px]">삭제</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company, index) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {index + 1}
                  </td>
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
                    {company.contact &&
                      company.contact[0] &&
                      company.contact[0].name}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {company.address}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {company.industry?.join(", ")}
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
            <div className="grid grid-cols-3 space-x-3">
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
            </div>
            <div className="grid grid-cols-3 space-x-3">
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
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center">
                <label className="block mb-1">담당자</label>
                <div className="flex">
                  <div
                    className="px-4 py-2 font-semibold cursor-pointer hover:bg-gray-50 hover:rounded-md text-xs"
                    // onClick={() => set(true)} // 모달 열기
                  >
                    <span className="mr-2">+</span>
                    <span>추가</span>
                  </div>
                </div>
              </div>

              {currentCompany.contact.map((contact, index) => (
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
            <div className="grid grid-cols-3 space-x-3">
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
            </div>
            <div className="grid grid-cols-3 space-x-3">
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

              {currentCompany.contact.map((contact, index) => (
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
