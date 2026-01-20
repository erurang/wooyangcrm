"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircularProgress } from "@mui/material";
import { User, Building, Briefcase, Mail, Phone, Edit } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useCompanySearch } from "@/hooks/manage/contacts/useCompanySearch";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { formatPhoneNumber } from "@/lib/formatPhoneNumber";

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
    return companies.filter((c: any) => c.name.includes(debouncedInputCompanyName));
  }, [debouncedInputCompanyName, companies]);

  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);

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

  if (!isOpen) return null;

  const title = mode === "add" ? "담당자 추가" : "담당자 수정";
  const saveButtonText = mode === "add" ? "저장" : "수정";
  const IconComponent = mode === "add" ? User : Edit;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white px-4 pt-4 pb-4 sm:p-6 sm:pb-4 flex-1 overflow-y-auto">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <IconComponent className="h-6 w-6 text-blue-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {title}
                  </h3>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          onChange={(e) =>
                            onContactDataChange({ level: e.target.value })
                          }
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
                          onChange={(e) =>
                            onContactDataChange({ email: e.target.value })
                          }
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
                            onContactDataChange({ mobile: formatPhoneNumber(e.target.value) })
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
                        onChange={(e) =>
                          onContactDataChange({ notes: e.target.value })
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="담당자에 대한 추가 정보를 입력하세요."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row gap-2 sm:flex-row-reverse shrink-0 border-t">
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="flex-1 sm:flex-none inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2.5 sm:py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {isSaving ? (
                  <>
                    <CircularProgress size={18} className="mr-2" />
                    저장 중...
                  </>
                ) : (
                  saveButtonText
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 sm:flex-none inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2.5 sm:py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                취소
              </button>
            </div>
          </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
