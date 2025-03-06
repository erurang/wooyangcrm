import { CircularProgress } from "@mui/material";

interface User {
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
  payment_method: string; // 결제조건 추가
  document_number: string;
  status: string;
  created_at: string;
  file_url: string;
  company_id: string;
  user_id: string;
}

interface newDocument {
  id: string;
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
  user: User;
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
  return (
    <div className="bg-[#FBFBFB] rounded-md border">
      <table className="min-w-full table-auto border-collapse text-center">
        <thead>
          {type === "estimate" && (
            <tr className="bg-gray-100 text-left">
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                견적일
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                유효기간
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                담당자
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                견적자
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center w-3/12">
                견적
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                총액
              </th>
              {/* <th className="px-4 py-2 border-b border-r-[1px] text-center ">
                상태
              </th> */}
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                문서번호
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                상태
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                수정
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                삭제
              </th>
            </tr>
          )}
          {type === "order" && (
            <tr className="bg-gray-100 text-left">
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                발주일
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                납기일
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                담당자
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                발주자
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center w-3/12">
                발주내역
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                총액
              </th>
              {/* <th className="px-4 py-2 border-b border-r-[1px] text-center ">
                상태
              </th> */}
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                문서번호
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                상태
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                수정
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                삭제
              </th>
            </tr>
          )}
          {type === "requestQuote" && (
            <tr className="bg-gray-100 text-left">
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                의뢰일
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                희망견적일
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                담당자
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                의뢰자
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center w-3/12">
                의뢰내역
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                총액
              </th>
              {/* <th className="px-4 py-2 border-b border-r-[1px] text-center ">
                상태
              </th> */}
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                문서번호
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                상태
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                수정
              </th>
              <th className="px-4 py-2 border-b border-r-[1px] text-center">
                삭제
              </th>
            </tr>
          )}
        </thead>
        <tbody>
          {documents?.map((document) => (
            <tr key={document.id} className="hover:bg-gray-100">
              <td className="px-4 py-2 border-b border-r-[1px]">
                {new Date(document.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-2 border-b border-r-[1px]">
                {type === "estimate" &&
                  new Date(document.content.valid_until).toLocaleDateString()}
                {type === "order" && document.content.delivery_date}
                {type === "requestQuote" && document.content.delivery_date}
              </td>
              <td className="px-4 py-2 border-b border-r-[1px]">
                {document.contact_name} {document.contact_level} {/* 담당자 */}
              </td>
              <td className="px-4 py-2 border-b border-r-[1px]">
                {document.user_name} {document.user_level}
              </td>
              <td
                className="px-4 py-2 border-b border-r-[1px] w-full"
                style={{
                  minHeight: "100px",
                  maxHeight: "100px",
                  overflowY: "auto",
                  display: "block",
                }}
              >
                {document.content.items.map((item, index) => (
                  <div key={index} className={"text-start"}>
                    <p>
                      품명: {item.name} 규격: {item.spec}
                    </p>
                  </div>
                ))}
              </td>
              <td className="px-4 py-2 border-b border-r-[1px]">
                {document.content.total_amount?.toLocaleString()} 원
                {/* 총액에 콤마 추가 */}
              </td>
              {/* <td className="px-4 py-2 border-b border-r-[1px]">
                {document.status === "pending" && "진행"}
                {document.status === "completed" && "완료"}
                {document.status === "canceled" && "취소"}
              </td> */}
              <td
                className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
                onClick={() => handleDocumentNumberClick(document)}
              >
                {document.document_number}
              </td>
              <td
                className={`px-4 py-2 border-b border-r-[1px]  
    ${
      user?.id === document.user_id &&
      document.status === "pending" &&
      "text-blue-500 cursor-pointer"
    }`}
                onClick={() => {
                  if (
                    user?.id === document.user_id &&
                    document.status === "pending"
                  ) {
                    setStatusChangeDoc(document);
                  }
                }}
              >
                {document.status === "pending" && "변경"}
                {document.status === "completed" && "완료됨"}
                {document.status === "canceled" && "취소됨"}
              </td>
              <td
                className={`px-4 py-2 border-b border-r-[1px]  
                    ${
                      user?.id === document.user_id &&
                      "text-blue-500 cursor-pointer"
                    }`}
                onClick={() => {
                  if (user?.id === document.user_id) handleEditModal(document);
                }}
              >
                수정
              </td>
              <td
                className={`px-4 py-2 border-b border-r-[1px] ${
                  user?.id === document.user_id && "text-red-500 cursor-pointer"
                }}`}
                onClick={() => {
                  if (user?.id === document.user_id)
                    handleDeleteDocument(document);
                }}
              >
                삭제
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {openAddModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md w-2/3 max-w-6xl">
            <div className="flex justify-between">
              <h3 className="text-xl font-semibold mb-4">
                {type === "estimate" && "견적서"}
                {type === "order" && "발주서"}
                {type === "requestQuote" && "의뢰서"}
                추가
              </h3>
              <div className="flex space-x-3">
                {/* <span className={"text-blue-500 font-bold"}>진행</span>
                <span
                  className={
                    newDocument.status === "completed"
                      ? "text-blue-500 hover:font-bold"
                      : "text-gray-400 hover:text-black"
                  }
                >
                  완료
                </span>
                <span
                  className={
                    newDocument.status === "canceled"
                      ? "text-blue-500 hover:font-bold"
                      : "text-gray-400 hover:text-black"
                  }
                >
                  취소
                </span> */}
              </div>
            </div>

            <div className="grid grid-cols-4 space-x-4">
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">회사명</label>
                <input
                  type="text"
                  disabled
                  value={newDocument.company_name} // 회사명 자동 기입
                  onChange={(e) =>
                    setNewDocument({
                      ...newDocument,
                      company_name: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              {/* 담당자 */}
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">전화</label>
                <input
                  type="text"
                  disabled
                  value={newDocument.phone} // 전화 자동 기입
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, phone: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              {/* 팩스 */}
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">팩스</label>
                <input
                  type="text"
                  value={newDocument.fax} // 팩스 자동 기입
                  disabled
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, fax: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">
                  담당자명
                </label>
                <select
                  value={newDocument.contact}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, contact: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">선택</option>
                  {contacts.map((contact) => {
                    if (!contact.resign)
                      return (
                        <option key={contact.id} value={contact.contact_name}>
                          {contact.contact_name} {contact.level}
                        </option>
                      );
                  })}
                </select>

                {/* <input
                  type="text"
                  value={newDocument.contact}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, contact: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                /> */}
              </div>
            </div>

            <div className="grid grid-cols-4 space-x-4">
              {/* 결제조건 */}
              <div className="mb-2">
                {type !== "requestQuote" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      결제조건
                    </label>
                    <select
                      value={newDocument.payment_method}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          payment_method: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">선택</option>
                      {paymentMethods.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {/* <input
                  type="text"
                  value={newDocument.payment_method}
                  onChange={(e) =>
                    setNewDocument({
                      ...newDocument,
                      payment_method: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                /> */}
              </div>
              <div className="mb-2">
                {type === "estimate" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      견적일
                    </label>
                    <input
                      type="date"
                      value={newDocument.created_at}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          created_at: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}
                {type === "order" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      발주일
                    </label>
                    <input
                      disabled
                      type="date"
                      value={newDocument.created_at}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          created_at: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}
                {type === "requestQuote" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      의뢰일
                    </label>
                    <input
                      disabled
                      type="date"
                      value={newDocument.created_at}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          created_at: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}
              </div>

              {/* 유효기간 */}
              <div className="mb-2">
                {type === "estimate" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      유효기간
                    </label>
                    <input
                      type="date"
                      value={newDocument.valid_until}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          valid_until: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}
                {type === "order" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      납기일
                    </label>
                    <input
                      type="text"
                      value={newDocument.delivery_date}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          delivery_date: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}
                {type === "requestQuote" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      희망견적일{" "}
                    </label>
                    <input
                      type="text"
                      value={newDocument.delivery_date}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          delivery_date: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}
              </div>
              <div className="mb-2">
                {type === "estimate" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      견적자
                    </label>

                    <input
                      disabled
                      type="text"
                      value={user?.name}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}
                {type === "order" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      발주자
                    </label>

                    <input
                      disabled
                      type="text"
                      value={user?.name}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}
                {type === "requestQuote" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      의뢰자
                    </label>

                    <input
                      disabled
                      type="text"
                      value={user?.name}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}
                {/* <select
                    disabled
                  value={newDocument.user_id}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, user_id: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  {users.map((user) => (
                    <option key={user?.id} value={user?.id}>
                      {user?.name}
                    </option>
                  ))}
                </select> */}
              </div>
            </div>

            {/* 특기사항 */}
            <div className="mb-2">
              <label className="block mb-2 text-sm font-medium">특기사항</label>
              <textarea
                value={newDocument.notes}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, notes: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-4 space-x-4 mb-2">
              {type === "estimate" && (
                <>
                  <div className="mb-2">
                    <label className="block mb-2 text-sm font-medium">
                      납품장소
                    </label>
                    <input
                      type="text"
                      value={newDocument.delivery_place}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          delivery_place: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-2 text-sm font-medium">
                      납품일
                    </label>
                    <input
                      type="text"
                      value={newDocument.delivery_term}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          delivery_term: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </>
              )}
              {(type === "order" || type === "requestQuote") && (
                <>
                  <div></div>
                  <div></div>
                </>
              )}
              {type !== "requestQuote" && (
                <>
                  <div className="mb-2">
                    <label className="block mb-2 text-sm font-medium">
                      총액金
                    </label>
                    <input
                      type="text"
                      value={`${koreanAmount}`}
                      readOnly
                      className="block w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-2 text-sm font-medium">원</label>
                    <input
                      type="text"
                      value={`₩ ${totalAmount?.toLocaleString()}`}
                      readOnly
                      className="block w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100"
                    />
                  </div>
                </>
              )}
            </div>

            {/*  아이템 */}
            <div>
              <div className="flex space-x-2 justify-between">
                <label className="mb-2 text-sm font-medium">항목</label>
                <div className="flex">
                  <div
                    className="font-semibold cursor-pointer hover:bg-opacity-10 mr-2"
                    onClick={addItem}
                  >
                    <span className="mr-2">+</span>
                    <span>추가</span>
                  </div>
                </div>
              </div>
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 mb-2 w-full"
                >
                  <input
                    type="text"
                    placeholder="제품명"
                    value={item.name}
                    onChange={(e) =>
                      setItems((prev: Items[]): Items[] =>
                        prev.map((item, i) =>
                          i === index ? { ...item, name: e.target.value } : item
                        )
                      )
                    }
                    className="col-span-4 px-1 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    placeholder="규격"
                    value={item.spec}
                    onChange={(e) =>
                      setItems((prev: Items[]): Items[] =>
                        prev.map((item, i) =>
                          i === index ? { ...item, spec: e.target.value } : item
                        )
                      )
                    }
                    className="col-span-2 px-1 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    placeholder="수량"
                    value={items[index].quantity} // 그대로 문자 유지
                    onChange={(e) =>
                      handleQuantityChange(index, e.target.value)
                    }
                    className="col-span-1 px-1 border border-gray-300 rounded-md text-sm"
                  />

                  {/* ✅ 단가 - 소수점 허용 & 8자리까지 입력 가능 */}
                  <input
                    type="text"
                    placeholder="단가"
                    value={items[index].unit_price?.toLocaleString()} // 소수점 유지
                    onChange={(e) =>
                      handleUnitPriceChange(index, e.target.value)
                    }
                    className="col-span-2 px-1 border border-gray-300 rounded-md text-sm"
                  />

                  {/* ✅ 금액 (자동 계산) */}
                  <input
                    type="text"
                    placeholder="금액"
                    value={items[index].amount?.toLocaleString()} // 가독성 좋게 변환
                    readOnly
                    className="col-span-2 px-1 border border-gray-300 rounded-md text-sm bg-gray-100"
                  />
                  <button
                    onClick={() => removeItem(index)}
                    className="col-span-1 px-4 py-2 bg-red-500 text-white rounded-md cursor-pointer"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>

            {/* 아이템 */}
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => setOpenAddModal(false)}
                className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={saving}
              >
                취소 {saving && <CircularProgress size={18} className="ml-2" />}
              </button>
              <button
                onClick={handleAddDocument}
                className={`bg-blue-500 text-white px-4 py-2 rounded-md text-xs md:text-sm flex items-center ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                저장 {saving && <CircularProgress size={18} className="ml-2" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {openEditModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md w-2/3 max-w-6xl">
            <div className="flex justify-between">
              <h3 className="text-xl font-semibold mb-4">
                {type === "estimate" && "견적서"}
                {type === "order" && "발주서"}
                {type === "requestQuote" && "의뢰서"} 수정
              </h3>
              <div className="flex space-x-3">
                {/* <span
                  onClick={() =>
                    setNewDocument({ ...newDocument, status: "pending" })
                  }
                  className={`${
                    newDocument.status === "pending"
                      ? "text-blue-500 font-bold"
                      : "text-gray-400 hover:text-black cursor-pointer"
                  }`}
                >
                  진행
                </span>
                <span
                  onClick={() =>
                    setNewDocument({ ...newDocument, status: "completed" })
                  }
                  className={`${
                    newDocument.status === "completed"
                      ? "text-blue-500 font-bold"
                      : "text-gray-400 hover:text-black  cursor-pointer"
                  }`}
                >
                  완료
                </span>
                <span
                  onClick={() =>
                    setNewDocument({ ...newDocument, status: "canceled" })
                  }
                  className={`${
                    newDocument.status === "canceled"
                      ? "text-blue-500 font-bold"
                      : "text-gray-400 hover:text-black  cursor-pointer"
                  }`}
                >
                  취소
                </span> */}
              </div>
            </div>

            <div className="grid grid-cols-4 space-x-4">
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">회사명</label>
                <input
                  type="text"
                  disabled
                  value={newDocument.company_name} // 기존 데이터 입력
                  onChange={(e) =>
                    setNewDocument({
                      ...newDocument,
                      company_name: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">전화</label>
                <input
                  type="text"
                  disabled
                  value={newDocument.phone} // 기존 데이터 입력
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, phone: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">팩스</label>
                <input
                  type="text"
                  disabled
                  value={newDocument.fax} // 기존 데이터 입력
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, fax: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">
                  담당자명
                </label>
                <select
                  value={newDocument.contact}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, contact: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">선택</option>
                  {contacts.map((contact) => {
                    if (!contact.resign)
                      return (
                        <option key={contact.id} value={contact.contact_name}>
                          {contact.contact_name} {contact.level}
                        </option>
                      );
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 space-x-4">
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">
                  결제조건
                </label>
                {type === "estimate" && (
                  <select
                    value={newDocument.payment_method}
                    onChange={(e) =>
                      setNewDocument({
                        ...newDocument,
                        payment_method: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">선택</option>
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                )}
                {type === "order" && (
                  <select
                    value={newDocument.payment_method}
                    onChange={(e) =>
                      setNewDocument({
                        ...newDocument,
                        payment_method: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">선택</option>
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                )}
                {type === "requestQuote" && (
                  <select
                    value={newDocument.payment_method}
                    onChange={(e) =>
                      setNewDocument({
                        ...newDocument,
                        payment_method: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">선택</option>
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                )}
                {/* <input
                  type="text"
                  value={newDocument.payment_method}
                  onChange={(e) =>
                    setNewDocument({
                      ...newDocument,
                      payment_method: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                /> */}
              </div>
              <div className="mb-2">
                {type === "estimate" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      견적일
                    </label>
                    <input
                      disabled
                      type="date"
                      value={newDocument.created_at}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          created_at: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}
                {type === "order" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      발주일
                    </label>
                    <input
                      disabled
                      type="date"
                      value={newDocument.created_at}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          created_at: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}
                {type === "requestQuote" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      의뢰일
                    </label>
                    <input
                      disabled
                      type="date"
                      value={newDocument.created_at}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          created_at: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}
              </div>
              <div className="mb-2">
                {type === "estimate" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      유효기간
                    </label>
                    <input
                      type="date"
                      value={newDocument.valid_until}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          valid_until: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}

                {type === "order" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      납기일
                    </label>
                    <input
                      type="text"
                      value={newDocument.delivery_date}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          delivery_date: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}
                {type === "requestQuote" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      희망견적일{" "}
                    </label>
                    <input
                      type="text"
                      value={newDocument.delivery_date}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          delivery_date: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}
              </div>
              <div className="mb-2">
                {type === "estimate" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      견적자
                    </label>

                    <input
                      disabled
                      type="text"
                      value={user?.name}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}
                {type === "order" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      발주자
                    </label>

                    <input
                      disabled
                      type="text"
                      value={user?.name}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}
                {type === "requestQuote" && (
                  <>
                    <label className="block mb-2 text-sm font-medium">
                      의뢰자
                    </label>

                    <input
                      disabled
                      type="text"
                      value={user?.name}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </>
                )}
              </div>
            </div>

            {/* 특기사항 */}
            <div className="mb-2">
              <label className="block mb-2 text-sm font-medium">특기사항</label>
              <textarea
                value={newDocument.notes} // 기존 데이터 입력
                onChange={(e) =>
                  setNewDocument({ ...newDocument, notes: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-4 space-x-4 mb-2">
              {type === "estimate" && (
                <>
                  <div className="mb-2">
                    <label className="block mb-2 text-sm font-medium">
                      납품장소
                    </label>
                    <input
                      type="text"
                      value={newDocument.delivery_place}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          delivery_place: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-2 text-sm font-medium">
                      납품일
                    </label>
                    <input
                      type="text"
                      value={newDocument.delivery_term}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          delivery_term: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </>
              )}
              {type === "order" ||
                (type === "requestQuote" && (
                  <>
                    <div></div>
                    <div></div>
                  </>
                ))}

              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">총액金</label>
                <input
                  type="text"
                  value={`${koreanAmount} 원`}
                  readOnly
                  className="block w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">원</label>
                <input
                  type="text"
                  value={`₩ ${totalAmount?.toLocaleString()}`}
                  readOnly
                  className="block w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100"
                />
              </div>
            </div>

            {/*  아이템 */}
            <div>
              <div className="flex space-x-2 justify-between">
                <label className="mb-2 text-sm font-medium">항목</label>
                <div className="flex">
                  <div
                    className="font-semibold cursor-pointer hover:bg-opacity-10 mr-2"
                    onClick={addItem}
                  >
                    <span className="mr-2">+</span>
                    <span>추가</span>
                  </div>
                </div>
              </div>
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 mb-2 w-full"
                >
                  <input
                    type="text"
                    placeholder="제품명"
                    value={item.name}
                    onChange={(e) =>
                      setItems((prev: Items[]): Items[] =>
                        prev.map((item, i) =>
                          i === index ? { ...item, name: e.target.value } : item
                        )
                      )
                    }
                    className="col-span-4 px-1 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    placeholder="규격"
                    value={item.spec}
                    onChange={(e) =>
                      setItems((prev: Items[]): Items[] =>
                        prev.map((item, i) =>
                          i === index ? { ...item, spec: e.target.value } : item
                        )
                      )
                    }
                    className="col-span-2 px-1 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text" // 'number'에서 'text'로 변경
                    placeholder="수량"
                    value={item.quantity?.toLocaleString()} // 화면에 콤마가 추가된 수량을 표시
                    onChange={(e) =>
                      handleQuantityChange(index, e.target.value)
                    }
                    className="col-span-1 px-1 border border-gray-300 rounded-md text-sm"
                  />

                  <input
                    type="text" // 'number'에서 'text'로 변경
                    placeholder="단가"
                    value={item.unit_price?.toLocaleString()} // 화면에 콤마가 추가된 단가를 표시
                    onChange={(e) =>
                      handleUnitPriceChange(index, e.target.value)
                    }
                    className="col-span-2 px-1 border border-gray-300 rounded-md text-sm"
                  />

                  <input
                    type="text" // 'number'에서 'text'로 변경
                    placeholder="금액"
                    value={item.amount?.toLocaleString()} // 화면에 콤마가 추가된 금액을 표시
                    readOnly
                    className="col-span-2 px-1 border border-gray-300 rounded-md text-sm bg-gray-100"
                  />
                  <button
                    onClick={() => removeItem(index)}
                    className="col-span-1 px-4 py-2 bg-red-500 text-white rounded-md cursor-pointer"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>

            {/* 아이템 */}
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => handleEditCloseModal()}
                className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={saving}
              >
                취소 {saving && <CircularProgress size={18} className="ml-2" />}
              </button>
              <button
                onClick={handleEditDocument}
                className={`bg-blue-500 text-white px-4 py-2 rounded-md text-xs md:text-sm flex items-center ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={saving}
              >
                저장 {saving && <CircularProgress size={18} className="ml-2" />}
              </button>
            </div>
          </div>
        </div>
      )}
      {statusChangeDoc && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md w-1/3">
            <h2 className="text-xl font-bold mb-4">진행 상태 변경</h2>

            {/* 상태 선택 드롭다운 */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                const newStatus = e.target.value as "completed" | "canceled";
                setSelectedStatus(newStatus);

                // 🔥 선택한 상태가 바뀔 때 기존 상태를 유지 (초기화 방지)
                setStatusReason((prev: any) => ({
                  ...prev,
                  [newStatus]: {
                    reason: prev[newStatus]?.reason || "", // 🔥 기존 값 유지
                  },
                }));
              }}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="completed">완료</option>
              <option value="canceled">취소</option>
            </select>

            {/* 사유 입력 */}
            <textarea
              placeholder={
                selectedStatus === "completed"
                  ? "완료 사유를 입력하세요."
                  : "취소 사유를 입력하세요."
              }
              className="w-full min-h-32 p-2 border border-gray-300 rounded-md mt-2"
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

            {/* 버튼 */}
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2"
                onClick={() => setStatusChangeDoc(null)}
              >
                취소
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
                onClick={handleStatusChange}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
