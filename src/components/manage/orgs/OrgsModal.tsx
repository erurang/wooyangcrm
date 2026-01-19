"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CircularProgress } from "@mui/material";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { formatPhoneNumber } from "@/lib/formatPhoneNumber";

interface Contact {
  id?: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  level: string;
}

interface RnDsOrgs {
  id: string;
  name: string;
  address: string;
  notes: string;
  phone: string;
  fax: string;
  email: string;
  rnds_contacts: Contact[];
}

interface OrgsModalProps {
  mode: "add" | "edit";
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
  orgData: RnDsOrgs;
  onOrgDataChange: (data: Partial<RnDsOrgs>) => void;
  onAddContact: () => void;
  onContactChange: (index: number, field: keyof Contact, value: string) => void;
  onRemoveContact: (index: number) => void;
}

export default function OrgsModal({
  mode,
  isOpen,
  onClose,
  onSave,
  isSaving,
  orgData,
  onOrgDataChange,
  onAddContact,
  onContactChange,
  onRemoveContact,
}: OrgsModalProps) {
  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const title = mode === "add" ? "지원기관 추가" : "지원기관 수정";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex justify-center items-center bg-black/50 z-50 sm:px-2"
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white w-full h-full sm:h-auto sm:rounded-md sm:w-11/12 md:w-2/3 sm:max-h-[85vh] overflow-y-auto flex flex-col">
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">
              {title}
            </h3>

          {/* Organization Fields */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="mb-2">
              <label className="block mb-1">기관명</label>
              <motion.input
                whileFocus={{
                  scale: 1.05,
                  boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                }}
                type="text"
                value={orgData.name || ""}
                onChange={(e) => onOrgDataChange({ name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1">주소</label>
              <motion.input
                whileFocus={{
                  scale: 1.05,
                  boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                }}
                type="text"
                value={orgData.address || ""}
                onChange={(e) => onOrgDataChange({ address: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1">번호</label>
              <motion.input
                whileFocus={{
                  scale: 1.05,
                  boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                }}
                value={orgData.phone || ""}
                type="text"
                onChange={(e) => onOrgDataChange({ phone: formatPhoneNumber(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="02-1234-5678"
                maxLength={13}
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1">팩스</label>
              <motion.input
                whileFocus={{
                  scale: 1.05,
                  boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                }}
                type="text"
                value={orgData.fax || ""}
                onChange={(e) => onOrgDataChange({ fax: formatPhoneNumber(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="02-1234-5678"
                maxLength={13}
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1">이메일</label>
              <motion.input
                whileFocus={{
                  scale: 1.05,
                  boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                }}
                type="email"
                value={orgData.email || ""}
                onChange={(e) => onOrgDataChange({ email: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Contacts Section */}
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <label className="block mb-1">담당자</label>
              <button
                className="px-3 py-1 bg-gray-200 text-xs md:text-sm rounded-md hover:bg-gray-300"
                onClick={onAddContact}
              >
                + 추가
              </button>
            </div>

            <div className="space-y-2">
              {orgData.rnds_contacts?.map((contact, index) => (
                <div key={index} className="flex flex-wrap md:flex-nowrap gap-2">
                  <motion.input
                    type="text"
                    placeholder="이름"
                    value={contact.name || ""}
                    onChange={(e) => onContactChange(index, "name", e.target.value)}
                    className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                  />
                  <motion.input
                    type="text"
                    placeholder="010-1234-5678"
                    value={contact.phone || ""}
                    onChange={(e) => onContactChange(index, "phone", formatPhoneNumber(e.target.value))}
                    className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                    maxLength={13}
                  />
                  <motion.input
                    type="text"
                    placeholder="부서"
                    value={contact.department || ""}
                    onChange={(e) => onContactChange(index, "department", e.target.value)}
                    className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                  />
                  <motion.input
                    type="text"
                    placeholder="직급"
                    value={contact.level || ""}
                    onChange={(e) => onContactChange(index, "level", e.target.value)}
                    className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                  />
                  <motion.input
                    type="email"
                    placeholder="이메일"
                    value={contact.email || ""}
                    onChange={(e) => onContactChange(index, "email", e.target.value)}
                    className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                  />
                  <button
                    onClick={() => onRemoveContact(index)}
                    className="px-4 py-2 bg-red-500 text-white text-xs md:text-sm rounded-md"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-2">
            <label className="block mb-1">비고</label>
            <textarea
              value={orgData.notes || ""}
              onChange={(e) => onOrgDataChange({ notes: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md min-h-52"
            ></textarea>
          </div>

          </div>

          {/* Buttons */}
          <div className="flex gap-2 p-4 sm:p-6 pt-0 sm:pt-0 bg-white border-t sm:border-none shrink-0">
            <button
              onClick={onClose}
              className={`flex-1 sm:flex-none bg-gray-500 text-white px-4 py-2.5 sm:py-2 rounded-md text-sm active:bg-gray-600 ${
                isSaving ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isSaving}
            >
              취소
            </button>
            <button
              onClick={onSave}
              className={`flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 sm:py-2 rounded-md text-sm flex items-center justify-center ${
                isSaving ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isSaving}
            >
              저장
              {isSaving && <CircularProgress size={18} className="ml-2" />}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
