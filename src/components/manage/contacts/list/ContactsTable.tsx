"use client";

import { useRouter } from "next/navigation";
import { Edit, Trash2 } from "lucide-react";
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
}

export default function ContactsTable({
  contacts,
  isLoading = false,
  onEdit,
  onDelete,
  onAdd,
  hasSearchQuery = false,
}: ContactsTableProps) {
  const router = useRouter();

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 mt-3">담당자 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (!contacts || contacts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <EmptyState
          type={hasSearchQuery ? "search" : "contact"}
          onAction={!hasSearchQuery && onAdd ? onAdd : undefined}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
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
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                담당자
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                직급
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
              >
                이메일
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                연락처
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contacts.map((contact: Contact) => (
              <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                    onClick={() => router.push(`/consultations/${contact.company_id}`)}
                  >
                    {contact.companies?.name || "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                    onClick={() => router.push(`/manage/contacts/${contact.id}`)}
                  >
                    {contact.contact_name || "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{contact.level || "-"}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                  <div className="text-sm text-gray-900">{contact.email || "-"}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{contact.mobile || "-"}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(contact)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                    >
                      <Edit size={14} />
                      수정
                    </button>
                    <button
                      onClick={() => onDelete(contact)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
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
