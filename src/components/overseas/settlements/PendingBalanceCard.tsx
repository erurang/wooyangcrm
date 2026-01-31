"use client";

import { Plus, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface PendingConsultation {
  id: string;
  oc_number?: string;
  product_name?: string;
  total_remittance?: number;
  currency?: string;
  remittance_date?: string;
}

interface PendingBalance {
  company_id: string;
  company_name: string;
  consultations: PendingConsultation[];
  total_by_currency: Record<string, number>;
}

interface PendingBalanceCardProps {
  data: PendingBalance[];
  isLoading: boolean;
  onCreateSettlement: (companyId: string) => void;
}

export default function PendingBalanceCard({
  data,
  isLoading,
  onCreateSettlement,
}: PendingBalanceCardProps) {
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());

  const toggleExpand = (companyId: string) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedCompanies(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-slate-500">잔액 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <AlertCircle size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500">선송금 미입고 건이 없습니다.</p>
        <p className="text-sm text-slate-400 mt-1">모든 송금에 대해 입고가 완료되었습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((company) => (
        <div
          key={company.company_id}
          className="bg-white rounded-lg border border-slate-200 overflow-hidden"
        >
          {/* 거래처 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
            <button
              onClick={() => toggleExpand(company.company_id)}
              className="flex items-center gap-3 flex-1"
            >
              <div className="text-left">
                <div className="font-medium text-slate-800">{company.company_name}</div>
                <div className="text-xs text-slate-500">
                  {company.consultations.length}건 미입고
                </div>
              </div>
            </button>
            <div className="flex items-center gap-4">
              <div className="text-right">
                {Object.entries(company.total_by_currency).map(([currency, total]) => (
                  <div key={currency} className="text-sm font-medium text-red-600">
                    {currency} {total.toLocaleString()}
                  </div>
                ))}
              </div>
              <button
                onClick={() => onCreateSettlement(company.company_id)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 rounded hover:bg-teal-700 transition-colors"
              >
                <Plus size={14} />
                정산 등록
              </button>
              <button onClick={() => toggleExpand(company.company_id)}>
                {expandedCompanies.has(company.company_id) ? (
                  <ChevronUp size={20} className="text-slate-400" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* 상세 목록 */}
          {expandedCompanies.has(company.company_id) && (
            <div className="border-t border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                      O/C No.
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                      품명
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                      송금일
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">
                      송금액
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {company.consultations.map((consultation) => (
                    <tr key={consultation.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-700">
                        {consultation.oc_number || "-"}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {consultation.product_name || "-"}
                      </td>
                      <td className="px-4 py-2 text-slate-500">
                        {consultation.remittance_date || "-"}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-slate-700">
                        {consultation.currency}{" "}
                        {consultation.total_remittance?.toLocaleString() || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
