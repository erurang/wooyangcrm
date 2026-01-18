"use client";
import { Snackbar, Skeleton } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Contact {
  id: string;
  contact_name: string;
  mobile: string;
  department: string;
  level: string;
  email: string;
}

interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  fax: string;
  notes: string;
  business_number: string;
  contact: Contact[]; // 연락처 배열 추가
}

export default function CompanyInfo(id: any) {
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companyLoading, setCompanyLoading] = useState(false); // 🔹 회사 정보 로딩 상태
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    if (!id) return;
    setCompanyLoading(true);

    try {
      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select("id, contact_name, mobile, department, level, email")
        .eq("company_id", id);

      if (contactsError) {
        setSnackbarMessage("담당자를 불러오는 데 실패했습니다.");
        setOpenSnackbar(true);
      } else {
        setContacts(contactsData || []);
      }

      const { data: companyData, error: companyDataError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();

      setCompany({
        ...companyData,
        contact: contactsData || [],
      });

      if (companyDataError) {
        setSnackbarMessage("회사를 불러오는 데 실패했습니다.");
        setOpenSnackbar(true);
        return;
      }
    } catch (error) {
      console.error("❗ 회사정보 로딩 중 오류 발생:", error);
      setSnackbarMessage("회사정보를 가져오는 중 오류가 발생했습니다.");
      setOpenSnackbar(true);
    } finally {
      setCompanyLoading(false);
    }
  };

  const companyMemo = useMemo(() => company, [company]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 🏢 회사 정보 */}
        <div className="bg-[#FBFBFB] rounded-md border px-4 pt-3  h-40 flex flex-col justify-between">
          {companyLoading ? (
            <>
              <Skeleton variant="text" width="100%" height="100%" />
            </>
          ) : (
            <div>
              <ul className="space-y-1 text-gray-700 text-sm pl-1">
                <li className="flex items-center">
                  <span className="font-medium w-14">회사명</span>
                  <span className="flex-1 truncate">{companyMemo?.name}</span>
                </li>
                <li className="flex items-center">
                  <span className="font-medium w-14">주소</span>
                  <span className="flex-1 truncate">
                    {companyMemo?.address || "정보 없음"}
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="font-medium w-14">전화</span>
                  <span className="flex-1">
                    {companyMemo?.phone || "정보 없음"}
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="font-medium w-14">팩스</span>
                  <span className="flex-1">
                    {companyMemo?.fax || "정보 없음"}
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="font-medium w-14">이메일</span>
                  <span className="flex-1 truncate">
                    {companyMemo?.email || "정보 없음"}
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* 📝 비고 */}
        <div className="bg-[#FBFBFB] rounded-md border px-4 pt-3 h-40 flex flex-col">
          {companyLoading ? (
            <>
              <Skeleton variant="text" width="100%" height="100%" />
            </>
          ) : (
            <>
              <h2 className="font-semibold text-md mb-1">담당자</h2>

              <div className=" h-28 overflow-y-auto">
                <table className="w-full text-xs border-collapse">
                  {/* 🔹 테이블 헤더 고정 (sticky top-0 적용) */}
                  <thead className="border-b font-semibold bg-gray-100 sticky top-0">
                    {/* <tr>
                      <th className="text-left px-2 py-1">이름</th>
                      <th className="text-left px-2 py-1">직급</th>
                      <th className="text-left px-2 py-1">부서</th>
                      <th className="text-left px-2 py-1">이메일</th>
                    </tr> */}
                  </thead>
                  {/* 🔹 내용만 스크롤 */}
                  <tbody className="text-sm">
                    {company?.contact.map((contact, index) => (
                      <tr
                        key={index}
                        className={`${
                          index !== company.contact.length - 1 ? "border-b" : ""
                        }`}
                      >
                        <td className="px-1 py-1">{contact.contact_name}</td>
                        <td className="px-1 py-1">{contact.level}</td>
                        <td className="px-1 py-1">{contact.department}</td>
                        <td className="px-1 py-1">{contact.mobile}</td>
                        <td className="px-1 py-1 truncate">{contact.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="bg-[#FBFBFB] rounded-md border pl-4 pt-3 h-[11.25rem]">
          {companyLoading ? (
            <Skeleton variant="rectangular" width="100%" height="100%" />
          ) : (
            <>
              <h2 className="font-semibold text-md mb-1">비고</h2>
              <div className="text-sm h-[9rem] overflow-y-auto pl-1">
                <span>{companyMemo?.notes || "내용 없음"}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
