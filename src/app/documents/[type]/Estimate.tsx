"use client";

import { Plus, Search } from "lucide-react";
import {
  DocumentTable,
  DocumentFormModal,
  StatusChangeModal,
} from "@/components/documents";
import type {
  Document,
  NewDocument,
  Contact,
  StatusReason,
  AppUser,
  DocumentItem,
} from "@/types/document";

interface Items {
  name: string;
  spec?: string;
  quantity: string | number;
  unit_price: number;
  amount: number;
}

interface UserItem {
  id: string;
  name: string;
  level: string;
}

interface EsitmateProps {
  documents: Document[];
  handleDocumentNumberClick: (document: Document) => void;
  handleEditModal: (document: Document) => void;
  handleDeleteDocument: (document: Document) => void;
  openAddModal: boolean;
  newDocument: NewDocument;
  setNewDocument: (newDocument: NewDocument) => void;
  koreanAmount: string;
  totalAmount: number;
  addItem: () => void;
  items: Items[];
  setItems: React.Dispatch<React.SetStateAction<Items[]>>;
  handleQuantityChange: (index: number, value: string) => void;
  handleUnitPriceChange: (index: number, value: string) => void;
  setOpenAddModal: (type: boolean) => void;
  handleAddDocument: () => Promise<void>;
  removeItem: (index: number) => void;
  openEditModal: boolean;
  handleEditDocument: () => Promise<void>;
  type: string;
  user: AppUser;
  users?: UserItem[];
  setOpenEditModal: React.Dispatch<React.SetStateAction<boolean>>;
  paymentMethods: string[];
  saving: boolean;
  contacts: Contact[];
  handleEditCloseModal: () => void;
  statusChangeDoc: Document | null;
  setStatusChangeDoc: (doc: Document | null) => void;
  handleStatusChange: () => Promise<void>;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  statusReason: StatusReason;
  setStatusReason: React.Dispatch<React.SetStateAction<StatusReason>>;
  highlightId?: string | null;
  companyAddress?: string;
  companyId?: string;
}

export default function Estimate({
  documents,
  handleDocumentNumberClick,
  handleEditModal,
  handleDeleteDocument,
  openAddModal,
  newDocument,
  setNewDocument,
  koreanAmount,
  totalAmount,
  addItem,
  items,
  setItems,
  handleQuantityChange,
  handleUnitPriceChange,
  setOpenAddModal,
  handleAddDocument,
  removeItem,
  openEditModal,
  handleEditDocument,
  type,
  user,
  users = [],
  handleEditCloseModal,
  paymentMethods,
  saving,
  contacts,
  statusChangeDoc,
  setStatusChangeDoc,
  handleStatusChange,
  selectedStatus,
  setSelectedStatus,
  statusReason,
  setStatusReason,
  highlightId,
  companyAddress,
  companyId,
}: EsitmateProps) {
  const getDocumentTypeText = () => {
    switch (type) {
      case "estimate":
        return "견적서";
      case "order":
        return "발주서";
      case "requestQuote":
        return "견적의뢰서";
      default:
        return "";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 헤더 섹션 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-800">
            {getDocumentTypeText()} 목록
          </h2>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="검색..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>

            <button
              onClick={() => setOpenAddModal(true)}
              className="flex items-center justify-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>추가</span>
            </button>
          </div>
        </div>
      </div>

      {/* 테이블 섹션 */}
      <DocumentTable
        documents={documents}
        type={type}
        user={user}
        handleDocumentNumberClick={handleDocumentNumberClick}
        handleEditModal={handleEditModal}
        handleDeleteDocument={handleDeleteDocument}
        setStatusChangeDoc={setStatusChangeDoc}
        setOpenAddModal={setOpenAddModal}
        getDocumentTypeText={getDocumentTypeText}
        highlightId={highlightId}
      />

      {/* 추가 모달 */}
      {openAddModal && (
        <DocumentFormModal
          mode="add"
          type={type}
          user={user}
          users={users}
          newDocument={newDocument}
          setNewDocument={setNewDocument}
          koreanAmount={koreanAmount}
          totalAmount={totalAmount}
          items={items}
          setItems={setItems}
          addItem={addItem}
          removeItem={removeItem}
          handleQuantityChange={handleQuantityChange}
          handleUnitPriceChange={handleUnitPriceChange}
          onClose={() => setOpenAddModal(false)}
          onSubmit={handleAddDocument}
          paymentMethods={paymentMethods}
          saving={saving}
          contacts={contacts}
          companyAddress={companyAddress}
          companyId={companyId}
        />
      )}

      {/* 수정 모달 */}
      {openEditModal && (
        <DocumentFormModal
          mode="edit"
          type={type}
          user={user}
          users={users}
          newDocument={newDocument}
          setNewDocument={setNewDocument}
          koreanAmount={koreanAmount}
          totalAmount={totalAmount}
          items={items}
          setItems={setItems}
          addItem={addItem}
          removeItem={removeItem}
          handleQuantityChange={handleQuantityChange}
          handleUnitPriceChange={handleUnitPriceChange}
          onClose={handleEditCloseModal}
          onSubmit={handleEditDocument}
          paymentMethods={paymentMethods}
          saving={saving}
          contacts={contacts}
          companyAddress={companyAddress}
          companyId={companyId}
        />
      )}

      {/* 상태 변경 모달 */}
      {statusChangeDoc && (
        <StatusChangeModal
          statusChangeDoc={statusChangeDoc}
          setStatusChangeDoc={setStatusChangeDoc}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          statusReason={statusReason}
          setStatusReason={setStatusReason}
          handleStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
