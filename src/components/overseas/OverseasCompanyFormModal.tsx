"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircularProgress } from "@mui/material";
import { Plus, Trash2, User } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { OverseasContact } from "@/types/overseas";

interface OverseasCompanyFormData {
  id?: string;
  name: string;
  address: string;
  email: string;
  website: string;
  notes: string;
  contacts: OverseasContact[];
}

interface FormErrors {
  name?: string;
  email?: string;
  contacts?: string;
}

interface OverseasCompanyFormModalProps {
  mode: "add" | "edit";
  isOpen: boolean;
  company: OverseasCompanyFormData;
  setCompany: (company: OverseasCompanyFormData) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  saving: boolean;
}

const isValidEmail = (email: string) => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const emptyContact: OverseasContact = {
  name: "",
  email: "",
  mobile: "",
  department: "",
  position: "",
};

export default function OverseasCompanyFormModal({
  mode,
  isOpen,
  company,
  setCompany,
  onClose,
  onSubmit,
  saving,
}: OverseasCompanyFormModalProps) {
  const title = mode === "add" ? "해외 거래처 추가" : "해외 거래처 수정";
  const [errors, setErrors] = useState<FormErrors>({});

  useEscapeKey(isOpen, onClose);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!company.name?.trim()) {
      newErrors.name = "거래처명을 입력해주세요.";
    }

    if (company.email && !isValidEmail(company.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다.";
    }

    // 추가 모드에서 담당자 필수 검증
    if (mode === "add") {
      const validContacts = company.contacts?.filter((c) => c.name?.trim());
      if (!validContacts || validContacts.length === 0) {
        newErrors.contacts = "최소 1명의 담당자를 등록해주세요.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [company, mode]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    await onSubmit();
  }, [validateForm, onSubmit]);

  const handleClose = useCallback(() => {
    setErrors({});
    onClose();
  }, [onClose]);

  // 담당자 추가
  const addContact = () => {
    setCompany({
      ...company,
      contacts: [{ ...emptyContact }, ...(company.contacts || [])],
    });
    // 에러 클리어
    if (errors.contacts) {
      setErrors((prev) => ({ ...prev, contacts: undefined }));
    }
  };

  // 담당자 수정
  const updateContact = (index: number, field: keyof OverseasContact, value: string) => {
    const updatedContacts = [...(company.contacts || [])];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setCompany({ ...company, contacts: updatedContacts });
  };

  // 담당자 삭제
  const removeContact = (index: number) => {
    const updatedContacts = [...(company.contacts || [])];
    updatedContacts.splice(index, 1);
    setCompany({ ...company, contacts: updatedContacts });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-black/50"></div>
            </div>

            <motion.div
              className="fixed inset-0 bg-white flex flex-col sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:shadow-xl sm:max-w-3xl sm:w-[calc(100%-2rem)] sm:max-h-[90vh] z-50"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white px-4 pt-4 pb-4 sm:p-6 sm:pb-4 flex-1 overflow-y-auto">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                      {title}
                    </h3>

                    <div className="space-y-4">
                      {/* 거래처명 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          거래처명 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={company.name || ""}
                          onChange={(e) =>
                            setCompany({ ...company, name: e.target.value })
                          }
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.name ? "border-red-500" : "border-gray-300"
                          }`}
                          placeholder="해외 거래처명"
                        />
                        {errors.name && (
                          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                        )}
                      </div>

                      {/* 주소 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          주소
                        </label>
                        <input
                          type="text"
                          value={company.address || ""}
                          onChange={(e) =>
                            setCompany({ ...company, address: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="주소"
                        />
                      </div>

                      {/* 이메일 & 홈페이지 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            대표 이메일
                          </label>
                          <input
                            type="email"
                            value={company.email || ""}
                            onChange={(e) =>
                              setCompany({ ...company, email: e.target.value })
                            }
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors.email ? "border-red-500" : "border-gray-300"
                            }`}
                            placeholder="email@example.com"
                          />
                          {errors.email && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.email}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            홈페이지
                          </label>
                          <input
                            type="text"
                            value={company.website || ""}
                            onChange={(e) =>
                              setCompany({ ...company, website: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>

                      {/* 담당자 섹션 */}
                      <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-500" />
                            <label className="text-sm font-medium text-gray-700">
                              담당자 {mode === "add" && <span className="text-red-500">*</span>}
                            </label>
                            {errors.contacts && (
                              <span className="text-red-500 text-xs ml-2">
                                {errors.contacts}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={addContact}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                          >
                            <Plus size={14} />
                            담당자 추가
                          </button>
                        </div>

                        {company.contacts && company.contacts.length > 0 ? (
                          <div className="space-y-3">
                            {company.contacts.map((contact, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 rounded-lg p-3 relative"
                              >
                                <button
                                  type="button"
                                  onClick={() => removeContact(index)}
                                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                      이름 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={contact.name || ""}
                                      onChange={(e) =>
                                        updateContact(index, "name", e.target.value)
                                      }
                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      placeholder="담당자명"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                      이메일
                                    </label>
                                    <input
                                      type="email"
                                      value={contact.email || ""}
                                      onChange={(e) =>
                                        updateContact(index, "email", e.target.value)
                                      }
                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      placeholder="이메일"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                      연락처
                                    </label>
                                    <input
                                      type="text"
                                      value={contact.mobile || ""}
                                      onChange={(e) =>
                                        updateContact(index, "mobile", e.target.value)
                                      }
                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      placeholder="연락처"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                      부서
                                    </label>
                                    <input
                                      type="text"
                                      value={contact.department || ""}
                                      onChange={(e) =>
                                        updateContact(index, "department", e.target.value)
                                      }
                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      placeholder="부서"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                      직책
                                    </label>
                                    <input
                                      type="text"
                                      value={contact.position || ""}
                                      onChange={(e) =>
                                        updateContact(index, "position", e.target.value)
                                      }
                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      placeholder="직책"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={`text-center py-4 text-sm rounded-lg ${
                            errors.contacts
                              ? "bg-red-50 text-red-500 border border-red-200"
                              : "bg-gray-50 text-gray-400"
                          }`}>
                            {mode === "add"
                              ? "담당자를 추가해주세요 (필수)"
                              : "등록된 담당자가 없습니다"}
                          </div>
                        )}
                      </div>

                      {/* 비고 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          비고
                        </label>
                        <textarea
                          value={company.notes || ""}
                          onChange={(e) =>
                            setCompany({ ...company, notes: e.target.value })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="비고"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row gap-2 sm:flex-row-reverse shrink-0 border-t">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 sm:flex-none inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2.5 sm:py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {saving ? (
                    <>
                      <CircularProgress size={18} className="mr-2" />
                      저장 중...
                    </>
                  ) : (
                    "저장"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="flex-1 sm:flex-none inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2.5 sm:py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  취소
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
