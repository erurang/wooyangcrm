"use client";

import { Edit, Trash2, Briefcase, Calendar, Building2, Coins } from "lucide-react";

interface RnDs {
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

interface RnDsTableProps {
  rnds: RnDs[];
  onRowClick: (id: string) => void;
  onEdit: (rnd: RnDs) => void;
  onDelete: (rnd: RnDs) => void;
  formatNumber: (value: string) => string;
}

export default function RnDsTable({
  rnds,
  onRowClick,
  onEdit,
  onDelete,
  formatNumber,
}: RnDsTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* 모바일: 카드 레이아웃 */}
      <div className="sm:hidden divide-y divide-slate-100">
        {rnds?.map((rnd) => (
          <div key={rnd.id} className="p-3 active:bg-slate-50">
            <div className="flex items-start justify-between gap-2">
              <div
                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                onClick={() => onRowClick(rnd.id)}
              >
                <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
                  <Briefcase className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-indigo-600 truncate">
                    {rnd.name}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {rnd.start_date} ~ {rnd.end_date}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(rnd); }}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(rnd); }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-2 ml-10 flex flex-wrap gap-x-4 gap-y-1">
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Coins className="h-3 w-3 text-slate-400" />
                <span className="font-medium">{formatNumber(rnd.total_cost)}원</span>
              </div>
              {rnd.rnd_orgs?.name && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Building2 className="h-3 w-3" />
                  {rnd.rnd_orgs.name}
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
            {rnds?.map((rnd) => (
              <tr key={rnd.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div
                    className="text-sm font-medium text-indigo-600 cursor-pointer hover:text-indigo-800"
                    onClick={() => onRowClick(rnd.id)}
                  >
                    {rnd.name}
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="text-sm text-slate-600">{rnd.start_date} ~ {rnd.end_date}</div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="text-sm text-slate-600">{formatNumber(rnd.total_cost)} 원</div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="text-sm text-slate-600">{formatNumber(rnd.gov_contribution)} 원</div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="text-sm text-slate-600">{rnd.rnd_orgs?.name || "-"}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(rnd)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(rnd)}
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
