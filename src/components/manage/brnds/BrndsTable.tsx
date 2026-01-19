"use client";

import { Edit, Trash2, Award, Calendar, Building2, Coins } from "lucide-react";

interface Brnds {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  gov_contribution: string;
  pri_contribution: string;
  total_cost: string;
  notes: string;
  support_org: string;
  rnd_orgs?: {
    name: string;
  };
}

interface BrndsTableProps {
  brnds: Brnds[];
  onRowClick: (id: string) => void;
  onEdit: (brnd: Brnds) => void;
  onDelete: (brnd: Brnds) => void;
}

export default function BrndsTable({
  brnds,
  onRowClick,
  onEdit,
  onDelete,
}: BrndsTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* 모바일: 카드 레이아웃 */}
      <div className="sm:hidden divide-y divide-slate-100">
        {brnds?.map((brnd) => (
          <div key={brnd.id} className="p-3 active:bg-slate-50">
            <div className="flex items-start justify-between gap-2">
              <div
                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                onClick={() => onRowClick(brnd.id)}
              >
                <div className="p-2 bg-amber-50 rounded-lg shrink-0">
                  <Award className="h-4 w-4 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-amber-600 truncate">
                    {brnd.name}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {brnd.start_date} ~ {brnd.end_date}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(brnd); }}
                  className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 active:bg-amber-100 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(brnd); }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-2 ml-10 flex flex-wrap gap-x-4 gap-y-1">
              {brnd.total_cost && (
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <Coins className="h-3 w-3 text-slate-400" />
                  <span className="font-medium">{brnd.total_cost}</span>
                </div>
              )}
              {brnd.rnd_orgs?.name && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Building2 className="h-3 w-3" />
                  {brnd.rnd_orgs.name}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 데스크탑: 테이블 레이아웃 */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">사업명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden md:table-cell">총 사업기간</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">총 사업비</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">정부 출연금</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">지원기관</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 w-24">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {brnds?.map((brnd) => (
              <tr key={brnd.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div
                    className="text-sm font-medium text-amber-600 cursor-pointer hover:text-amber-800"
                    onClick={() => onRowClick(brnd.id)}
                  >
                    {brnd.name}
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="text-sm text-slate-600">{brnd.start_date} ~ {brnd.end_date}</div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="text-sm text-slate-600">{brnd.total_cost || "-"}</div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="text-sm text-slate-600">{brnd.gov_contribution || "-"}</div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="text-sm text-slate-600">{brnd.rnd_orgs?.name || "-"}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(brnd)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(brnd)}
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
