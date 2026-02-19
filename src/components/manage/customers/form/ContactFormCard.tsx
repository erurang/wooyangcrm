"use client";

import { X, User } from "lucide-react";

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

const inputClass = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 bg-white hover:bg-slate-50/50 transition-all duration-200 placeholder:text-slate-300";

export default function ContactFormCard({
  contact,
  index,
  mode,
  onChange,
  onRemove,
}: ContactFormCardProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center">
            <User className="h-3 w-3 text-sky-600" />
          </div>
          <h5 className="text-sm font-bold text-slate-700">
            담당자 #{index + 1}
          </h5>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          title="삭제"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={contact.contact_name || ""}
            onChange={(e) => onChange("contact_name", e.target.value)}
            className={inputClass}
            placeholder="이름"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            직급
          </label>
          <input
            type="text"
            value={contact.level || ""}
            onChange={(e) => onChange("level", e.target.value)}
            className={inputClass}
            placeholder="직급"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            부서
          </label>
          <input
            type="text"
            value={contact.department || ""}
            onChange={(e) => onChange("department", e.target.value)}
            className={inputClass}
            placeholder="부서"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            휴대폰
          </label>
          <input
            type="text"
            value={contact.mobile || ""}
            onChange={(e) => onChange("mobile", e.target.value)}
            className={inputClass}
            placeholder="010-1234-5678"
            maxLength={13}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            이메일
          </label>
          <input
            type="email"
            value={contact.email || ""}
            onChange={(e) => onChange("email", e.target.value)}
            className={inputClass}
            placeholder="email@example.com"
          />
        </div>

        {mode === "edit" && (
          <div className="flex items-end pb-1">
            <label className="inline-flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={contact.resign || false}
                onChange={(e) => onChange("resign", e.target.checked)}
                className="w-4.5 h-4.5 text-sky-600 rounded-md border-slate-300 focus:ring-sky-500/30 cursor-pointer"
              />
              <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors font-medium">퇴사</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
