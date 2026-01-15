"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircularProgress } from "@mui/material";
import { X } from "lucide-react";

interface Contact {
  id: string;
  contact_name: string;
  level: string;
  resign: boolean;
}

interface User {
  id: string;
  name: string;
  level: string;
}

interface ConsultationFormData {
  date: string;
  follow_up_date: string;
  contact_name: string;
  user_id: string;
  content: string;
}

interface ConsultationFormModalProps {
  mode: "add" | "edit";
  isOpen: boolean;
  onClose: () => void;
  formData: ConsultationFormData;
  setFormData: (data: ConsultationFormData) => void;
  contacts: Contact[];
  users: User[];
  onSubmit: () => Promise<void>;
  saving: boolean;
}

export default function ConsultationFormModal({
  mode,
  isOpen,
  onClose,
  formData,
  setFormData,
  contacts,
  users,
  onSubmit,
  saving,
}: ConsultationFormModalProps) {
  const isAddMode = mode === "add";
  const title = isAddMode ? "상담 내역 추가" : "상담 내역 수정";

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
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상담일
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    후속 날짜
                  </label>
                  <input
                    type="date"
                    value={formData.follow_up_date || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        follow_up_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    담당자
                  </label>
                  <select
                    value={formData.contact_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">담당자 선택</option>
                    {contacts.map((contact) => {
                      if (!contact.resign)
                        return (
                          <option key={contact.id} value={contact.contact_name}>
                            {contact.contact_name}{" "}
                            {contact.level && `(${contact.level})`}
                          </option>
                        );
                      return null;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상담자
                  </label>
                  <select
                    value={formData.user_id}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm"
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상담 내용
                </label>
                <textarea
                  placeholder="상담 내용을 입력하세요..."
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={10}
                />
                {isAddMode && (
                  <p className="mt-1 text-xs text-gray-500">
                    담당자를 선택 후 상담을 작성해주세요. 후속 날짜를 설정하면
                    지정날짜 7일 전에 대시보드의 후속 상담 필요 고객 리스트에
                    표시됩니다.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end items-center gap-3 px-5 py-4 bg-gray-50 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={onSubmit}
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
