"use client";

import { useRouter } from "next/navigation";
import { Clock, AlertCircle, ChevronRight } from "lucide-react";
import KPISummaryCards from "../KPISummaryCards";
import { useKPISummary } from "@/hooks/dashboard/useKPISummary";
import { useLoginUser } from "@/context/login";
import { formatDateKST } from "@/utils/dateUtils";

interface FollowUpClient {
  id: string;
  company_id: string;
  company_name: string;
  follow_date: string;
  last_consultation?: string;
}

interface ExpiringDocument {
  id: string;
  company_name: string;
  valid_until: string;
  total_amount: number;
}

interface DashboardTabProps {
  followUpClients: FollowUpClient[];
  expiringDocuments: ExpiringDocument[];
}

export default function DashboardTab({
  followUpClients,
  expiringDocuments,
}: DashboardTabProps) {
  const router = useRouter();
  const loginUser = useLoginUser();
  const { kpiData, isLoading: kpiLoading } = useKPISummary(loginUser?.id);

  return (
    <div className="p-5">
      {/* KPI 요약 카드 */}
      <KPISummaryCards
        todayConsultations={kpiData.todayConsultations}
        pendingDocuments={kpiData.pendingDocuments}
        monthSales={kpiData.monthSales}
        previousMonthSales={kpiData.previousMonthSales}
        followUpNeeded={kpiData.followUpNeeded}
        expiringDocuments={kpiData.expiringDocuments}
        isLoading={kpiLoading}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 후속 상담 필요 거래처 */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-50 p-2 rounded-md mr-3">
              <Clock className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">
              후속 상담 필요 거래처
            </h2>
          </div>

          {followUpClients && followUpClients.length > 0 ? (
            <ul className="space-y-3">
              {followUpClients.map((client) => (
                <li
                  key={client.company_id}
                  className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm"
                >
                  <div
                    className="text-slate-800 font-medium cursor-pointer hover:text-indigo-600 transition-colors flex items-center justify-between"
                    onClick={() =>
                      router.push(`/consultations/${client.company_id}`)
                    }
                  >
                    <span>{client.company_name}</span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    마지막 상담일:{" "}
                    {formatDateKST(client.last_consultation)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500">
              <div className="bg-indigo-50 p-3 rounded-full mb-2">
                <Clock className="h-6 w-6 text-indigo-400" />
              </div>
              <p>후속 상담이 필요한 고객이 없습니다</p>
            </div>
          )}
        </div>

        {/* 곧 만료되는 견적서 */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-50 p-2 rounded-md mr-3">
              <AlertCircle className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">
              곧 만료되는 견적서
            </h2>
          </div>

          {expiringDocuments && expiringDocuments.length > 0 ? (
            <ul className="space-y-3">
              {expiringDocuments.map((doc) => {
                const companyName = doc.company_name || "";
                const validUntil = doc.valid_until || "";
                const totalAmount = doc.total_amount ?? 0;

                return (
                  <li
                    key={doc.id}
                    className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm"
                  >
                    <div className="font-medium text-slate-800">
                      {companyName}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-slate-500">
                        만료일: {formatDateKST(validUntil)}
                      </span>
                      <span className="text-sm font-medium text-indigo-600">
                        {totalAmount.toLocaleString()}원
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500">
              <div className="bg-indigo-50 p-3 rounded-full mb-2">
                <AlertCircle className="h-6 w-6 text-indigo-400" />
              </div>
              <p>유효기간 7일 내 만료 임박한 견적서가 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
