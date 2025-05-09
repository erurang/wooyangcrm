"use client";

import { CircularProgress } from "@mui/material";
import {
  FileText,
  Edit,
  Trash2,
  Plus,
  Search,
  ChevronDown,
  Check,
  X,
  AlertCircle,
  Calendar,
  DollarSign,
  Clipboard,
  User,
  Building,
  Phone,
  Printer,
  Clock,
  CreditCard,
  MapPin,
  Truck,
  Package,
  Info,
} from "lucide-react";

interface AppUser {
  id: string;
  name: string;
}

interface Items {
  name: string;
  spec: string;
  quantity: string;
  unit_price: number;
  amount: number;
}

interface Document {
  id: string;
  date: string;
  consultation_id: string;
  type: string;
  contact: string;
  contact_name: string;
  contact_level: string;
  user_name: string;
  user_level: string;
  contact_mobile: string;
  content: {
    items: {
      name: string;
      spec: string;
      amount: number;
      number: number;
      quantity: string;
      unit_price: number;
      unit: string;
    }[];
    notes: string;
    valid_until: string;
    company_name: string;
    total_amount: number;
    delivery_term: string;
    delivery_place: string;
    delivery_date: string;
  };
  payment_method: string;
  document_number: string;
  status: string;
  created_at: string;
  file_url: string;
  company_id: string;
  user_id: string;
}

interface newDocument {
  id: string;
  date: string;
  company_name: string;
  contact: string;
  phone: string;
  fax: string;
  created_at: string;
  valid_until: string;
  payment_method: string;
  notes: string;
  delivery_term: string;
  delivery_place: string;
  status: string;
  delivery_date: string;
}

interface Contacts {
  resign: any;
  id: string;
  contact_name: string;
  department: string;
  mobile: string;
  email: string;
  company_id: string;
  level: string;
}

interface EsitmateProps {
  documents: Document[];
  handleDocumentNumberClick: (document: Document) => void;
  handleEditModal: (document: Document) => void;
  handleDeleteDocument: (document: Document) => void;
  openAddModal: boolean;
  newDocument: newDocument;
  setNewDocument: (newDocument: newDocument) => void;
  koreanAmount: string;
  totalAmount: number;
  addItem: () => void;
  items: Items[];
  setItems: any;
  handleQuantityChange: (index: number, value: string) => void;
  handleUnitPriceChange: (index: number, value: string) => void;
  setOpenAddModal: (type: boolean) => void;
  handleAddDocument: () => Promise<void>;
  removeItem: (index: number) => void;
  openEditModal: boolean;
  handleEditDocument: () => Promise<void>;
  type: string;
  user: AppUser;
  setOpenEditModal: any;
  paymentMethods: string[];
  saving: boolean;
  contacts: Contacts[];
  handleEditCloseModal: any;
  statusChangeDoc: Document | null;
  setStatusChangeDoc: (doc: Document | null) => void;
  handleStatusChange: () => Promise<void>;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  statusReason: {
    completed: { reason: string; amount: number };
    canceled: { reason: string; amount: number };
  };
  setStatusReason: any;
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
}: EsitmateProps) {
  // 문서 타입에 따른 헤더 텍스트 설정
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

  // 상태에 따른 배지 색상 및 텍스트
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            진행중
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1">
            <Check className="h-3 w-3" />
            완료
          </span>
        );
      case "canceled":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
            <X className="h-3 w-3" />
            취소
          </span>
        );
      default:
        return null;
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {type === "estimate" && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    견적일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    유효기간
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    담당자
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    견적자
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    견적내용
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총액
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    문서번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </>
              )}
              {type === "order" && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    발주일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    납기일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    담당자
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    발주자
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    발주내역
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총액
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    문서번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </>
              )}
              {type === "requestQuote" && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    의뢰일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    희망견적일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    담당자
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    의뢰자
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    의뢰내역
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총액
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    문서번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents?.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="h-12 w-12 text-gray-300 mb-2" />
                    <p>등록된 문서가 없습니다.</p>
                    <button
                      onClick={() => setOpenAddModal(true)}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      {getDocumentTypeText()} 추가하기
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              documents?.map((document) => (
                <tr
                  key={document.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {document.date}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {type === "estimate" &&
                      new Date(
                        document.content.valid_until
                      ).toLocaleDateString()}
                    {type === "order" && document.content.delivery_date}
                    {type === "requestQuote" && document.content.delivery_date}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">
                    {document.contact_name} {document.contact_level}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">
                    {document.user_name} {document.user_level}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="max-h-24 overflow-y-auto">
                      {document.content.items.map((item, index) => (
                        <div key={index} className="mb-1 last:mb-0">
                          <p className="text-xs">
                            <span className="font-medium">품명:</span>{" "}
                            {item.name}
                          </p>
                          <p className="text-xs">
                            <span className="font-medium">규격:</span>{" "}
                            {item.spec}
                          </p>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {document.content.total_amount?.toLocaleString()} 원
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDocumentNumberClick(document)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {document.document_number}
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {document.status === "pending" &&
                    user?.id === document.user_id ? (
                      <button
                        onClick={() => setStatusChangeDoc(document)}
                        className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
                      >
                        변경
                      </button>
                    ) : (
                      getStatusBadge(document.status)
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center justify-center space-x-2">
                      {user?.id === document.user_id && (
                        <>
                          <button
                            onClick={() => handleEditModal(document)}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                            title="수정"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(document)}
                            className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 추가 모달 */}
      {openAddModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* 모달 헤더 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    {type === "estimate" && <FileText className="h-6 w-6" />}
                    {type === "order" && <Package className="h-6 w-6" />}
                    {type === "requestQuote" && (
                      <Clipboard className="h-6 w-6" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold">
                    {type === "estimate" && "견적서"}
                    {type === "order" && "발주서"}
                    {type === "requestQuote" && "의뢰서"} 추가
                  </h3>
                </div>
                <button
                  onClick={() => setOpenAddModal(false)}
                  className="text-white hover:text-gray-200 bg-white bg-opacity-20 rounded-full p-1.5 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-8">
                {/* 기본 정보 섹션 */}
                <div className="bg-gray-50 p-5 rounded-xl">
                  <div className="flex items-center gap-2 mb-4 text-gray-800">
                    <Building className="h-5 w-5 text-blue-600" />
                    <h4 className="text-lg font-semibold">기본 정보</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        회사명
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          disabled
                          value={newDocument.company_name}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        전화
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          disabled
                          value={newDocument.phone}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        팩스
                      </label>
                      <div className="relative">
                        <Printer className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          disabled
                          value={newDocument.fax}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        담당자명
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <select
                          value={newDocument.contact}
                          onChange={(e) =>
                            setNewDocument({
                              ...newDocument,
                              contact: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        >
                          <option value="">선택</option>
                          {contacts.map((contact) => {
                            if (!contact.resign)
                              return (
                                <option
                                  key={contact.id}
                                  value={contact.contact_name}
                                >
                                  {contact.contact_name} {contact.level}
                                </option>
                              );
                          })}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 문서 정보 섹션 */}
                <div className="bg-gray-50 p-5 rounded-xl">
                  <div className="flex items-center gap-2 mb-4 text-gray-800">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h4 className="text-lg font-semibold">문서 정보</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {type !== "requestQuote" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          결제조건
                        </label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <select
                            value={newDocument.payment_method}
                            onChange={(e) =>
                              setNewDocument({
                                ...newDocument,
                                payment_method: e.target.value,
                              })
                            }
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                          >
                            <option value="">선택</option>
                            {paymentMethods.map((method) => (
                              <option key={method} value={method}>
                                {method}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                        </div>
                      </div>
                    )}
                    <div>
                      {type === "estimate" && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            견적일
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              type="date"
                              value={newDocument.date}
                              onChange={(e) =>
                                setNewDocument({
                                  ...newDocument,
                                  date: e.target.value,
                                })
                              }
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                      {type === "order" && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            발주일
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              disabled
                              type="date"
                              value={newDocument.date}
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </>
                      )}
                      {type === "requestQuote" && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            의뢰일
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              disabled
                              type="date"
                              value={newDocument.date}
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      {type === "estimate" && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            유효기간
                          </label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              type="date"
                              value={newDocument.valid_until}
                              onChange={(e) =>
                                setNewDocument({
                                  ...newDocument,
                                  valid_until: e.target.value,
                                })
                              }
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                      {type === "order" && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            납기일
                          </label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              type="text"
                              value={newDocument.delivery_date}
                              onChange={(e) =>
                                setNewDocument({
                                  ...newDocument,
                                  delivery_date: e.target.value,
                                })
                              }
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                      {type === "requestQuote" && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            희망견적일
                          </label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              type="text"
                              value={newDocument.delivery_date}
                              onChange={(e) =>
                                setNewDocument({
                                  ...newDocument,
                                  delivery_date: e.target.value,
                                })
                              }
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {type === "estimate"
                          ? "견적자"
                          : type === "order"
                          ? "발주자"
                          : "의뢰자"}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          disabled
                          type="text"
                          value={user?.name}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 추가 정보 섹션 */}
                {type === "estimate" && (
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <div className="flex items-center gap-2 mb-4 text-gray-800">
                      <Info className="h-5 w-5 text-blue-600" />
                      <h4 className="text-lg font-semibold">추가 정보</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          납품장소
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="text"
                            value={newDocument.delivery_place}
                            onChange={(e) =>
                              setNewDocument({
                                ...newDocument,
                                delivery_place: e.target.value,
                              })
                            }
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          납품일
                        </label>
                        <div className="relative">
                          <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="text"
                            value={newDocument.delivery_term}
                            onChange={(e) =>
                              setNewDocument({
                                ...newDocument,
                                delivery_term: e.target.value,
                              })
                            }
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 특기사항 */}
                <div className="bg-gray-50 p-5 rounded-xl">
                  <div className="flex items-center gap-2 mb-4 text-gray-800">
                    <Info className="h-5 w-5 text-blue-600" />
                    <h4 className="text-lg font-semibold">특기사항</h4>
                  </div>
                  <textarea
                    value={newDocument.notes}
                    onChange={(e) =>
                      setNewDocument({ ...newDocument, notes: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="특기사항을 입력하세요..."
                  />
                </div>

                {/* 금액 정보 */}
                {type !== "requestQuote" && (
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <div className="flex items-center gap-2 mb-4 text-gray-800">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <h4 className="text-lg font-semibold">금액 정보</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          총액金
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={`${koreanAmount}`}
                            readOnly
                            className="w-full pl-4 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          원
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="text"
                            value={`${totalAmount?.toLocaleString()}`}
                            readOnly
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 항목 섹션 */}
                <div className="bg-gray-50 p-5 rounded-xl">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 text-gray-800">
                      <Package className="h-5 w-5 text-blue-600" />
                      <h4 className="text-lg font-semibold">항목</h4>
                    </div>
                    <button
                      onClick={addItem}
                      className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      추가
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="bg-blue-50 px-4 py-3 border-b border-gray-200 grid grid-cols-12 gap-2 text-xs font-medium text-gray-700">
                      <div className="col-span-4">제품명</div>
                      <div className="col-span-2">규격</div>
                      <div className="col-span-1">수량</div>
                      <div className="col-span-2">단가</div>
                      <div className="col-span-2">금액</div>
                      <div className="col-span-1">관리</div>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {items.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p className="mb-2">등록된 항목이 없습니다.</p>
                          <button
                            onClick={addItem}
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            항목 추가하기
                          </button>
                        </div>
                      ) : (
                        items.map((item, index) => (
                          <div
                            key={index}
                            className="px-4 py-3 border-b last:border-b-0 border-gray-200 grid grid-cols-12 gap-2 items-center hover:bg-gray-50 transition-colors"
                          >
                            <div className="col-span-4">
                              <input
                                type="text"
                                placeholder="제품명"
                                value={item.name}
                                onChange={(e) =>
                                  setItems((prev: Items[]): Items[] =>
                                    prev.map((item, i) =>
                                      i === index
                                        ? { ...item, name: e.target.value }
                                        : item
                                    )
                                  )
                                }
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="text"
                                placeholder="규격"
                                value={item.spec}
                                onChange={(e) =>
                                  setItems((prev: Items[]): Items[] =>
                                    prev.map((item, i) =>
                                      i === index
                                        ? { ...item, spec: e.target.value }
                                        : item
                                    )
                                  )
                                }
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div className="col-span-1">
                              <input
                                type="text"
                                placeholder="수량"
                                value={items[index].quantity}
                                onChange={(e) =>
                                  handleQuantityChange(index, e.target.value)
                                }
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="text"
                                placeholder="단가"
                                value={items[
                                  index
                                ].unit_price?.toLocaleString()}
                                onChange={(e) =>
                                  handleUnitPriceChange(index, e.target.value)
                                }
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="text"
                                placeholder="금액"
                                value={items[index].amount?.toLocaleString()}
                                readOnly
                                className="w-full p-2 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                            <div className="col-span-1 text-center">
                              <button
                                onClick={() => removeItem(index)}
                                className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                title="삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setOpenAddModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  onClick={handleAddDocument}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center shadow-sm"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <CircularProgress size={16} className="mr-2 text-white" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1.5" />
                      저장
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {openEditModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* 모달 헤더 */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <Edit className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">
                    {type === "estimate" && "견적서"}
                    {type === "order" && "발주서"}
                    {type === "requestQuote" && "의뢰서"} 수정
                  </h3>
                </div>
                <button
                  onClick={handleEditCloseModal}
                  className="text-white hover:text-gray-200 bg-white bg-opacity-20 rounded-full p-1.5 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-8">
                {/* 기본 정보 섹션 */}
                <div className="bg-gray-50 p-5 rounded-xl">
                  <div className="flex items-center gap-2 mb-4 text-gray-800">
                    <Building className="h-5 w-5 text-indigo-600" />
                    <h4 className="text-lg font-semibold">기본 정보</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        회사명
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          disabled
                          value={newDocument.company_name}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        전화
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          disabled
                          value={newDocument.phone}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        팩스
                      </label>
                      <div className="relative">
                        <Printer className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          disabled
                          value={newDocument.fax}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        담당자명
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <select
                          value={newDocument.contact}
                          onChange={(e) =>
                            setNewDocument({
                              ...newDocument,
                              contact: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                        >
                          <option value="">선택</option>
                          {contacts.map((contact) => {
                            if (!contact.resign)
                              return (
                                <option
                                  key={contact.id}
                                  value={contact.contact_name}
                                >
                                  {contact.contact_name} {contact.level}
                                </option>
                              );
                          })}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 문서 정보 섹션 */}
                <div className="bg-gray-50 p-5 rounded-xl">
                  <div className="flex items-center gap-2 mb-4 text-gray-800">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <h4 className="text-lg font-semibold">문서 정보</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        결제조건
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <select
                          value={newDocument.payment_method}
                          onChange={(e) =>
                            setNewDocument({
                              ...newDocument,
                              payment_method: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                        >
                          <option value="">선택</option>
                          {paymentMethods.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      {type === "estimate" && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            견적일
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              type="date"
                              value={newDocument.date}
                              onChange={(e) =>
                                setNewDocument({
                                  ...newDocument,
                                  date: e.target.value,
                                })
                              }
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                      {type === "order" && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            발주일
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              type="date"
                              value={newDocument.date}
                              onChange={(e) =>
                                setNewDocument({
                                  ...newDocument,
                                  date: e.target.value,
                                })
                              }
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                      {type === "requestQuote" && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            의뢰일
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              disabled
                              type="date"
                              value={newDocument.created_at}
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      {type === "estimate" && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            유효기간
                          </label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              type="date"
                              value={newDocument.valid_until}
                              onChange={(e) =>
                                setNewDocument({
                                  ...newDocument,
                                  valid_until: e.target.value,
                                })
                              }
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                      {type === "order" && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            납기일
                          </label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              type="text"
                              value={newDocument.delivery_date}
                              onChange={(e) =>
                                setNewDocument({
                                  ...newDocument,
                                  delivery_date: e.target.value,
                                })
                              }
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                      {type === "requestQuote" && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            희망견적일
                          </label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              type="text"
                              value={newDocument.delivery_date}
                              onChange={(e) =>
                                setNewDocument({
                                  ...newDocument,
                                  delivery_date: e.target.value,
                                })
                              }
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {type === "estimate"
                          ? "견적자"
                          : type === "order"
                          ? "발주자"
                          : "의뢰자"}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          disabled
                          type="text"
                          value={user?.name}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 추가 정보 섹션 */}
                {type === "estimate" && (
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <div className="flex items-center gap-2 mb-4 text-gray-800">
                      <Info className="h-5 w-5 text-indigo-600" />
                      <h4 className="text-lg font-semibold">추가 정보</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          납품장소
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="text"
                            value={newDocument.delivery_place}
                            onChange={(e) =>
                              setNewDocument({
                                ...newDocument,
                                delivery_place: e.target.value,
                              })
                            }
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          납품일
                        </label>
                        <div className="relative">
                          <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="text"
                            value={newDocument.delivery_term}
                            onChange={(e) =>
                              setNewDocument({
                                ...newDocument,
                                delivery_term: e.target.value,
                              })
                            }
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 특기사항 */}
                <div className="bg-gray-50 p-5 rounded-xl">
                  <div className="flex items-center gap-2 mb-4 text-gray-800">
                    <Info className="h-5 w-5 text-indigo-600" />
                    <h4 className="text-lg font-semibold">특기사항</h4>
                  </div>
                  <textarea
                    value={newDocument.notes}
                    onChange={(e) =>
                      setNewDocument({ ...newDocument, notes: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={3}
                    placeholder="특기사항을 입력하세요..."
                  />
                </div>

                {/* 금액 정보 */}
                <div className="bg-gray-50 p-5 rounded-xl">
                  <div className="flex items-center gap-2 mb-4 text-gray-800">
                    <DollarSign className="h-5 w-5 text-indigo-600" />
                    <h4 className="text-lg font-semibold">금액 정보</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        총액金
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={`${koreanAmount} 원`}
                          readOnly
                          className="w-full pl-4 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        원
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          value={`${totalAmount?.toLocaleString()}`}
                          readOnly
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 항목 섹션 */}
                <div className="bg-gray-50 p-5 rounded-xl">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 text-gray-800">
                      <Package className="h-5 w-5 text-indigo-600" />
                      <h4 className="text-lg font-semibold">항목</h4>
                    </div>
                    <button
                      onClick={addItem}
                      className="flex items-center text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      추가
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="bg-indigo-50 px-4 py-3 border-b border-gray-200 grid grid-cols-12 gap-2 text-xs font-medium text-gray-700">
                      <div className="col-span-4">제품명</div>
                      <div className="col-span-2">규격</div>
                      <div className="col-span-1">수량</div>
                      <div className="col-span-2">단가</div>
                      <div className="col-span-2">금액</div>
                      <div className="col-span-1">관리</div>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {items.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p className="mb-2">등록된 항목이 없습니다.</p>
                          <button
                            onClick={addItem}
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            항목 추가하기
                          </button>
                        </div>
                      ) : (
                        items.map((item, index) => (
                          <div
                            key={index}
                            className="px-4 py-3 border-b last:border-b-0 border-gray-200 grid grid-cols-12 gap-2 items-center hover:bg-gray-50 transition-colors"
                          >
                            <div className="col-span-4">
                              <input
                                type="text"
                                placeholder="제품명"
                                value={item.name}
                                onChange={(e) =>
                                  setItems((prev: Items[]): Items[] =>
                                    prev.map((item, i) =>
                                      i === index
                                        ? { ...item, name: e.target.value }
                                        : item
                                    )
                                  )
                                }
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="text"
                                placeholder="규격"
                                value={item.spec}
                                onChange={(e) =>
                                  setItems((prev: Items[]): Items[] =>
                                    prev.map((item, i) =>
                                      i === index
                                        ? { ...item, spec: e.target.value }
                                        : item
                                    )
                                  )
                                }
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            </div>
                            <div className="col-span-1">
                              <input
                                type="text"
                                placeholder="수량"
                                value={item.quantity?.toLocaleString()}
                                onChange={(e) =>
                                  handleQuantityChange(index, e.target.value)
                                }
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="text"
                                placeholder="단가"
                                value={item.unit_price?.toLocaleString()}
                                onChange={(e) =>
                                  handleUnitPriceChange(index, e.target.value)
                                }
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="text"
                                placeholder="금액"
                                value={item.amount?.toLocaleString()}
                                readOnly
                                className="w-full p-2 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                            <div className="col-span-1 text-center">
                              <button
                                onClick={() => removeItem(index)}
                                className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                title="삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={handleEditCloseModal}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  onClick={handleEditDocument}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center shadow-sm"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <CircularProgress size={16} className="mr-2 text-white" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1.5" />
                      저장
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상태 변경 모달 */}
      {statusChangeDoc && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* 모달 헤더 */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">진행 상태 변경</h2>
              </div>
            </div>

            {/* 모달 내용 */}
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상태 선택
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        selectedStatus === "completed"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                      onClick={() => {
                        setSelectedStatus("completed");
                        setStatusReason((prev: any) => ({
                          ...prev,
                          completed: {
                            reason: prev.completed?.reason || "",
                          },
                        }));
                      }}
                    >
                      <Check
                        className={`h-5 w-5 ${
                          selectedStatus === "completed"
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                      />
                      <span className="font-medium">완료</span>
                    </button>
                    <button
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        selectedStatus === "canceled"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                      onClick={() => {
                        setSelectedStatus("canceled");
                        setStatusReason((prev: any) => ({
                          ...prev,
                          canceled: {
                            reason: prev.canceled?.reason || "",
                          },
                        }));
                      }}
                    >
                      <X
                        className={`h-5 w-5 ${
                          selectedStatus === "canceled"
                            ? "text-red-500"
                            : "text-gray-400"
                        }`}
                      />
                      <span className="font-medium">취소</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedStatus === "completed" ? "완료 사유" : "취소 사유"}
                  </label>
                  <div className="relative">
                    <textarea
                      placeholder={
                        selectedStatus === "completed"
                          ? "완료 사유를 입력하세요."
                          : "취소 사유를 입력하세요."
                      }
                      className={`w-full p-3 border rounded-lg text-sm min-h-[120px] focus:outline-none focus:ring-2 ${
                        selectedStatus === "completed"
                          ? "border-green-300 focus:ring-green-500"
                          : "border-red-300 focus:ring-red-500"
                      }`}
                      value={
                        statusReason[selectedStatus as "completed" | "canceled"]
                          ?.reason || ""
                      }
                      onChange={(e) =>
                        setStatusReason((prev: any) => ({
                          ...prev,
                          [selectedStatus]: {
                            reason: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-2">
                  <button
                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setStatusChangeDoc(null)}
                  >
                    취소
                  </button>
                  <button
                    className={`px-4 py-2.5 text-white rounded-lg text-sm font-medium flex items-center shadow-sm ${
                      selectedStatus === "completed"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                    onClick={handleStatusChange}
                  >
                    {selectedStatus === "completed" ? (
                      <>
                        <Check className="h-4 w-4 mr-1.5" />
                        완료로 변경
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1.5" />
                        취소로 변경
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
