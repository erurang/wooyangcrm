"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Company {
  id: string;
  company_code: string;
  name: string;
  business_number: string;
  address: string;
  industry: string[];
}

export default function Page() {
  const [companies, setCompanies] = useState<Company[]>([]); // 전체 거래처 리스트
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]); // 필터링된 거래처 리스트
  const [searchTerm, setSearchTerm] = useState<string>(""); // 거래처 검색어
  const [industryTerm, setIndustryTerm] = useState<string>(""); // 업종 검색어
  const [addressTerm, setAddressTerm] = useState<string>(""); // 주소 검색어
  const [page, setPage] = useState(1); // 페이지 상태
  const [loading, setLoading] = useState(false); // 로딩 상태
  const [hasMore, setHasMore] = useState(true); // 더 이상 데이터가 있는지 여부

  // 최초 데이터 로딩: 처음 화면에 기본적으로 15개를 가져옴
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      // 필터링된 조건 없이 기본 15개를 가져옴
      const response = await fetch(
        `/api/companies?page=${page}&limit=15&name=${searchTerm}&industry=${industryTerm}&address=${addressTerm}`
      );
      const data = await response.json();
      if (data.length === 0) {
        setHasMore(false); // 더 이상 데이터가 없으면 로드하지 않음
      } else {
        setCompanies(data); // 새로운 데이터를 넣어줌
        setFilteredCompanies(data); // 필터링된 데이터에도 추가
      }
      setLoading(false);
    };

    fetchCompanies();
  }, [page, searchTerm, industryTerm, addressTerm]); // 검색 조건이 변경될 때마다 데이터를 재요청

  // 거래처 검색 핸들러
  // const handleSearch = () => {
  //   setPage(1); // 페이지를 1로 리셋
  //   setHasMore(true); // 데이터가 있다면 계속 로드할 수 있도록
  //   setLoading(true);
  //   // 필터링 조건을 설정
  //   const filtered = companies.filter(
  //     (company) =>
  //       company.name.toLowerCase().includes(searchTerm.toLowerCase()) || // 이름에 검색어가 포함된 거래처만 필터링
  //       company.company_code.includes(searchTerm) || // 코드로도 검색이 가능하게
  //       company.industry
  //         .join(" ")
  //         .toLowerCase()
  //         .includes(industryTerm.toLowerCase()) || // 업종 검색어
  //       company.address.toLowerCase().includes(addressTerm.toLowerCase()) // 주소 검색어
  //   );
  //   setFilteredCompanies(filtered); // 필터링된 데이터만 표시
  //   setLoading(false);
  // };

  // 스크롤 이벤트 핸들러
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // 스크롤이 바닥에 가까워지면 다음 페이지를 로드
    if (scrollTop + clientHeight >= scrollHeight - 10 && hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="text-sm text-[#37352F]">
      <p className="mb-4">거래처 관리</p>
      <div>
        {/* 검색란 */}
        <div className="bg-[#FBFBFB] rounded-md border-[1px] h-20 px-4 py-3 grid grid-cols-4 items-center space-x-4">
          <div className="flex border-[1px] rounded-md">
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
          <div className="flex border-[1px] rounded-md">
            <div className="p-2 border-r-[1px]">
              <span>업종</span>
            </div>
            <input
              value={industryTerm}
              onChange={(e) => setIndustryTerm(e.target.value)}
              placeholder="업종"
              className="pl-2"
            />
          </div>
          <div className="flex border-[1px] rounded-md">
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
          {/* <div
            className="flex border-[1px] rounded-md justify-center py-2 cursor-pointer"
            onClick={handleSearch}
          >
            <span>검색</span>
          </div> */}
        </div>
      </div>

      <div className="flex mt-6">
        <div className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md">
          <span className="mr-2">+</span>
          <span>추가</span>
        </div>
      </div>

      <div>
        <div className="overflow-x-auto mt-4" onScroll={handleScroll}>
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2 border-b border-r-[1px]">No.</th>
                <th className="px-4 py-2 border-b border-r-[1px]">
                  거래처 코드
                </th>
                <th className="px-4 py-2 border-b border-r-[1px]">거래처명</th>
                <th className="px-4 py-2 border-b border-r-[1px]">
                  사업자 번호
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
                  <td className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer">
                    {company.name}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {company.business_number}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {company.address}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {company.industry?.join(", ")}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer">
                    수정
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px] text-red-500 cursor-pointer">
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
    </div>
  );
}
