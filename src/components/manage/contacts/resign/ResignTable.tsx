"use client";

import { useRouter } from "next/navigation";
import { Trash2, RefreshCw } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

interface Contact {
  id: string;
  contact_name: string;
  mobile: string;
  department: string;
  level: string;
  email: string;
  company_id: string;
  companies: {
    name: string;
  };
  note: string;
}

interface ResignTableProps {
  contacts: Contact[];
  isLoading?: boolean;
  onChangeStatus: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  hasSearchQuery?: boolean;
}

export default function ResignTable({
  contacts,
  isLoading = false,
  onChangeStatus,
  onDelete,
  hasSearchQuery = false,
}: ResignTableProps) {
  const router = useRouter();

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 mt-3">퇴사자 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (!contacts || contacts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <EmptyState type={hasSearchQuery ? "search" : "resign"} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      {/* 모바일: 카드 레이아웃 */}
      <div className="sm:hidden divide-y divide-slate-100">
        {contacts.map((contact) => (
          <div key={contact.id} className="p-3 active:bg-slate-50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-medium text-blue-600"
                  onClick={() => router.push(`/manage/contacts/${contact.id}`)}
                >
                  {contact.contact_name || "-"}
                  {contact.level && (
                    <span className="ml-1.5 inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                      {contact.level}
                    </span>
                  )}
                </div>
                <div
                  className="text-xs text-slate-500 mt-0.5"
                  onClick={() => router.push(`/consultations/${contact.company_id}`)}
                >
                  {contact.companies?.name || "-"}
                </div>
                {contact.mobile && (
                  <div className="text-xs text-slate-500 mt-1">
                    {contact.mobile}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onChangeStatus(contact)}
                  className="p-2 text-green-600 hover:bg-green-50 active:bg-green-100 rounded-lg transition-colors"
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  onClick={() => onDelete(contact)}
                  className="p-2 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 데스크탑: 테이블 레이아웃 */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                거래처명
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                담당자
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                직급
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden md:table-cell">
                부서
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">
                이메일
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                연락처
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 w-28">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div
                    className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                    onClick={() =>
                      router.push(`/consultations/${contact.company_id}`)
                    }
                  >
                    {contact.companies?.name || "-"}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div
                    className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                    onClick={() =>
                      router.push(`/manage/contacts/${contact.id}`)
                    }
                  >
                    {contact.contact_name || "-"}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-slate-700">
                    {contact.level || "-"}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                  <div className="text-sm text-slate-700">
                    {contact.department || "-"}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                  <div className="text-sm text-slate-700">
                    {contact.email || "-"}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-slate-700">
                    {contact.mobile || "-"}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onChangeStatus(contact)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <RefreshCw size={14} />
                      재직
                    </button>
                    <button
                      onClick={() => onDelete(contact)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={14} />
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
