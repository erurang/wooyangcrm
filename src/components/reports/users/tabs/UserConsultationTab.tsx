"use client";

import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DOC_TYPES,
  getDocTypeLabel,
  getStatusColor,
  getStatusText,
} from "@/utils/document-helpers";

interface DocumentItem {
  name: string;
  spec?: string;
  quantity: number;
  amount: number;
}

interface Document {
  document_id: string;
  document_number: string;
  type: string;
  status: string;
  created_at: string;
  user: {
    name: string;
    level: string;
  };
  items: DocumentItem[];
}

interface Consultation {
  consultation_id: string;
  company_id: string;
  company_name: string;
  date: string;
  content: string;
  documents: Document[];
}

interface UserDocumentsDetail {
  consultations: Consultation[];
}

interface UserConsultationTabProps {
  documentsDetails: UserDocumentsDetail[] | undefined;
}

export default function UserConsultationTab({
  documentsDetails,
}: UserConsultationTabProps) {
  const router = useRouter();

  return (
    <div className="bg-white border border-slate-200 shadow-sm p-5 mx-5 mb-5 rounded-lg">
      <div className="flex items-center mb-6">
        <div className="bg-sky-50 p-2 rounded-md mr-3">
          <Users className="h-5 w-5 text-sky-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">
          상담 내역 및 문서
        </h2>
      </div>

      {/* 스크롤 컨테이너 */}
      <div className="space-y-6 overflow-y-auto max-h-[700px] pr-2">
        {/* 헤더 (3열) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-700 font-semibold min-w-[900px] border-b pb-2">
          <div className="text-sky-600">상담 기록</div>
          <div className="text-sky-600">관련 문서</div>
          <div className="text-sky-600">품목 리스트</div>
        </div>

        {/* 상담들 */}
        {documentsDetails?.map((userObj) =>
          userObj.consultations.map((consultation) => (
            <div
              key={consultation.consultation_id}
              className="grid grid-cols-1 md:grid-cols-[1fr_0.5fr_1.5fr] gap-6 items-start border-b border-slate-200 pb-6"
            >
              {/* 왼쪽 열: 상담 기록 */}
              <div
                className="p-4 border border-slate-200 rounded-lg bg-white hover:bg-sky-50 cursor-pointer transition-colors shadow-sm"
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
              <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
                {DOC_TYPES.map((docType) => {
                  const docsOfThisType = consultation.documents.filter(
                    (doc) => doc.type === docType
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
                      {docsOfThisType.map((doc) => (
                        <div
                          key={doc.document_id}
                          className="mb-2 p-3 border border-slate-200 rounded-lg bg-white shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() =>
                            window.open(
                              `/documents/${doc.type}?consultId=${consultation.consultation_id}&compId=${consultation.company_id}&fullscreen=true`,
                              "_blank",
                              "width=1200,height=800,top=100,left=100"
                            )
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
                              {doc.created_at.split("T")[0]}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700">
                            문서번호:{" "}
                            <span className="text-sky-600 font-semibold">
                              {doc.document_number}
                            </span>
                          </p>
                          <p className="text-xs mt-1">
                            담당자:{" "}
                            <span className="font-semibold">
                              {doc.user.name}
                            </span>{" "}
                            ({doc.user.level})
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* 오른쪽 열: 품목 리스트 */}
              <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
                {DOC_TYPES.map((docType) => {
                  const docsOfThisType = consultation.documents.filter(
                    (doc) => doc.type === docType
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

                  return docsOfThisType.map((doc) => {
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
                        {doc.items.map((item, itemIndex) => (
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
