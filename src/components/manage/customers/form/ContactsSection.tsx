"use client";

import { Plus, User } from "lucide-react";
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
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-md font-medium text-gray-900">
          담당자 <span className="text-red-500">*</span>
        </h4>
        <button
          type="button"
          onClick={onAddContact}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={14} className="mr-1" />
          담당자 추가
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        {contacts && contacts.length > 0 ? (
          <div className="space-y-4">
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
          <div className="text-center py-6">
            <User size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">
              담당자가 없습니다. 담당자를 추가해주세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
