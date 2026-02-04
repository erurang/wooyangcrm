"use client";

import { X } from "lucide-react";

interface Contact {
  contact_name: string;
  mobile: string;
  department: string;
  level: string;
  email: string;
  resign: boolean;
}

interface ContactFormCardProps {
  contact: Contact;
  index: number;
  mode: "add" | "edit";
  onChange: (field: keyof Contact, value: string | boolean) => void;
  onRemove: () => void;
}

export default function ContactFormCard({
  contact,
  index,
  mode,
  onChange,
  onRemove,
}: ContactFormCardProps) {
  return (
    <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <h5 className="text-sm font-medium text-gray-900">
          담당자 #{index + 1}
        </h5>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center p-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={contact.contact_name || ""}
            onChange={(e) => onChange("contact_name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="이름"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            직급
          </label>
          <input
            type="text"
            value={contact.level || ""}
            onChange={(e) => onChange("level", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="직급"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            부서
          </label>
          <input
            type="text"
            value={contact.department || ""}
            onChange={(e) => onChange("department", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="부서"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            휴대폰
          </label>
          <input
            type="text"
            value={contact.mobile || ""}
            onChange={(e) => onChange("mobile", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="010-1234-5678"
            maxLength={13}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            이메일
          </label>
          <input
            type="email"
            value={contact.email || ""}
            onChange={(e) => onChange("email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="email@example.com"
          />
        </div>

        {mode === "edit" && (
          <div className="flex items-center">
            <label className="inline-flex items-center mt-3">
              <input
                type="checkbox"
                checked={contact.resign || false}
                onChange={(e) => onChange("resign", e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">퇴사</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
