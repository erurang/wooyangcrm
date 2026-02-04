"use client";

import { motion } from "framer-motion";
import FormModal from "@/components/ui/FormModal";

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
  rnds_contacts?: Contact[];
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
  return (
    <FormModal
      mode={mode}
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      isSaving={isSaving}
      title={{ add: "지원기관 추가", edit: "지원기관 수정" }}
      size="md"
    >
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
            onChange={(e) => onOrgDataChange({ phone: e.target.value })}
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
            onChange={(e) => onOrgDataChange({ fax: e.target.value })}
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
                onChange={(e) => onContactChange(index, "phone", e.target.value)}
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
        />
      </div>
    </FormModal>
  );
}
