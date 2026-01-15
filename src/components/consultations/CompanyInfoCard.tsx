"use client";

import { Skeleton } from "@mui/material";
import { useRouter } from "next/navigation";

interface Contact {
  id: string;
  contact_name: string;
  mobile: string;
  department: string;
  level: string;
  email: string;
  resign: boolean;
  sort_order: null | number;
  company_id?: string;
}

interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  fax: string;
  notes: string;
  business_number: string;
  parcel?: string;
}

interface CompanyInfoCardProps {
  companyDetail: Company | null;
  contacts: Contact[];
  isLoading: boolean;
  onEditNotes: () => void;
  onEditContacts: () => void;
}

export default function CompanyInfoCard({
  companyDetail,
  contacts,
  isLoading,
  onEditNotes,
  onEditContacts,
}: CompanyInfoCardProps) {
  const router = useRouter();

  const formatContentWithLineBreaks = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
        {/* 거래처 기본 정보 */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-gray-900">
              거래처 정보
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="100%" height={20} />
            </div>
          ) : (
            <div className="space-y-1 text-sm">
              <div className="flex items-start">
                <span className="w-16 text-xs font-medium text-gray-500">
                  회사명
                </span>
                <span className="flex-1 text-gray-900">
                  {companyDetail?.name}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-16 text-xs font-medium text-gray-500">
                  주소
                </span>
                <span className="flex-1 text-gray-900">
                  {companyDetail?.address || "정보 없음"}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-16 text-xs font-medium text-gray-500">
                  배송
                </span>
                <span className="flex-1 text-gray-900">
                  {companyDetail?.parcel || "정보 없음"}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-16 text-xs font-medium text-gray-500">
                  전화
                </span>
                <span className="flex-1 text-gray-900">
                  {companyDetail?.phone || "정보 없음"}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-16 text-xs font-medium text-gray-500">
                  팩스
                </span>
                <span className="flex-1 text-gray-900">
                  {companyDetail?.fax || "정보 없음"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 비고 정보 */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-gray-900">비고</h2>
            <button
              onClick={onEditNotes}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              수정
            </button>
          </div>

          {isLoading ? (
            <Skeleton variant="rectangular" width="100%" height={80} />
          ) : (
            <div className="text-sm text-gray-700 max-h-24 overflow-y-auto">
              {companyDetail?.notes ? (
                formatContentWithLineBreaks(companyDetail.notes)
              ) : (
                <p className="text-gray-500 italic text-xs">
                  비고 정보가 없습니다. '수정' 버튼을 클릭하여 추가하세요.
                </p>
              )}
            </div>
          )}
        </div>

        {/* 담당자 정보 */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-gray-900">담당자</h2>
            <button
              onClick={onEditContacts}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              관리
            </button>
          </div>

          {isLoading ? (
            <Skeleton variant="rectangular" width="100%" height={80} />
          ) : (
            <div className="max-h-24 overflow-y-auto">
              {contacts && contacts.length > 0 ? (
                <div className="space-y-2">
                  {contacts.map((contact: Contact, index: number) => {
                    if (!contact.resign) {
                      return (
                        <div key={contact.id || index} className="text-sm">
                          <div className="flex items-center">
                            <div
                              className="font-medium text-blue-600 cursor-pointer hover:underline"
                              onClick={() =>
                                router.push(`/manage/contacts/${contact.id}`)
                              }
                            >
                              {contact.contact_name}{" "}
                              {contact.level && `(${contact.level})`}
                            </div>
                          </div>
                          <div className="mt-0.5 text-xs text-gray-500">
                            {contact.email && (
                              <div className="mt-0.5 text-xs text-gray-500">
                                {contact.email}
                              </div>
                            )}
                            {contact.department && `${contact.department} · `}
                            {contact.mobile || "-"}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ) : (
                <p className="text-gray-500 italic text-xs">
                  담당자 정보가 없습니다. '관리' 버튼을 클릭하여 추가하세요.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
