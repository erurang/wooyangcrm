"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, FileText, Package, MessageSquare } from "lucide-react";
import type {
  DashboardUserData,
  DashboardConsultation,
  DashboardDocument,
  DashboardDocumentItem,
} from "@/types/dashboard";

const DOC_TYPES = ["estimate", "order", "requestQuote"] as const;

type MobileTab = "consultation" | "documents" | "items";

function getDocTypeLabel(type: string) {
  switch (type) {
    case "estimate":
      return "견적서";
    case "order":
      return "발주서";
    case "requestQuote":
      return "의뢰서";
    default:
      return "기타 문서";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "pending":
      return "진행 중";
    case "completed":
      return "완료됨";
    case "canceled":
      return "취소됨";
    default:
      return "알 수 없음";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "text-amber-600 bg-amber-50";
    case "completed":
      return "text-emerald-600 bg-emerald-50";
    case "canceled":
      return "text-rose-600 bg-rose-50";
    default:
      return "text-slate-500 bg-slate-50";
  }
}

interface ConsultationTabProps {
  documentsDetails: DashboardUserData[] | null;
}

// 모바일 탭 버튼 컴포넌트
function MobileTabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
        active
          ? "bg-sky-600 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function ConsultationTab({
  documentsDetails,
}: ConsultationTabProps) {
  const router = useRouter();
  const [mobileTab, setMobileTab] = useState<MobileTab>("consultation");

  return (
    <div className="bg-white border border-slate-200 shadow-sm p-4 md:p-5 mx-2 md:mx-5 mb-5 rounded-lg">
      <div className="flex items-center mb-4 md:mb-6">
        <div className="bg-sky-50 p-2 rounded-md mr-3">
          <Users className="h-5 w-5 text-sky-600" />
        </div>
        <h2 className="text-lg md:text-xl font-semibold text-slate-800">
          상담 내역 및 문서
        </h2>
      </div>

      {/* 모바일 탭 네비게이션 */}
      <div className="flex gap-2 mb-4 md:hidden">
        <MobileTabButton
          active={mobileTab === "consultation"}
          onClick={() => setMobileTab("consultation")}
          icon={MessageSquare}
          label="상담"
        />
        <MobileTabButton
          active={mobileTab === "documents"}
          onClick={() => setMobileTab("documents")}
          icon={FileText}
          label="문서"
        />
        <MobileTabButton
          active={mobileTab === "items"}
          onClick={() => setMobileTab("items")}
          icon={Package}
          label="품목"
        />
      </div>

      {/* 스크롤 컨테이너 */}
      <div className="space-y-6 overflow-y-auto max-h-[700px] pr-2">
        {/* 데스크탑 헤더 (3열) */}
        <div className="hidden md:grid grid-cols-3 gap-6 text-slate-700 font-semibold border-b pb-2">
          <div className="text-sky-600">상담 기록</div>
          <div className="text-sky-600">관련 문서</div>
          <div className="text-sky-600">품목 리스트</div>
        </div>

        {/* 상담들 */}
        {documentsDetails?.map((userObj: DashboardUserData) =>
          userObj.consultations.map((consultation: DashboardConsultation) => (
            <div
              key={consultation.consultation_id}
              className="md:grid md:grid-cols-[1fr_0.5fr_1.5fr] gap-4 md:gap-6 items-start border-b border-slate-200 pb-6"
            >
              {/* 왼쪽 열: 상담 기록 */}
              <div
                className={`p-4 border border-slate-200 rounded-lg bg-white hover:bg-sky-50 cursor-pointer transition-colors shadow-sm ${
                  mobileTab !== "consultation" ? "hidden md:block" : ""
                }`}
                onClick={() =>
                  router.push(`/consultations/${consultation.company_id}`)
                }
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-500">
                    {consultation.date}
                  </span>
                  <span className="font-semibold text-sky-600 bg-sky-50 px-2 py-1 rounded-md text-xs">
                    {consultation.company_name}
                  </span>
                </div>
                <p className="text-slate-800 whitespace-pre-line text-sm">
                  {consultation.content}
                </p>
              </div>

              {/* 중간 열: 관련 문서 */}
              <div
                className={`p-4 border border-slate-200 rounded-lg bg-white shadow-sm ${
                  mobileTab !== "documents" ? "hidden md:block" : ""
                }`}
              >
                {DOC_TYPES.map((docType) => {
                  const docsOfThisType = consultation.documents.filter(
                    (doc: DashboardDocument) => doc.type === docType
                  );
                  if (docsOfThisType.length === 0) {
                    return (
                      <p key={docType} className="text-slate-400 text-sm mb-4">
                        📂 {docType === "estimate" && "견적"}
                        {docType === "order" && "발주"}
                        {docType === "requestQuote" && "의뢰"} 문서 없음
                      </p>
                    );
                  }
                  return (
                    <div key={docType} className="mb-4 last:mb-0">
                      <h3 className="font-semibold text-slate-700 mb-2 text-sm">
                        {getDocTypeLabel(docType)}
                      </h3>
                      {docsOfThisType.map((doc: DashboardDocument) => (
                        <div
                          key={doc.document_id}
                          className="mb-2 p-3 border border-slate-200 rounded-lg bg-white shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() =>
                            router.push(`/documents/review?highlight=${doc.document_id}`)
                          }
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span
                              className={`text-xs px-2 py-1 rounded-md ${getStatusColor(
                                doc.status
                              )}`}
                            >
                              {getStatusText(doc.status)}
                            </span>
                            <span className="text-xs text-slate-500">
                              {doc.created_at?.split("T")[0] ?? "-"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700">
                            문서번호:{" "}
                            <span className="text-sky-600 font-semibold">
                              {doc.document_number}
                            </span>
                          </p>
                          {doc.user && (
                            <p className="text-xs mt-1">
                              담당자:{" "}
                              <span className="font-semibold">
                                {doc.user.name}
                              </span>{" "}
                              ({doc.user.level ?? ""})
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* 오른쪽 열: 품목 리스트 */}
              <div
                className={`p-4 border border-slate-200 rounded-lg bg-white shadow-sm ${
                  mobileTab !== "items" ? "hidden md:block" : ""
                }`}
              >
                {DOC_TYPES.map((docType) => {
                  const docsOfThisType = consultation.documents.filter(
                    (doc: DashboardDocument) => doc.type === docType
                  );
                  if (docsOfThisType.length === 0) {
                    return (
                      <p key={docType} className="text-slate-400 text-sm mb-4">
                        📂 {docType === "estimate" && "견적"}
                        {docType === "order" && "발주"}
                        {docType === "requestQuote" && "의뢰"} 품목 없음
                      </p>
                    );
                  }

                  return docsOfThisType.map((doc: DashboardDocument) => {
                    if (!doc.items || doc.items.length === 0) {
                      return (
                        <p
                          key={doc.document_id}
                          className="text-slate-400 text-sm mb-4"
                        >
                          {getDocTypeLabel(docType)} - 품목 없음
                        </p>
                      );
                    }
                    return (
                      <div key={doc.document_id} className="mb-4 last:mb-0">
                        <h3 className="font-semibold text-slate-700 mb-2 text-sm">
                          {getDocTypeLabel(docType)} {doc.document_number}
                        </h3>
                        {doc.items.map((item: DashboardDocumentItem, itemIndex: number) => (
                          <div
                            key={itemIndex}
                            className="grid grid-cols-[2fr_1fr_0.5fr_0.5fr] gap-2 p-3 border border-slate-200 rounded-lg bg-slate-50 text-sm mb-2"
                          >
                            <span className="text-slate-700 font-medium">
                              {item.name}
                            </span>
                            <span className="text-slate-500">{item.spec}</span>
                            <span className="text-slate-500 text-center">
                              {item.quantity}
                            </span>
                            <span className="text-sky-600 font-semibold text-right">
                              {Number(item.amount).toLocaleString()} 원
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
