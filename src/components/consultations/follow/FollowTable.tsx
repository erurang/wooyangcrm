"use client";

import { Search, FileText } from "lucide-react";
import { CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";

interface Document {
  id: string;
  type: "estimate" | "requestQuote" | "order";
  document_number: string;
}

interface Consultation {
  id: string;
  date: string;
  follow_up_date?: string;
  content: string;
  contact_name?: string;
  contact_level?: string;
  companies?: { id: string; name: string };
  users?: { name: string; level: string };
  documents: Document[];
}

interface FollowTableProps {
  consultations: Consultation[] | null;
  isLoading: boolean;
  onDocumentClick: (doc: Document) => void;
}

export default function FollowTable({
  consultations,
  isLoading,
  onDocumentClick,
}: FollowTableProps) {
  const router = useRouter();

  const formatContentWithLineBreaks = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="flex justify-center items-center py-20">
          <CircularProgress size={40} />
        </div>
      </div>
    );
  }

  if (!consultations || consultations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="flex flex-col items-center justify-center py-16">
          <Search size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">검색 결과가 없습니다</p>
          <p className="text-gray-400 text-sm mt-2">다른 검색어로 시도해보세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                거래처
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                상담 기간
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                담당자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                상담자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider table-cell">
                내용
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                문서
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {consultations.map((consultation) => (
              <tr key={consultation.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                    onClick={() => router.push(`/consultations/${consultation.companies?.id}`)}
                  >
                    {consultation.companies?.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                  <div className="text-sm text-gray-900">
                    <div>{consultation.date}</div>
                    <div className="text-blue-500 font-medium">
                      ~{consultation.follow_up_date}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                  <div className="text-sm text-gray-900">
                    {consultation?.contact_name} {consultation?.contact_level}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                  <div className="text-sm text-gray-900">
                    {consultation.users?.name} {consultation.users?.level}
                  </div>
                </td>
                <td className="px-6 py-4 table-cell">
                  <div
                    className="text-sm text-gray-900 overflow-y-auto pr-2"
                    style={{ maxHeight: "80px", fontSize: "0.8rem" }}
                  >
                    {formatContentWithLineBreaks(consultation.content)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-2">
                    {["estimate", "order", "requestQuote"].map((type) => {
                      const filteredDocs = consultation.documents.filter(
                        (doc) => doc.type === type
                      );
                      if (filteredDocs?.length > 0) {
                        return (
                          <div key={type} className="flex items-start">
                            <FileText className="w-4 h-4 mt-1 mr-2 text-gray-500 flex-shrink-0" />
                            <div>
                              <span className="text-xs font-medium text-gray-700">
                                {type === "estimate"
                                  ? "견적서"
                                  : type === "order"
                                  ? "발주서"
                                  : "의뢰서"}
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {filteredDocs?.map((doc) => (
                                  <span
                                    key={doc.id}
                                    onClick={() => onDocumentClick(doc)}
                                    className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
                                  >
                                    {doc.document_number}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
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
