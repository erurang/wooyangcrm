"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { User, Building, Briefcase, Mail, Phone } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useCompanySearch } from "@/hooks/manage/contacts/useCompanySearch";
import { formatPhoneNumber } from "@/lib/formatPhoneNumber";
import FormModal from "@/components/ui/FormModal";

interface ContactData {
  contactName: string;
  department: string;
  level: string;
  email: string;
  mobile: string;
  notes: string;
  companyName: string;
}

interface ContactModalProps {
  mode: "add" | "edit";
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
  contactData: ContactData;
  onContactDataChange: (data: Partial<ContactData>) => void;
}

export default function ContactModal({
  mode,
  isOpen,
  onClose,
  onSave,
  isSaving,
  contactData,
  onContactDataChange,
}: ContactModalProps) {
  const dropdownRef = useRef<HTMLUListElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const debouncedInputCompanyName = useDebounce(contactData.companyName, 300);
  const { companies } = useCompanySearch(contactData.companyName);

  const filteredCompanies = useMemo(() => {
    if (!debouncedInputCompanyName) return [];
    return companies.filter((c: any) =>
      c.name.includes(debouncedInputCompanyName)
    );
  }, [debouncedInputCompanyName, companies]);

  useEffect(() => {
    setIsDropdownOpen(filteredCompanies.length > 0 && mode === "add");
  }, [filteredCompanies, mode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveButtonText = mode === "add" ? "저장" : "수정";

  return (
    <FormModal
      mode={mode}
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      isSaving={isSaving}
      title={{ add: "담당자 추가", edit: "담당자 수정" }}
      size="lg"
      saveText={saveButtonText}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 거래처명 */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            거래처명 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="거래처명 입력"
              value={contactData.companyName}
              onChange={(e) =>
                onContactDataChange({ companyName: e.target.value })
              }
              disabled={mode === "edit"}
              className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                mode === "edit" ? "bg-gray-50 cursor-not-allowed" : ""
              }`}
            />
            <Building
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />

            {isDropdownOpen && mode === "add" && (
              <ul
                ref={dropdownRef}
                className="absolute left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 z-10 shadow-lg max-h-36 overflow-y-auto"
              >
                {filteredCompanies.map((company: any) => (
                  <li
                    key={company.id}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onContactDataChange({ companyName: company.name });
                      setIsDropdownOpen(false);
                    }}
                  >
                    {company.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 담당자명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            담당자명 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={contactData.contactName}
              onChange={(e) =>
                onContactDataChange({ contactName: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="담당자명 입력"
            />
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {/* 직급 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            직급
          </label>
          <div className="relative">
            <input
              type="text"
              value={contactData.level}
              onChange={(e) => onContactDataChange({ level: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="직급 입력"
            />
            <Briefcase
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {/* 부서 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            부서
          </label>
          <div className="relative">
            <input
              type="text"
              value={contactData.department}
              onChange={(e) =>
                onContactDataChange({ department: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="부서 입력"
            />
            <Building
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {/* 이메일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이메일
          </label>
          <div className="relative">
            <input
              type="email"
              value={contactData.email}
              onChange={(e) => onContactDataChange({ email: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="이메일 입력"
            />
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {/* 연락처 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            연락처
          </label>
          <div className="relative">
            <input
              type="text"
              value={contactData.mobile}
              onChange={(e) =>
                onContactDataChange({
                  mobile: formatPhoneNumber(e.target.value),
                })
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="010-1234-5678"
              maxLength={13}
            />
            <Phone
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {/* 비고 */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            비고
          </label>
          <textarea
            value={contactData.notes}
            onChange={(e) => onContactDataChange({ notes: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="담당자에 대한 추가 정보를 입력하세요."
          ></textarea>
        </div>
      </div>
    </FormModal>
  );
}
