"use client";

import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";

interface Document {
  id: string;
  type: "estimate" | "requestQuote" | "order";
  document_number: string;
}

interface Consultation {
  id: string;
  date: string;
  content: string;
  contact_name?: string;
  contact_level?: string;
  companies?: { id: string; name: string };
  users?: { name: string; level: string };
  documents: Document[];
}

interface RecentTableProps {
  consultations: Consultation[] | null;
  isLoading: boolean;
  onDocumentClick: (doc: Document) => void;
}

export default function RecentTable({
  consultations,
  isLoading,
  onDocumentClick,
}: RecentTableProps) {
  const router = useRouter();

  const formatContentWithLineBreaks = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  const LoadingSpinner = () => (
    <tr>
      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
        <div className="flex justify-center items-center py-10">
          <svg
            className="animate-spin h-8 w-8 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="ml-3">데이터를 불러오는 중입니다...</span>
        </div>
      </td>
    </tr>
  );

  const EmptyRow = () => (
    <tr>
      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
        검색 결과가 없습니다
      </td>
    </tr>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              거래처
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              상담일
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              담당자
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              상담자
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              내용
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              문서
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {isLoading ? (
            <LoadingSpinner />
          ) : !consultations || consultations.length === 0 ? (
            <EmptyRow />
          ) : (
            consultations.map((consultation) => (
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
                  <div className="text-sm text-gray-900">{consultation.date}</div>
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
                <td className="px-6 py-4">
                  <div
                    className="text-sm text-gray-900 overflow-y-auto pr-2"
                    style={{ maxHeight: "80px" }}
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
