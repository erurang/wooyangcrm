"use client";

import { Edit, Trash2, Building2, Phone, Mail, MapPin } from "lucide-react";

interface RnDsOrgs {
  id: string;
  name: string;
  address: string;
  notes: string;
  phone: string;
  fax: string;
  email: string;
  rnds_contacts?: any[];
}

interface OrgsTableProps {
  orgs: RnDsOrgs[];
  onEdit: (org: RnDsOrgs) => void;
  onDelete: (org: RnDsOrgs) => void;
}

export default function OrgsTable({ orgs, onEdit, onDelete }: OrgsTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* 모바일: 카드 레이아웃 */}
      <div className="sm:hidden divide-y divide-slate-100">
        {orgs?.map((org) => (
          <div key={org.id} className="p-3 active:bg-slate-50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-blue-600 truncate">
                    {org.name}
                  </div>
                  {org.address && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{org.address}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEdit(org)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(org)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {(org.phone || org.email) && (
              <div className="mt-2 ml-10 flex flex-wrap gap-x-4 gap-y-1">
                {org.phone && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Phone className="h-3 w-3" />
                    {org.phone}
                  </div>
                )}
                {org.email && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 truncate">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{org.email}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 데스크탑: 테이블 레이아웃 */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">기관명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden md:table-cell">주소</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">번호</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">팩스</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">이메일</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 w-24">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orgs?.map((org) => (
              <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-blue-600">{org.name}</div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="text-sm text-slate-600 truncate max-w-xs">{org.address || "-"}</div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="text-sm text-slate-600">{org.phone || "-"}</div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="text-sm text-slate-600">{org.fax || "-"}</div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="text-sm text-slate-600">{org.email || "-"}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(org)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(org)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
  );
}
