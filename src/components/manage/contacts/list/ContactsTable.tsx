"use client";

import { useRouter } from "next/navigation";
import { Edit, Trash2, Building2, User, Phone, Mail } from "lucide-react";
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

interface ContactsTableProps {
  contacts: Contact[];
  isLoading?: boolean;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onAdd?: () => void;
  hasSearchQuery?: boolean;
  currentPage?: number;
  totalPages?: number;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  onPageChange?: (page: number) => void;
}

export default function ContactsTable({
  contacts,
  isLoading = false,
  onEdit,
  onDelete,
  onAdd,
  hasSearchQuery = false,
  currentPage = 1,
  totalPages = 1,
  perPage = 10,
  onPerPageChange,
  onPageChange,
}: ContactsTableProps) {
  const router = useRouter();

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-500">담당자 목록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (!contacts || contacts.length === 0) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <EmptyState
            type={hasSearchQuery ? "search" : "contact"}
            onAction={!hasSearchQuery && onAdd ? onAdd : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Table Controls */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-slate-500">
          {currentPage} / {totalPages} 페이지
        </div>
        {onPerPageChange && onPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">표시:</span>
            <select
              value={perPage}
              onChange={(e) => {
                onPerPageChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
            >
              <option value="10">10개</option>
              <option value="20">20개</option>
              <option value="30">30개</option>
              <option value="50">50개</option>
            </select>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
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
                  이메일
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  연락처
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 w-24">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.map((contact: Contact) => (
                <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => router.push(`/consultations/${contact.company_id}`)}
                    >
                      <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-violet-100 transition-colors">
                        <Building2 className="h-4 w-4 text-slate-500 group-hover:text-violet-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-violet-600 transition-colors">
                        {contact.companies?.name || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => router.push(`/manage/contacts/${contact.id}`)}
                    >
                      <div className="p-1.5 bg-violet-50 rounded-lg group-hover:bg-violet-100 transition-colors">
                        <User className="h-4 w-4 text-violet-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-800 group-hover:text-violet-600 transition-colors">
                          {contact.contact_name || "-"}
                        </span>
                        {contact.department && (
                          <div className="text-xs text-slate-400">{contact.department}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {contact.level ? (
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md">
                        {contact.level}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {contact.email ? (
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {contact.email}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {contact.mobile ? (
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {contact.mobile}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(contact);
                        }}
                        className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        title="수정"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(contact);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
