"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircularProgress } from "@mui/material";
import {
  CompanyBasicInfoForm,
  ContactsSection,
} from "./form";

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

interface CompanyFormModalProps {
  mode: "add" | "edit";
  isOpen: boolean;
  company: Company;
  setCompany: (company: Company) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  saving: boolean;
}

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
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <motion.div
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-50"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                      {title}
                    </h3>

                    <CompanyBasicInfoForm
                      company={company}
                      onChange={handleCompanyChange}
                    />

                    <ContactsSection
                      contacts={company.contact}
                      mode={mode}
                      onAddContact={addContact}
                      onContactChange={handleContactChange}
                      onRemoveContact={removeContact}
                    />

                    {/* Notes */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        비고
                      </label>
                      <textarea
                        value={company.notes || ""}
                        onChange={(e) =>
                          setCompany({ ...company, notes: e.target.value })
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="거래처의 유의사항 또는 담당자별 유의사항을 작성해주세요."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={saving}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
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
                  onClick={onClose}
                  disabled={saving}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
