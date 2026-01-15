"use client";

interface Item {
  name: string;
  spec: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface DocumentData {
  date: string;
  items: Item[];
  company_name: string;
  total_amount: number;
  delivery_date: string;
  payment_method: string;
  notes: string;
}

interface Contact {
  id: string;
  contact_name: string;
  level: string;
}

interface User {
  id: string;
  name: string;
  level: string;
}

interface EstimateModalProps {
  isOpen: boolean;
  document: DocumentData | null;
  contacts: Contact[];
  users: User[];
  selectedContactId: string;
  selectedUserId: string;
  onContactChange: (contactId: string) => void;
  onUserChange: (userId: string) => void;
  onClose: () => void;
  onUpload: () => void;
  isUploading: boolean;
}

export default function EstimateModal({
  isOpen,
  document,
  contacts,
  users,
  selectedContactId,
  selectedUserId,
  onContactChange,
  onUserChange,
  onClose,
  onUpload,
  isUploading,
}: EstimateModalProps) {
  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-md w-2/3 max-w-6xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">견적서 보기</h3>
          <button
            className="px-3 py-1 bg-gray-300 rounded"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        {/* 회사명, 날짜, 결제조건 등 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block mb-1 text-sm font-medium">회사명</label>
            <input
              type="text"
              value={document.company_name}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">견적일</label>
            <input
              type="text"
              value={document.date}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">납품일</label>
            <input
              type="text"
              value={document.delivery_date}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">결제조건</label>
            <input
              type="text"
              value={document.payment_method}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>

        {/* 담당자, 유저 선택 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 text-sm font-medium">담당자</label>
            <select
              value={selectedContactId}
              onChange={(e) => onContactChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">선택</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.contact_name} ({contact.level})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">견적자</label>
            <select
              value={selectedUserId}
              onChange={(e) => onUserChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">선택</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.level})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 특기사항 */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">특기사항</label>
          <textarea
            value={document.notes}
            readOnly
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            rows={3}
          />
        </div>

        {/* 아이템 목록 */}
        <div className="mb-4 max-h-96 overflow-y-scroll">
          <label className="block mb-1 text-sm font-medium">품목</label>
          <div className="space-y-2 mt-2">
            {document.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <input
                  type="text"
                  value={item.name}
                  readOnly
                  className="col-span-4 px-1 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="text"
                  value={item.spec}
                  readOnly
                  className="col-span-3 px-1 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="text"
                  value={item.quantity}
                  readOnly
                  className="col-span-2 px-1 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="text"
                  value={item.unit_price.toLocaleString()}
                  readOnly
                  className="col-span-2 px-1 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="text"
                  value={item.amount.toLocaleString()}
                  readOnly
                  className="col-span-1 px-1 border border-gray-300 rounded-md text-sm bg-gray-100"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 총액 */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">총액</label>
          <input
            type="text"
            value={document.total_amount.toLocaleString()}
            readOnly
            className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100"
          />
        </div>

        {/* 버튼들 */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm"
          >
            닫기
          </button>
          <button
            onClick={onUpload}
            disabled={isUploading}
            className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
          >
            {isUploading ? "업로드 중..." : "업로드"}
          </button>
        </div>
      </div>
    </div>
  );
}
