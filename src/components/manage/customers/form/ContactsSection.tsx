"use client";

import { Plus, User, Users } from "lucide-react";
import ContactFormCard from "./ContactFormCard";

interface Contact {
  contact_name: string;
  mobile: string;
  department: string;
  level: string;
  email: string;
  resign: boolean;
}

interface ContactsSectionProps {
  contacts: Contact[];
  mode: "add" | "edit";
  onAddContact: () => void;
  onContactChange: (index: number, field: keyof Contact, value: string | boolean) => void;
  onRemoveContact: (index: number) => void;
}

export default function ContactsSection({
  contacts,
  mode,
  onAddContact,
  onContactChange,
  onRemoveContact,
}: ContactsSectionProps) {
  return (
    <div className="mt-7">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-50 rounded-lg">
            <Users className="h-4 w-4 text-violet-600" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            담당자 <span className="text-red-500">*</span>
          </h4>
          {contacts && contacts.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-violet-100 text-violet-700 rounded-full tabular-nums">
              {contacts.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onAddContact}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl transition-all duration-200"
        >
          <Plus size={14} />
          담당자 추가
        </button>
      </div>

      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
        {contacts && contacts.length > 0 ? (
          <div className="space-y-3">
            {contacts.map((contact, index) => (
              <ContactFormCard
                key={index}
                contact={contact}
                index={index}
                mode={mode}
                onChange={(field, value) => onContactChange(index, field, value)}
                onRemove={() => onRemoveContact(index)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <User size={28} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400 font-medium">
              담당자가 없습니다. 담당자를 추가해주세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
