"use client";

import {
  Building2,
  MapPin,
  Mail,
  Globe,
  FileText,
  Users,
  Edit3,
  Settings,
  ExternalLink,
} from "lucide-react";
import { OverseasContact } from "@/types/overseas";

interface OverseasCompany {
  id: string;
  name: string;
  address?: string;
  email?: string;
  website?: string;
  notes?: string;
  contacts?: OverseasContact[];
}

interface OverseasCompanyInfoCardProps {
  companyDetail: OverseasCompany | null;
  contacts: OverseasContact[];
  isLoading: boolean;
  onEditNotes: () => void;
  onEditContacts: () => void;
  onEditCompany?: () => void;
}

export default function OverseasCompanyInfoCard({
  companyDetail,
  contacts,
  isLoading,
  onEditNotes,
  onEditContacts,
  onEditCompany,
}: OverseasCompanyInfoCardProps) {
  const formatContentWithLineBreaks = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm mb-4 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm mb-4 overflow-hidden">
      {/* 통합 레이아웃 - 기존 CompanyInfoCard와 동일 */}
      <div className="flex flex-col lg:flex-row">
        {/* 좌측: 거래처 기본 정보 */}
        <div className="flex-1 p-4 lg:border-r border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">
                거래처 정보
              </h3>
            </div>
            {onEditCompany && (
              <button
                onClick={onEditCompany}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Edit3 size={12} />
                수정
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-gray-500">주소</div>
                <div
                  className="text-sm text-gray-900 truncate max-w-[11rem]"
                  title={companyDetail?.address || ""}
                >
                  {companyDetail?.address || "-"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Globe size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-gray-500">홈페이지</div>
                {companyDetail?.website ? (
                  <a
                    href={
                      companyDetail.website.startsWith("http")
                        ? companyDetail.website
                        : `https://${companyDetail.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[11rem]"
                  >
                    <ExternalLink size={12} className="shrink-0" />
                    <span className="truncate">
                      {companyDetail.website.replace(/^https?:\/\//, "")}
                    </span>
                  </a>
                ) : (
                  <div className="text-sm text-gray-900">-</div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 col-span-2">
              <Mail size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-gray-500">대표메일</div>
                <div className="text-sm text-gray-900 truncate max-w-[11rem]">
                  {companyDetail?.email ? (
                    <a
                      href={`mailto:${companyDetail.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {companyDetail.email}
                    </a>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 중앙: 비고 */}
        <div className="flex-1 p-4 lg:border-r border-gray-100 border-t lg:border-t-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">비고</h3>
            </div>
            <button
              onClick={onEditNotes}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Edit3 size={12} />
              수정
            </button>
          </div>

          <div className="text-sm text-gray-700 h-[6rem] overflow-y-auto leading-relaxed">
            {companyDetail?.notes ? (
              formatContentWithLineBreaks(companyDetail.notes)
            ) : (
              <span className="text-gray-400 text-xs">비고 없음</span>
            )}
          </div>
        </div>

        {/* 우측: 담당자 */}
        <div className="w-full lg:w-80 p-4 border-t lg:border-t-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">
                담당자
                {contacts.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                    {contacts.length}
                  </span>
                )}
              </h3>
            </div>
            <button
              onClick={onEditContacts}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Settings size={12} />
              관리
            </button>
          </div>

          <div className="overflow-y-auto max-h-24">
            {contacts.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {contacts.slice(0, 4).map((contact, index) => (
                  <div
                    key={contact.id || index}
                    className="flex items-center justify-between gap-1 group p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {contact.name}
                        {contact.position && (
                          <span className="text-gray-500 font-normal ml-1 text-xs">
                            {contact.position}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {contact.mobile || contact.email || "-"}
                      </div>
                    </div>
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="p-1 text-gray-400 hover:text-blue-600 shrink-0"
                        title="이메일 보내기"
                      >
                        <Mail size={14} />
                      </a>
                    )}
                  </div>
                ))}
                {contacts.length > 4 && (
                  <button
                    onClick={onEditContacts}
                    className="col-span-2 text-xs text-gray-500 hover:text-blue-600 text-center py-1"
                  >
                    +{contacts.length - 4}명 더보기
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-2">
                <span className="text-gray-400 text-xs">담당자 없음</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
