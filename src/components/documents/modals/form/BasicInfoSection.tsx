"use client";

import { Building, Phone, Printer, User, ChevronDown } from "lucide-react";

interface Contact {
  resign: boolean | null;
  id: string;
  contact_name: string;
  level: string;
}

interface NewDocument {
  company_name: string;
  phone: string;
  fax: string;
  contact: string;
}

interface BasicInfoSectionProps {
  newDocument: NewDocument;
  setNewDocument: (doc: any) => void;
  contacts: Contact[];
  iconColor: string;
  focusClass: string;
}

export default function BasicInfoSection({
  newDocument,
  setNewDocument,
  contacts,
  iconColor,
  focusClass,
}: BasicInfoSectionProps) {
  return (
    <div className="bg-gray-50 p-5 rounded-xl">
      <div className="flex items-center gap-2 mb-4 text-gray-800">
        <Building className={`h-5 w-5 ${iconColor}`} />
        <h4 className="text-lg font-semibold">기본 정보</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            회사명
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              disabled
              value={newDocument.company_name}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            전화
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              disabled
              value={newDocument.phone}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            팩스
          </label>
          <div className="relative">
            <Printer className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              disabled
              value={newDocument.fax}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            담당자명 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={newDocument.contact}
              onChange={(e) =>
                setNewDocument({ ...newDocument, contact: e.target.value })
              }
              className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm ${focusClass} focus:border-transparent appearance-none bg-white`}
            >
              <option value="">선택</option>
              {contacts.map((contact) => {
                if (!contact.resign)
                  return (
                    <option key={contact.id} value={contact.contact_name}>
                      {contact.contact_name} {contact.level}
                    </option>
                  );
              })}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
