"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import DocumentModal from "@/components/documents/estimate/DocumentModal";
import { Snackbar, Alert } from "@mui/material"; // MUI Snackbar 임포트

interface Document {
  id: string;
  consultation_id: string;
  type: string;
  contact: string;
  content: {
    items: {
      name: string;
      spec: string;
      amount: number;
      number: number;
      quantity: string;
      unit_price: number;
    }[];
    notes: string;
    delivery_date: string; // 납기일자
    company_name: string;
    total_amount: number;
    delivery_place: string;
    payment_method: string; // 결제조건 추가
  };
  document_number: string;
  status: string;
  created_at: string;
  file_url: string;
  company_id: string;
  user_id: string;
}

interface User {
  id: string;
  name: string;
}

const EstimatePage = () => {
  const router = useRouter();
  const { id, companyId } = useParams();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]); // 유저 목록 추가
  const [loading, setLoading] = useState<boolean>(true);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null
  );
  const [items, setItems] = useState([
    { name: "", spec: "", quantity: "", unit_price: 0, amount: 0 },
  ]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [koreanAmount, setKoreanAmount] = useState("");

  // 토스트 관련 상태
  const [openSnackbar, setOpenSnackbar] = useState(false); // 스낵바 상태
  const [snackbarMessage, setSnackbarMessage] = useState<string>(""); // 스낵바 메시지

  const [openAddModal, setOpenAddModal] = useState(false); // 모달 상태 관리
  const [openEditModal, setOpenEditModal] = useState(false);
  const [newDocument, setNewDocument] = useState({
    id,
    company_name: "",
    contact: "",
    phone: "",
    fax: "",
    user_id: "",
    created_at: new Date().toISOString().split("T")[0], // 기본값 오늘 날짜
    delivery_date: "",
    payment_method: "",
    notes: "",
    status: "",
  });

  const [openModal, setOpenModal] = useState(false); // 모달 상태
  const [selectedDocument, setSelectedDocument] = useState<any>(null); // 선택된 문서

  const handleDocumentNumberClick = (document: any) => {
    setSelectedDocument(document);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const calculateTotalAmount = () => {
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    setTotalAmount(total);
    setKoreanAmount(numberToKorean(total));
  };

  const numberToKorean = (num: number): string => {
    const units = ["", "십", "백", "천"];
    const bigUnits = ["", "만", "억", "조", "경"];
    const digits = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
    let result = "";

    let bigUnitIndex = 0;

    while (num > 0) {
      const chunk = num % 10000;
      if (chunk > 0) {
        let chunkResult = "";
        let unitIndex = 0;
        let tempChunk = chunk;

        while (tempChunk > 0) {
          const digit = tempChunk % 10;
          if (digit > 0) {
            chunkResult = `${digits[digit]}${units[unitIndex]}${chunkResult}`;
          }
          tempChunk = Math.floor(tempChunk / 10);
          unitIndex++;
        }

        result = `${chunkResult}${bigUnits[bigUnitIndex]} ${result}`;
      }

      num = Math.floor(num / 10000);
      bigUnitIndex++;
    }

    return result.trim().replace(/일십/g, "십"); // '일십'을 '십'으로 간략화
  };

  const addItem = () => {
    setItems([
      ...items,
      { name: "", spec: "", quantity: "", unit_price: 0, amount: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  useEffect(() => {
    calculateTotalAmount();
  }, [items]);

  useEffect(() => {
    const fetchDocumentsAndCompany = async () => {
      setLoading(true);
      try {
        // 'consultation_id'에 해당하는 견적서 문서를 가져옵니다.
        const { data: documentData, error: documentError } = await supabase
          .from("documents")
          .select("*")
          .eq("consultation_id", id)
          .eq("type", "order");

        if (documentError) {
          console.error("문서 불러오기 실패:", documentError.message);
        } else {
          setDocuments(documentData || []); // 기존 문서 업데이트
        }

        // 회사명, 전화, 팩스 가져오기
        if (companyId) {
          const { data: companyData, error: companyError } = await supabase
            .from("companies")
            .select("name, phone, fax")
            .eq("id", companyId)
            .single();

          if (companyError) {
            console.error("회사명 불러오기 실패:", companyError.message);
          } else {
            setNewDocument({
              ...newDocument,
              company_name: companyData.name,
              phone: companyData.phone,
              fax: companyData.fax,
            });
          }
        }

        // 유저 목록 가져오기
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, name");

        if (userError) {
          console.error("유저 목록 불러오기 실패:", userError.message);
        } else {
          setUsers(userData || []);
        }
      } catch (error) {
        console.error("문서 가져오기 오류", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDocumentsAndCompany();
  }, [id]);

  const getUserNameById = (userId: string) => {
    const user = users.find((user) => user.id === userId);
    return user ? user.name : "Unknown User";
  };

  const handleDeleteDocument = (document: Document) => {
    setDocumentToDelete(document);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentToDelete.id);

      if (error) {
        console.error("삭제 실패:", error.message);
      } else {
        setOpenDeleteModal(false);
        setDocuments((prevDocuments) =>
          prevDocuments.filter((doc) => doc.id !== documentToDelete.id)
        );
        setSnackbarMessage("발주서가 삭제되었습니다.");
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error("삭제 오류:", error);
    }
  };

  // 견적서 추가 함수
  const handleAddDocument = async () => {
    const {
      company_name,
      contact,
      user_id,
      delivery_date,
      payment_method,
      notes,
    } = newDocument;

    console.log(newDocument);

    if (
      !company_name ||
      !contact ||
      !user_id ||
      !delivery_date ||
      !payment_method ||
      !items.length
    ) {
      setSnackbarMessage("모든 정보를 채워주세요");
      setOpenSnackbar(true);
      return;
    }

    const content = {
      items: items.map((item, index) => ({
        number: index + 1, // number는 숫자형으로 처리
        name: item.name,
        spec: item.spec,
        quantity: item.quantity, // 숫자형으로 처리
        unit_price: item.unit_price, // 숫자형으로 처리
        amount: item.quantity, // amount도 숫자형으로 처리
      })),
      company_name,
      total_amount: totalAmount, // totalAmount는 숫자형으로 처리
      delivery_date: newDocument.delivery_date,
      payment_method,
      notes,
    };
    console.log(newDocument, content);

    try {
      const { data, error } = await supabase
        .from("documents")
        .insert([
          {
            content, // 숫자형으로 처리된 content
            user_id,
            payment_method,
            contact,
            consultation_id: id,
            company_id: companyId,
            type: "order", // 문서 타입 지정
          },
        ])
        .select();

      if (error) {
        console.error("문서 추가 실패:", error.message);
      } else {
        setOpenAddModal(false);
        if (data && data.length > 0) {
          setDocuments((prev) => [...prev, data[0]]);
        }
        setSnackbarMessage("발주서가 추가되었습니다");
        setOpenSnackbar(true);

        setNewDocument({
          ...newDocument,
          contact: "",
          user_id: "",
          delivery_date: "",
          payment_method: "",
          notes: "",
        });
        setItems([
          {
            name: "",
            spec: "",
            quantity: "",
            unit_price: 0,
            amount: 0,
          },
        ]);
      }
    } catch (error) {
      console.error("추가 중 오류 발생", error);
    }
  };

  const handleEditModal = (document: Document) => {
    // edit default value
    setNewDocument({
      ...newDocument,
      id: document.id,
      company_name: document.content.company_name,
      contact: document.contact,
      user_id: document.user_id,
      created_at: document.created_at.split("T")[0], // 날짜 형식 변환
      delivery_date: document.content.delivery_date, // 납기일
      payment_method: document.content.payment_method,
      notes: document.content.notes,
      status: document.status,
    });

    // edit default value
    setItems(
      document.content.items.map((item) => ({
        name: item.name,
        spec: item.spec,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
      }))
    );

    // 모달을 열기
    setOpenEditModal(true);
  };

  const handleEditCloseModal = () => {
    setOpenEditModal(false);
    setItems([
      {
        name: "",
        spec: "",
        quantity: "",
        unit_price: 0,
        amount: 0,
      },
    ]);
    setNewDocument({
      ...newDocument,
      contact: "",
      user_id: "",
      delivery_date: "",
      payment_method: "",
      notes: "",
      status: "pending",
    });
  };

  const handleEditDocument = async () => {
    const {
      company_name,
      contact,
      delivery_date,
      notes,
      payment_method,
      user_id,
    } = newDocument;

    if (
      !contact ||
      !delivery_date ||
      !notes ||
      !payment_method ||
      !user_id ||
      !delivery_date ||
      !items.length
    ) {
      setSnackbarMessage("모든 정보를 채워주세요");
      setOpenSnackbar(true);
      return;
    }

    const content = {
      items: items.map((item, index) => ({
        number: index + 1,
        name: item.name,
        spec: item.spec,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.quantity,
      })),
      company_name,
      total_amount: totalAmount,
      delivery_date,
      payment_method,
      notes,
    };

    try {
      const { data, error } = await supabase
        .from("documents")
        .update({
          content,
          user_id,
          payment_method,
          contact,
          status: newDocument.status,
        })
        .eq("id", newDocument.id)
        .select();

      if (error) {
        console.error("문서 수정 실패", error.message);
      } else {
        if (data && data.length > 0) {
          // 수정된 문서를 리스트에서 찾아서 업데이트
          const updatedDocuments = documents.map((doc) =>
            doc.id === data[0].id ? { ...doc, ...data[0] } : doc
          );

          setDocuments(updatedDocuments); // documents 업데이트
        }

        setSnackbarMessage("발주서가 수정되었습니다.");
        setOpenSnackbar(true);
        handleEditCloseModal();
      }
    } catch (error) {
      console.error("수정 중 오류 발생", error);
    }
  };

  const handleUnitPriceChange = (index: number, value: string) => {
    // 입력값에서 쉼표 제거 및 숫자로 변환
    const numericValue = parseFloat(value.replace(/,/g, ""));

    // NaN 방지: 숫자로 변환이 실패하면 0을 기본값으로 설정
    const validUnitPrice = isNaN(numericValue) ? 0 : numericValue;

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              unit_price: validUnitPrice, // 단가 업데이트
              amount:
                validUnitPrice *
                (parseFloat(item.quantity.replace(/[^\d]/g, "")) || 0), // 수량이 NaN일 경우 0 처리
            }
          : item
      )
    );
  };

  const handleQuantityChange = (index: number, value: string) => {
    // 수량에서 숫자와 단위 분리
    const numericValue = parseFloat(
      value.replace(/,/g, "").replace(/[^\d]/g, "")
    );
    const unit = value.replace(/[\d,]/g, "").trim();

    // NaN 방지: 숫자로 변환이 실패하면 0을 기본값으로 설정
    const validQuantity = isNaN(numericValue) ? 0 : numericValue;

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              quantity: `${validQuantity.toLocaleString()}${unit}`, // 수량과 단위 결합
              amount: validQuantity * item.unit_price, // 금액 재계산
            }
          : item
      )
    );
  };

  return (
    <div>
      <div className="mb-2">
        <Link href="/customers" className="text-blue-500 hover:font-bold">
          거래처 관리
        </Link>{" "}
        &gt; <span className="font-semibold">{newDocument.company_name}</span>{" "}
        &gt;{" "}
        <span
          onClick={() => router.push(`/consultations/${companyId}`)}
          className="text-blue-500 hover:font-bold cursor-pointer"
        >
          상담내역
        </span>{" "}
        &gt; 발주서 &gt; {id?.slice(0, 4)}
      </div>

      <div className="flex my-3">
        <div
          className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
          onClick={() => setOpenAddModal(true)}
        >
          <span className="mr-2">+</span>
          <span>추가</span>
        </div>
      </div>

      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <div>
          <table className="min-w-full table-auto border-collapse text-center">
            <thead>
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
                  발주
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                  총액
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] text-center ">
                  상태
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] text-center">
                  문서번호
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] text-center">
                  수정
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] text-center">
                  삭제
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {new Date(document.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {new Date(
                      document.content.delivery_date
                    ).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {document.contact} {/* 담당자 */}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {getUserNameById(document.user_id)} {/* 견적자 */}
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
                      <div key={index}>
                        <p>
                          {item.name} | {item.spec} | {item.quantity}
                        </p>
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {document.content.total_amount.toLocaleString()}{" "}
                    {/* 총액에 콤마 추가 */}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {document.status === "pending" && "진행"}
                    {document.status === "completed" && "완료"}
                    {document.status === "canceled" && "취소"}
                  </td>
                  <td
                    className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
                    onClick={() => handleDocumentNumberClick(document)}
                  >
                    {document.document_number}
                  </td>
                  <td
                    className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
                    onClick={() => handleEditModal(document)}
                  >
                    수정
                  </td>
                  <td
                    className="px-4 py-2 border-b border-r-[1px] text-red-500 cursor-pointer"
                    onClick={() => handleDeleteDocument(document)}
                  >
                    삭제
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openAddModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md w-2/3 max-w-6xl">
            <div className="flex justify-between">
              <h3 className="text-xl font-semibold mb-4">발주서 추가</h3>
              <div className="flex space-x-3">
                <span className={"text-blue-500 font-bold"}>진행</span>
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
                </span>
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
                <input
                  type="text"
                  value={newDocument.contact}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, contact: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 space-x-4">
              {/* 결제조건 */}
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">
                  결제방식
                </label>
                <input
                  type="text"
                  value={newDocument.payment_method}
                  onChange={(e) =>
                    setNewDocument({
                      ...newDocument,
                      payment_method: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">발주일</label>
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
              </div>
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">납기일</label>
                <input
                  type="date"
                  value={newDocument.delivery_date}
                  onChange={(e) =>
                    setNewDocument({
                      ...newDocument,
                      delivery_date: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">발주자</label>
                <select
                  value={newDocument.user_id}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, user_id: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
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
              <div></div>
              <div></div>
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
                  value={`₩ ${totalAmount.toLocaleString()}`}
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
                      setItems((prev) =>
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
                      setItems((prev) =>
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
                    value={item.quantity.toLocaleString()} // 화면에 콤마가 추가된 수량을 표시
                    onChange={(e) =>
                      handleQuantityChange(index, e.target.value)
                    }
                    className="col-span-1 px-1 border border-gray-300 rounded-md text-sm"
                  />

                  <input
                    type="text" // 'number'에서 'text'로 변경
                    placeholder="단가"
                    value={item.unit_price.toLocaleString()} // 화면에 콤마가 추가된 단가를 표시
                    onChange={(e) =>
                      handleUnitPriceChange(index, e.target.value)
                    } // 단가 변경 핸들러
                    className="col-span-2 px-1 border border-gray-300 rounded-md text-sm"
                  />

                  <input
                    type="text" // 'number'에서 'text'로 변경
                    placeholder="금액"
                    value={item.amount.toLocaleString()} // 화면에 콤마가 추가된 금액을 표시
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
                className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm"
              >
                취소
              </button>
              <button
                onClick={handleAddDocument}
                className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {openEditModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md w-2/3 max-w-6xl">
            <div className="flex justify-between">
              <h3 className="text-xl font-semibold mb-4">발주서 수정</h3>
              <div className="flex space-x-3">
                <span
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
                </span>
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
                <input
                  type="text"
                  value={newDocument.contact} // 기존 데이터 입력
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, contact: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 space-x-4">
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">
                  결제조건
                </label>
                <input
                  type="text"
                  value={newDocument.payment_method} // 기존 데이터 입력
                  onChange={(e) =>
                    setNewDocument({
                      ...newDocument,
                      payment_method: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">발주일</label>
                <input
                  type="date"
                  value={newDocument.created_at} // 기존 데이터 입력
                  onChange={(e) =>
                    setNewDocument({
                      ...newDocument,
                      created_at: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">납기일</label>
                <input
                  type="date"
                  value={newDocument.delivery_date} // 기존 데이터 입력
                  onChange={(e) =>
                    setNewDocument({
                      ...newDocument,
                      delivery_date: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium">발주자</label>
                <select
                  value={newDocument.user_id} // 기존 데이터 입력
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, user_id: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
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
              <div></div>
              <div></div>
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
                  value={`₩ ${totalAmount.toLocaleString()}`}
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
                      setItems((prev) =>
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
                      setItems((prev) =>
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
                    value={item.quantity.toLocaleString()} // 화면에 콤마가 추가된 수량을 표시
                    onChange={(e) =>
                      handleQuantityChange(index, e.target.value)
                    }
                    className="col-span-1 px-1 border border-gray-300 rounded-md text-sm"
                  />

                  <input
                    type="text" // 'number'에서 'text'로 변경
                    placeholder="단가"
                    value={item.unit_price.toLocaleString()} // 화면에 콤마가 추가된 단가를 표시
                    onChange={(e) =>
                      handleUnitPriceChange(index, e.target.value)
                    }
                    className="col-span-2 px-1 border border-gray-300 rounded-md text-sm"
                  />

                  <input
                    type="text" // 'number'에서 'text'로 변경
                    placeholder="금액"
                    value={item.amount.toLocaleString()} // 화면에 콤마가 추가된 금액을 표시
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
                onClick={handleEditCloseModal}
                className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm"
              >
                취소
              </button>
              <button
                onClick={handleEditDocument}
                className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {openDeleteModal && documentToDelete && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md w-1/3 max-w-lg">
            <h3 className="text-xl font-semibold mb-2">견적서 삭제</h3>
            <p>
              정말로 "{documentToDelete.document_number}"의 견적서를
              삭제하시겠습니까?
            </p>

            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => setOpenDeleteModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {openModal && (
        <DocumentModal
          document={selectedDocument}
          onClose={handleCloseModal}
          users={users}
          company_fax={newDocument.fax}
          company_phone={newDocument.phone}
        />
      )}
      {/* 스낵바 */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{
          vertical: "bottom", // 하단
          horizontal: "right", // 오른쪽
        }}
      >
        <Alert severity="success">{snackbarMessage}</Alert>
      </Snackbar>
    </div>
  );
};

export default EstimatePage;
