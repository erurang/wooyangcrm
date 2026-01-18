"use client";

import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Phone,
  Printer,
  Truck,
  FileText,
  Users,
  Edit3,
  Settings,
  Mail,
} from "lucide-react";

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
  onEditCompany?: () => void;
}

export default function CompanyInfoCard({
  companyDetail,
  contacts,
  isLoading,
  onEditNotes,
  onEditContacts,
  onEditCompany,
}: CompanyInfoCardProps) {
  const router = useRouter();

  const formatContentWithLineBreaks = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  const activeContacts = contacts.filter((c) => !c.resign);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-3 bg-slate-200 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
      {/* 통합 레이아웃 */}
      <div className="flex flex-col lg:flex-row">
        {/* 좌측: 거래처 기본 정보 */}
        <div className="flex-1 p-4 lg:border-r border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">
                거래처 정보
              </h3>
            </div>
            {onEditCompany && (
              <button
                onClick={onEditCompany}
                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
              >
                <Edit3 size={12} />
                수정
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-slate-500">주소</div>
                <div
                  className="text-sm text-slate-800 truncate max-w-[11rem]"
                  title={companyDetail?.address || ""}
                >
                  {companyDetail?.address || "-"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Truck size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-slate-500">배송</div>
                <div
                  className="text-sm text-slate-800 truncate max-w-[11rem]"
                  title={companyDetail?.parcel || ""}
                >
                  {companyDetail?.parcel || "-"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Phone size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-slate-500">전화</div>
                <div className="text-sm text-slate-800 max-w-[11rem]">
                  {companyDetail?.phone || "-"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Printer size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-slate-500">팩스</div>
                <div className="text-sm text-slate-800 max-w-[11rem]">
                  {companyDetail?.fax || "-"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 col-span-2">
              <Mail size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-slate-500">대표메일</div>
                <div className="text-sm text-slate-800 truncate max-w-[11rem]">
                  {companyDetail?.email ? (
                    <a
                      href={`mailto:${companyDetail.email}`}
                      className="text-cyan-600 hover:underline"
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
        <div className="flex-1 p-4 lg:border-r border-slate-100 border-t lg:border-t-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">비고</h3>
            </div>
            <button
              onClick={onEditNotes}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
            >
              <Edit3 size={12} />
              수정
            </button>
          </div>

          <div className="text-sm text-slate-700 h-[9rem] overflow-y-auto leading-relaxed">
            {companyDetail?.notes ? (
              formatContentWithLineBreaks(companyDetail.notes)
            ) : (
              <span className="text-slate-400 text-xs">비고 없음</span>
            )}
          </div>
        </div>

        {/* 우측: 담당자 */}
        <div className="w-full lg:w-80 p-4 border-t lg:border-t-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">
                담당자
                {activeContacts.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                    {activeContacts.length}
                  </span>
                )}
              </h3>
            </div>
            <button
              onClick={onEditContacts}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
            >
              <Settings size={12} />
              관리
            </button>
          </div>

          <div className="overflow-y-auto">
            {activeContacts.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {activeContacts.slice(0, 4).map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between gap-1 group p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div
                      className="min-w-0 cursor-pointer flex-1"
                      onClick={() =>
                        router.push(`/manage/contacts/${contact.id}`)
                      }
                    >
                      <div className="text-sm font-medium text-slate-800 group-hover:text-cyan-600 truncate">
                        {contact.contact_name}
                        {contact.level && (
                          <span className="text-slate-500 font-normal ml-1 text-xs">
                            {contact.level}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {contact.mobile || contact.email || "-"}
                      </div>
                    </div>
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="p-1 text-slate-400 hover:text-cyan-600 shrink-0"
                        title="이메일 보내기"
                      >
                        <Mail size={14} />
                      </a>
                    )}
                  </div>
                ))}
                {activeContacts.length > 4 && (
                  <button
                    onClick={onEditContacts}
                    className="col-span-2 text-xs text-slate-500 hover:text-cyan-600 text-center py-1"
                  >
                    +{activeContacts.length - 4}명 더보기
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-2">
                <span className="text-slate-400 text-xs">담당자 없음</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
