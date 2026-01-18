"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, GripVertical, Users } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Contact {
  id: string;
  contact_name: string;
  mobile: string;
  department: string;
  level: string;
  email: string;
  resign: boolean;
  sort_order: null | number;
  company_id?: string;
}

interface ContactsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  originalContacts: Contact[];
  onSave: () => Promise<void>;
  saving: boolean;
}

function SortableContactItem({
  contact,
  index,
  handleContactChange,
}: {
  contact: Contact;
  index: number;
  handleContactChange: (
    index: number,
    field: keyof Contact,
    value: string | boolean | number | null
  ) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: contact.id || index,
    });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-600 mt-6"
        >
          <GripVertical size={16} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 flex-1">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={contact?.contact_name || ""}
              onChange={(e) =>
                handleContactChange(index, "contact_name", e.target.value)
              }
              placeholder="이름"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              직급
            </label>
            <input
              type="text"
              value={contact?.level || ""}
              onChange={(e) =>
                handleContactChange(index, "level", e.target.value)
              }
              placeholder="직급"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              부서
            </label>
            <input
              type="text"
              value={contact?.department || ""}
              onChange={(e) =>
                handleContactChange(index, "department", e.target.value)
              }
              placeholder="부서"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              휴대폰
            </label>
            <input
              type="text"
              value={contact?.mobile || ""}
              onChange={(e) =>
                handleContactChange(index, "mobile", e.target.value)
              }
              placeholder="010-0000-0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              이메일
            </label>
            <input
              type="email"
              value={contact?.email || ""}
              onChange={(e) =>
                handleContactChange(index, "email", e.target.value)
              }
              placeholder="email@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center mt-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={contact?.resign || false}
              onChange={(e) =>
                handleContactChange(index, "resign", e.target.checked)
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600">퇴사</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default function ContactsEditModal({
  isOpen,
  onClose,
  contacts,
  setContacts,
  originalContacts,
  onSave,
  saving,
}: ContactsEditModalProps) {
  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = contacts.findIndex(
        (contact: Contact, idx: number) => (contact.id || idx) === active.id
      );
      const newIndex = contacts.findIndex(
        (contact: Contact, idx: number) => (contact.id || idx) === over?.id
      );
      setContacts(arrayMove(contacts, oldIndex, newIndex));
    }
  };

  const handleContactChange = (
    index: number,
    field: keyof Contact,
    value: string | boolean | number | null
  ) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setContacts(updatedContacts);
  };

  const addContact = () => {
    setContacts([
      {
        id: "",
        contact_name: "",
        mobile: "",
        department: "",
        level: "",
        email: "",
        resign: false,
        sort_order: null,
      },
      ...contacts,
    ]);
  };

  const handleCancel = () => {
    setContacts(originalContacts);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  담당자 관리
                </h3>
              </div>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  담당자 정보를 관리합니다. 드래그하여 순서를 변경할 수 있습니다.
                </p>
                <button
                  onClick={addContact}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  담당자 추가
                </button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={contacts.map(
                    (contact: Contact, idx: number) => contact.id || idx
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {contacts?.map((contact: Contact, index: number) => {
                      if (!contact.resign)
                        return (
                          <SortableContactItem
                            key={contact.id || index}
                            contact={contact}
                            index={index}
                            handleContactChange={handleContactChange}
                          />
                        );
                      return null;
                    })}
                  </div>
                </SortableContext>
              </DndContext>

              {contacts.some((c) => c.resign) && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">퇴사자</p>
                  <div className="space-y-2">
                    {contacts
                      .filter((c) => c.resign)
                      .map((contact, idx) => (
                        <div
                          key={contact.id || `resigned-${idx}`}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm text-gray-500"
                        >
                          <span>
                            {contact.contact_name} {contact.level && `(${contact.level})`}
                          </span>
                          <button
                            onClick={() => {
                              const originalIndex = contacts.findIndex(
                                (c) => c.id === contact.id
                              );
                              if (originalIndex !== -1) {
                                handleContactChange(originalIndex, "resign", false);
                              }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            복구
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end items-center gap-3 px-4 py-3 bg-gray-50 border-t">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={onSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
