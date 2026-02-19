"use client";

import { Building, Phone, Printer, User, Calendar } from "lucide-react";
import HeadlessSelect from "@/components/ui/HeadlessSelect";
import type { NewDocument, Contact } from "@/types/document";

interface BasicInfoSectionProps {
  newDocument: NewDocument;
  setNewDocument: (doc: NewDocument) => void;
  contacts: Contact[];
  iconColor: string;
  focusClass: string;
  type?: string;
  mode?: "add" | "edit";
}

export default function BasicInfoSection({
  newDocument,
  setNewDocument,
  contacts,
  iconColor,
  focusClass,
  type,
  mode = "add",
}: BasicInfoSectionProps) {
  const isAddMode = mode === "add";
  const isOrder = type === "order";
  const isEstimate = type === "estimate";

  // 4번째 필드: 견적서=견적일, 의뢰서=담당자명 (발주서는 별도 레이아웃)
  const renderFourthField = () => {
    if (isEstimate) {
      return (
        <div className="col-span-2 sm:col-span-1 min-w-0">
          <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
            견적일
          </label>
          <div className="relative overflow-hidden rounded-lg">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
            <input
              type="date"
              value={newDocument.date}
              onChange={(e) =>
                setNewDocument({ ...newDocument, date: e.target.value })
              }
              className={`w-full max-w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm box-border ${focusClass} focus:border-transparent`}
            />
          </div>
        </div>
      );
    }

    // 의뢰서: 담당자명
    return (
      <div className="col-span-2 sm:col-span-1">
        <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
          담당자명 <span className="text-red-500">*</span>
        </label>
        <HeadlessSelect
          value={newDocument.contact}
          onChange={(value) =>
            setNewDocument({ ...newDocument, contact: value })
          }
          options={contacts
            .filter((c) => !c.resign)
            .map((contact) => ({
              value: contact.contact_name,
              label: contact.contact_name,
              sublabel: contact.level,
            }))}
          placeholder="선택"
          icon={<User className="h-4 w-4" />}
          focusClass={focusClass}
        />
      </div>
    );
  };

  // 발주서: 2x2 레이아웃 (회사명|전화, 팩스|발주일)
  if (isOrder) {
    return (
      <div className="bg-slate-50 p-4 sm:p-5 rounded-xl">
        <div className="flex items-center gap-2 mb-3 sm:mb-4 text-slate-700">
          <Building className={`h-5 w-5 ${iconColor}`} />
          <h4 className="text-base sm:text-lg font-semibold">기본 정보</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          {/* 1행: 회사명 | 전화 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
              회사명
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                disabled
                value={newDocument.company_name}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
              전화
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                disabled
                value={newDocument.phone}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
          {/* 2행: 팩스 | 발주일 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
              팩스
            </label>
            <div className="relative">
              <Printer className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                disabled
                value={newDocument.fax}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
              발주일
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
              <input
                type="date"
                value={newDocument.date}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, date: e.target.value })
                }
                disabled={isAddMode}
                className={`w-full max-w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm box-border ${isAddMode ? "bg-slate-100" : ""} ${focusClass} focus:border-transparent`}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 견적서, 의뢰서: 4열 레이아웃
  return (
    <div className="bg-slate-50 p-4 sm:p-5 rounded-xl">
      <div className="flex items-center gap-2 mb-3 sm:mb-4 text-slate-700">
        <Building className={`h-5 w-5 ${iconColor}`} />
        <h4 className="text-base sm:text-lg font-semibold">기본 정보</h4>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
            회사명
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              disabled
              value={newDocument.company_name}
              className="w-full pl-10 pr-4 py-2.5 sm:py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
            전화
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              disabled
              value={newDocument.phone}
              className="w-full pl-10 pr-4 py-2.5 sm:py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
            팩스
          </label>
          <div className="relative">
            <Printer className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              disabled
              value={newDocument.fax}
              className="w-full pl-10 pr-4 py-2.5 sm:py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
        {renderFourthField()}
      </div>
    </div>
  );
}
