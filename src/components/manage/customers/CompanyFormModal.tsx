"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Save, X, Building2 } from "lucide-react";
import {
  CompanyBasicInfoForm,
  ContactsSection,
} from "./form";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface Contact {
  contact_name: string;
  mobile: string;
  department: string;
  level: string;
  email: string;
  resign: boolean;
}

interface Company {
  id: string;
  company_code: string;
  name: string;
  business_number: string;
  address: string;
  industry: string[];
  phone: string;
  fax: string;
  email: string;
  notes: string;
  contact: Contact[];
  parcel: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  business_number?: string;
}

interface CompanyFormModalProps {
  mode: "add" | "edit";
  isOpen: boolean;
  company: Company;
  setCompany: (company: Company) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  saving: boolean;
}

const isValidEmail = (email: string) => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function CompanyFormModal({
  mode,
  isOpen,
  company,
  setCompany,
  onClose,
  onSubmit,
  saving,
}: CompanyFormModalProps) {
  const title = mode === "add" ? "거래처 추가" : "거래처 수정";
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [company]);

  const clearError = useCallback((field: keyof FormErrors) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    await onSubmit();
  }, [validateForm, onSubmit]);

  const handleClose = useCallback(() => {
    setErrors({});
    onClose();
  }, [onClose]);

  const handleCompanyChange = (field: keyof Company, value: string) => {
    setCompany({ ...company, [field]: value });
  };

  const addContact = () => {
    setCompany({
      ...company,
      contact: [
        {
          contact_name: "",
          mobile: "",
          department: "",
          level: "",
          email: "",
          resign: false,
        },
        ...(company?.contact || []),
      ],
    });
  };

  const handleContactChange = (
    index: number,
    field: keyof Contact,
    value: any
  ) => {
    const updatedContact = [...company.contact];
    updatedContact[index] = { ...updatedContact[index], [field]: value };
    setCompany({ ...company, contact: updatedContact });
  };

  const removeContact = (index: number) => {
    const updatedContact = [...company.contact];
    updatedContact.splice(index, 1);
    setCompany({ ...company, contact: updatedContact });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-50 rounded-xl">
                  <Building2 className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                  <p className="text-xs text-slate-400">거래처 정보를 입력해주세요</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 본문 */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <CompanyBasicInfoForm
                company={company}
                onChange={handleCompanyChange}
                errors={errors}
                onClearError={clearError}
              />

              <ContactsSection
                contacts={company.contact}
                mode={mode}
                onAddContact={addContact}
                onContactChange={handleContactChange}
                onRemoveContact={removeContact}
              />

              {/* 비고 */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  비고
                </label>
                <textarea
                  value={company.notes || ""}
                  onChange={(e) =>
                    setCompany({ ...company, notes: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 bg-slate-50/50 hover:bg-white transition-all placeholder:text-slate-300 text-sm leading-relaxed resize-none"
                  placeholder="거래처의 유의사항 또는 담당자별 유의사항을 작성해주세요."
                />
              </div>
            </div>

            {/* 하단 액션 바 */}
            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-slate-200/60 bg-slate-50/50">
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-sm shadow-sky-200 hover:shadow-md hover:shadow-sky-200 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    저장
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
