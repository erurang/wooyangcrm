"use client";
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
  contact: Contact[];
}

export default function CompanyInfo(id: any) {
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companyLoading, setCompanyLoading] = useState(false);

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

      if (!contactsError) {
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
        console.error("회사 정보 로드 실패:", companyDataError.message);
      }
    } catch (error) {
      console.error("회사정보 로딩 중 오류 발생:", error);
    } finally {
      setCompanyLoading(false);
    }
  };

  const companyMemo = useMemo(() => company, [company]);

  const SkeletonBlock = () => (
    <div className="animate-pulse space-y-2">
      <div className="h-3 bg-slate-200 rounded w-3/4" />
      <div className="h-3 bg-slate-200 rounded w-1/2" />
      <div className="h-3 bg-slate-200 rounded w-2/3" />
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 회사 정보 */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm px-4 pt-3 h-40 flex flex-col justify-between">
          {companyLoading ? (
            <SkeletonBlock />
          ) : (
            <div>
              <ul className="space-y-1 text-slate-600 text-sm pl-1">
                <li className="flex items-center">
                  <span className="font-semibold w-14 text-slate-700">회사명</span>
                  <span className="flex-1 truncate">{companyMemo?.name}</span>
                </li>
                <li className="flex items-center">
                  <span className="font-semibold w-14 text-slate-700">주소</span>
                  <span className="flex-1 truncate">
                    {companyMemo?.address || <span className="text-slate-400">정보 없음</span>}
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="font-semibold w-14 text-slate-700">전화</span>
                  <span className="flex-1 tabular-nums">
                    {companyMemo?.phone || <span className="text-slate-400">정보 없음</span>}
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="font-semibold w-14 text-slate-700">팩스</span>
                  <span className="flex-1 tabular-nums">
                    {companyMemo?.fax || <span className="text-slate-400">정보 없음</span>}
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="font-semibold w-14 text-slate-700">이메일</span>
                  <span className="flex-1 truncate">
                    {companyMemo?.email || <span className="text-slate-400">정보 없음</span>}
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* 담당자 */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm px-4 pt-3 h-40 flex flex-col">
          {companyLoading ? (
            <SkeletonBlock />
          ) : (
            <>
              <h2 className="font-bold text-sm text-slate-800 mb-1">담당자</h2>
              <div className="h-28 overflow-y-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="border-b font-semibold bg-slate-50 sticky top-0">
                  </thead>
                  <tbody className="text-sm">
                    {company?.contact.map((contact, index) => (
                      <tr
                        key={index}
                        className={`${
                          index !== company.contact.length - 1 ? "border-b border-slate-100" : ""
                        }`}
                      >
                        <td className="px-1 py-1 font-medium text-slate-800">{contact.contact_name}</td>
                        <td className="px-1 py-1 text-slate-500">{contact.level}</td>
                        <td className="px-1 py-1 text-slate-500">{contact.department}</td>
                        <td className="px-1 py-1 text-slate-500 tabular-nums">{contact.mobile}</td>
                        <td className="px-1 py-1 truncate text-slate-500">{contact.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* 비고 */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm pl-4 pt-3 h-[11.25rem]">
          {companyLoading ? (
            <SkeletonBlock />
          ) : (
            <>
              <h2 className="font-bold text-sm text-slate-800 mb-1">비고</h2>
              <div className="text-sm h-[9rem] overflow-y-auto pl-1 text-slate-600 leading-relaxed">
                <span>{companyMemo?.notes || <span className="text-slate-400">내용 없음</span>}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
