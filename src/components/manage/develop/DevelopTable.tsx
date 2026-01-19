"use client";

import { Edit, Trash2, Code2, Calendar, Coins } from "lucide-react";

interface Develop {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  gov_contribution: string;
  pri_contribution: string;
  total_cost: string;
  notes: string;
  support_org: string;
  rnd_orgs: {
    name: string;
  };
}

interface DevelopTableProps {
  develops: Develop[];
  onRowClick: (id: string) => void;
  onEdit: (develop: Develop) => void;
  onDelete: (develop: Develop) => void;
  formatNumber: (value: string) => string;
}

export default function DevelopTable({
  develops,
  onRowClick,
  onEdit,
  onDelete,
  formatNumber,
}: DevelopTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* 모바일: 카드 레이아웃 */}
      <div className="sm:hidden divide-y divide-slate-100">
        {develops?.map((develop) => (
          <div key={develop.id} className="p-3 active:bg-slate-50">
            <div className="flex items-start justify-between gap-2">
              <div
                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                onClick={() => onRowClick(develop.id)}
              >
                <div className="p-2 bg-emerald-50 rounded-lg shrink-0">
                  <Code2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-emerald-600 truncate">
                    {develop.name}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {develop.start_date} ~ {develop.end_date}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(develop); }}
                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(develop); }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-2 ml-10 flex flex-wrap gap-x-4 gap-y-1">
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Coins className="h-3 w-3 text-slate-400" />
                <span className="font-medium">{formatNumber(develop.total_cost)}원</span>
              </div>
              {develop.rnd_orgs?.name && (
                <div className="text-xs text-slate-500">
                  {develop.rnd_orgs.name}
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
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">개발명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden md:table-cell">기간</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">총 사업비</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">정부 출연금</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">담당</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 w-24">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {develops?.map((develop) => (
              <tr key={develop.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div
                    className="text-sm font-medium text-emerald-600 cursor-pointer hover:text-emerald-800"
                    onClick={() => onRowClick(develop.id)}
                  >
                    {develop.name}
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="text-sm text-slate-600">{develop.start_date} ~ {develop.end_date}</div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="text-sm text-slate-600">{formatNumber(develop.total_cost)} 원</div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="text-sm text-slate-600">{formatNumber(develop.gov_contribution)} 원</div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="text-sm text-slate-600">{develop.rnd_orgs?.name || "-"}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(develop)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(develop)}
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
