"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircularProgress } from "@mui/material";
import { X, Plus, GripVertical } from "lucide-react";
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
    value: any
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
      {...attributes}
      {...listeners}
      className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex flex-wrap md:flex-nowrap gap-3">
        <div className="cursor-grab flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-600">
          <GripVertical size={18} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 w-full">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              이름
            </label>
            <input
              type="text"
              value={contact?.contact_name || ""}
              onChange={(e) =>
                handleContactChange(index, "contact_name", e.target.value)
              }
              placeholder="이름"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              placeholder="휴대폰"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              placeholder="이메일"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-end pb-1">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={contact?.resign || false}
              onChange={(e) =>
                handleContactChange(index, "resign", e.target.checked)
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">퇴사</span>
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
    value: any
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
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                담당자 관리
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <p className="mb-4 text-sm text-gray-600">
                담당자 정보를 관리합니다. 순서를 변경하려면 드래그하여
                이동하세요. 퇴사를 선택하면 담당자 선택 목록에 나타나지 않습니다.
              </p>

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
                  <div className="space-y-3 max-h-96 overflow-y-auto p-1">
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

              <button
                onClick={addContact}
                className="mt-4 flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                <Plus size={16} />
                <span>담당자 추가</span>
              </button>
            </div>

            <div className="flex justify-end items-center gap-3 px-5 py-4 bg-gray-50 border-t">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={onSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <CircularProgress size={16} className="mr-2" />
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
