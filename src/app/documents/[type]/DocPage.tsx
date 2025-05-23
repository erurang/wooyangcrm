"use client";

import Estimate from "./Estimate";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";

import { useLoginUser } from "@/context/login";
import DocumentModal from "@/components/documents/estimate/DocumentModal";

import { useContactsByCompany } from "@/hooks/manage/customers/useContactsByCompany";
import { useDocuments } from "@/hooks/documents/useDocumentsList";
import { useAddDocument } from "@/hooks/documents/useAddDocument";
import { useUpdateDocument } from "@/hooks/documents/useUpdateDocument";
import { useDeleteDocument } from "@/hooks/documents/useDeleteDocument";
import SnackbarComponent from "@/components/Snackbar";
import { useCompanyInfo } from "@/hooks/documents/useCompanyInfo";
import { useUpdateDocumentStatus } from "@/hooks/documents/details/useUpdateDocumentStatus";

interface Document {
  id: string;
  date: string;
  contact_name: string;
  contact_level: string;
  contact_mobile: string;
  consultation_id: string;
  type: string;
  contact: string;
  user_name: string;
  user_level: string;
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

interface Contacts {
  id: string;
  contact_name: string;
  department: string;
  mobile: string;
  email: string;
  company_id: string;
  level: string;
  resign: boolean;
}

const DocPage = () => {
  const user = useLoginUser();
  const router = useRouter();
  const { type } = useParams();

  const estimate_payment_method = [
    "정기결제",
    "선현금결제",
    "선금50% 납품시50%",
    "협의",
  ];

  const searchParams = useSearchParams();
  const id = searchParams.get("consultId") || "";
  const companyId = searchParams.get("compId") || "";
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null
  );

  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState([
    { name: "", spec: "", quantity: "", unit_price: 0, amount: 0 }, // unit 제거
  ]);

  const [totalAmount, setTotalAmount] = useState(0);
  const [koreanAmount, setKoreanAmount] = useState("");

  // 토스트 관련 상태
  const [snackbarMessage, setSnackbarMessage] = useState<string>(""); // 스낵바 메시지

  const [openAddModal, setOpenAddModal] = useState(false); // 모달 상태 관리
  const [openEditModal, setOpenEditModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const [newDocument, setNewDocument] = useState({
    id,
    date: new Date().toISOString().split("T")[0],
    company_name: "",
    contact: "",
    phone: "",
    fax: "",
    created_at: new Date().toISOString().split("T")[0], // 기본값 오늘 날짜
    valid_until: new Date(new Date().setDate(new Date().getDate() + 14))
      .toISOString()
      .split("T")[0],
    payment_method: "",
    notes: "",
    delivery_term: "",
    delivery_place: "",
    status: "",
    delivery_date: "",
  });

  const [openModal, setOpenModal] = useState(false); // 모달 상태
  const [selectedDocument, setSelectedDocument] = useState<any>(null); // 선택된 문서

  useEffect(() => {
    // ESC 키 이벤트 리스너 추가
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenModal(false);
        setOpenAddModal(false);
        setOpenEditModal(false);
        setOpenDeleteModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [companyId]); // 🔥 companyId가 변경될 때만 실행

  // swr
  const { contacts } = useContactsByCompany([companyId]);
  const { documents, refreshDocuments } = useDocuments(id, type as string);

  const { company, isLoading, refreshCompany } = useCompanyInfo(companyId);
  const { addDocument, isAdding } = useAddDocument();
  const { updateDocument, isUpdating } = useUpdateDocument();
  const { trigger: updateStatus, isMutating } = useUpdateDocumentStatus();
  // const { deleteDocument, isDeleting } = useDeleteDocument();
  // swr

  const transformedDocuments = useMemo(() => {
    return documents.map((document: any) => {
      // `contacts_documents[0]`이 존재하는지 체크
      const userInfo = document.contacts_documents?.[0]?.users || {};
      const contactInfo = document.contacts_documents?.[0]?.contacts || {};

      return {
        user_name: userInfo.name || "퇴사",
        user_level: userInfo.level || "",
        contact_name: contactInfo.contact_name || "",
        contact_level: contactInfo.level || "",
        contact_mobile: contactInfo.mobile || "",
        ...document, // 기존 문서 데이터 유지
        contacts_documents: undefined, // 기존 contacts_documents 제거 (필요할 경우)
      };
    });
  }, [documents]); // 🔥 의존성 배열: documents가 변경될 때만 실행됨

  useEffect(() => {
    calculateTotalAmount();
  }, [items]);

  useEffect(() => {
    if (company && company.name !== newDocument.company_name) {
      setNewDocument((prev) => ({
        ...prev,
        company_name: company.name,
        phone: company.phone,
        fax: company.fax,
      }));
    }
  }, [company, newDocument.company_name]);

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    if (deleteReason.length === 0) return;

    try {
      // 2️⃣ 회사 삭제 요청 추가
      const { error } = await supabase.from("deletion_requests").insert([
        {
          type: "documents",
          related_id: documentToDelete.id,
          status: "pending",
          request_date: new Date(),
          user_id: user?.id || "",
          delete_reason: deleteReason,
          content: {
            documents: `
            문서번호 : ${documentToDelete.document_number}/
            ${documentToDelete.type === "estimate" && "견적서"}/${
              documentToDelete.type === "order" && "발주서"
            }/${documentToDelete.type === "requestQuote" && "의뢰서"}삭제 : 
            
            특기사항 : ${documentToDelete.content.notes}/
            담당자 : ${documentToDelete.contact_name} ${
              documentToDelete.contact_level
            }/
            품목 : ${documentToDelete.content.items.map(
              (n) => n.name
            )} / ${documentToDelete.content.items.map(
              (n) => n.spec
            )} / ${documentToDelete.content.items.map(
              (n) => n.quantity
            )} / ${documentToDelete.content.items.map((n) => n.amount)}
            `,
          },
        },
      ]);

      if (error) throw error;

      setSnackbarMessage("삭제 요청 완료");

      setOpenDeleteModal(false);
    } catch (error) {
      console.error("Error deleting consultations:", error);
      setSnackbarMessage("삭제 요청 실패");
    }
  };

  // const handleConfirmDelete = async () => {
  //   if (!documentToDelete) return;

  //   try {
  //     await supabase
  //       .from("contacts_documents")
  //       .delete()
  //       .eq("document_id", documentToDelete.id);

  //     const { error } = await supabase
  //       .from("documents")
  //       .delete()
  //       .eq("id", documentToDelete.id);

  //     if (error) {
  //       console.error("삭제 실패:", error.message);
  //       return;
  //     }

  //     setSnackbarMessage("문서가 삭제되었습니다.");

  //     setOpenDeleteModal(false);
  //   } catch (error) {
  //     console.error("삭제 중 오류 발생", error);
  //   }
  // };

  const handleAddDocument = async () => {
    if (isAdding) return;

    const { contact, payment_method, notes, date } = newDocument;
    let { delivery_place, valid_until, delivery_date, delivery_term } =
      newDocument;

    if (!contact) {
      setSnackbarMessage("담당자를 선택해주세요.");
      return;
    }
    if ((type === "estimate" || type === "order") && !payment_method) {
      setSnackbarMessage("결제방식을 선택해주세요.");
      return;
    }

    // if (!items.length) {
    //   setSnackbarMessage("품목을 최소 1개 이상 추가해주세요.");
    //   return;
    // }

    // 🔹 문서 타입별 필수 필드 검증
    if (type === "estimate" && !valid_until) {
      setSnackbarMessage("견적 만료일을 입력해주세요.");
      return;
    }
    if (type === "order" && !delivery_date) {
      setSnackbarMessage("납품일을 입력해주세요.");
      return;
    }
    if (type === "requestQuote" && !delivery_date) {
      setSnackbarMessage("납품일을 입력해주세요.");
      return;
    }

    setSaving(true);

    // 🔹 공통 `items` 변환
    const itemsData = items.map((item, index) => ({
      number: index + 1,
      name: item.name,
      spec: item.spec,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.unit_price * parseFloat(item.quantity.replace(/,/g, "")),
    }));

    // 🔹 문서 타입별 `content` 데이터 생성
    let content: any = {
      items: itemsData,
      company_name: newDocument.company_name,
      total_amount: totalAmount,
      payment_method,
      notes,
    };

    if (type === "estimate") {
      content = { ...content, valid_until, delivery_place, delivery_term };
    } else if (type === "order") {
      content = { ...content, delivery_date };
    } else if (type === "requestQuote") {
      content = { ...content, delivery_date };
    }

    try {
      const addedDocument = await addDocument({
        method: "POST",
        body: {
          date,
          content,
          user_id: user?.id,
          payment_method,
          consultation_id: id,
          company_id: companyId,
          type,
          contact_id: contacts.find((c: any) => c.contact_name === contact)?.id,
        },
      });

      if (!addedDocument?.document) {
        throw new Error("문서 추가 실패");
      }

      setSnackbarMessage("문서가 생성되었습니다");
      setOpenAddModal(false);
      await refreshDocuments(); // 문서 목록 최신화
    } catch (error) {
      setSnackbarMessage("문서 추가 중 오류 발생");
    } finally {
      setSaving(false);
    }
  };

  const handleEditDocument = async () => {
    if (isUpdating) return;

    const { contact, payment_method, notes, date } = newDocument;

    let { delivery_place, valid_until, delivery_date, delivery_term } =
      newDocument;

    if (!contact) {
      setSnackbarMessage("담당자를 선택해주세요.");
      return;
    }
    if ((type === "estimate" || type === "order") && !payment_method) {
      setSnackbarMessage("결제방식을 선택해주세요.");
      return;
    }
    // if (!items.length) {
    //   setSnackbarMessage("품목을 최소 1개 이상 추가해주세요.");
    //   return;
    // }

    // 🔹 문서 타입별 필수 필드 검증
    if (type === "estimate" && !valid_until) {
      setSnackbarMessage("견적 만료일을 입력해주세요.");
      return;
    }

    if ((type === "order" || type === "requestQuote") && !delivery_date) {
      setSnackbarMessage("납품일을 입력해주세요.");
      return;
    }

    setSaving(true);

    // 🔹 공통 `items` 변환
    const itemsData = items.map((item, index) => ({
      number: index + 1,
      name: item.name,
      spec: item.spec,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.unit_price * parseFloat(item.quantity.replace(/,/g, "")),
    }));

    // 🔹 문서 타입별 `content` 데이터 생성
    let content: any = {
      items: itemsData,
      company_name: newDocument.company_name,
      total_amount: totalAmount,
      payment_method,
      notes,
    };

    if (type === "estimate") {
      content = { ...content, valid_until, delivery_place, delivery_term };
    } else {
      content = { ...content, delivery_date };
    }

    try {
      const updatedDocument = await updateDocument({
        method: "PATCH",
        body: {
          date,
          document_id: newDocument.id,
          content,
          payment_method,
          contact_id: contacts.find((c: any) => c.contact_name === contact)?.id,
        },
      });

      if (!updatedDocument?.document) {
        throw new Error("문서 수정 실패");
      }

      setSnackbarMessage("문서가 수정되었습니다");
      setOpenEditModal(false);
      await refreshDocuments(); // 문서 목록 최신화
    } catch (error) {
      setSnackbarMessage("문서 수정 중 오류 발생");
    } finally {
      setSaving(false);
    }
  };

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
    setKoreanAmount(numberToKorean(total)); // 🔹 음수 값도 변환 가능하도록 적용
  };

  const numberToKorean = (num: number): string => {
    if (num === 0) return "영"; // ✅ "영 원"이 아니라 "영"만 반환

    const isNegative = num < 0;
    num = Math.abs(num);

    const units = ["", "십", "백", "천"];
    const bigUnits = ["", "만", "억", "조", "경"];
    const digits = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
    let result = "";

    const [integerPart, decimalPart] = num.toString().split(".");
    let intNum = parseInt(integerPart, 10);
    let bigUnitIndex = 0;

    while (intNum > 0) {
      const chunk = intNum % 10000;
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

      intNum = Math.floor(intNum / 10000);
      bigUnitIndex++;
    }

    // result = result.trim().replace(/일십/g, "십");

    let decimalResult = "";
    if (decimalPart && parseInt(decimalPart) > 0) {
      decimalResult = " 점 ";
      for (const digit of decimalPart) {
        decimalResult += digits[parseInt(digit, 10)] + " ";
      }
    }

    let finalResult = result.trim();

    if (decimalResult) {
      finalResult += decimalResult.trim();
    }

    return isNegative ? `마이너스 ${finalResult}` : finalResult.trim();
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

  const handleDeleteDocument = (document: Document) => {
    setDocumentToDelete(document);
    setOpenDeleteModal(true);
  };

  // 문서 수정 함수
  const handleEditModal = (document: Document) => {
    // edit default value
    setNewDocument({
      ...newDocument,
      id: document.id,
      date: document.date,
      company_name: document.content.company_name,
      contact: document.contact_name,
      created_at: document.created_at.split("T")[0], // 날짜 형식 변환
      valid_until: document.content.valid_until, // 유효기간
      payment_method: document.payment_method,
      notes: document.content.notes,
      delivery_term: document.content.delivery_term,
      delivery_place: document.content.delivery_place,
      delivery_date: document.content.delivery_date,
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

    setNewDocument({
      ...newDocument,
      delivery_place: "",
      delivery_term: "",
      payment_method: "",
      valid_until: new Date(new Date().setDate(new Date().getDate() + 14))
        .toISOString()
        .split("T")[0],
      contact: "",
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
  };

  const handleQuantityChange = (index: number, value: string) => {
    // 1) 숫자, 소수점(.), 마이너스(-), 쉼표(,)만 남긴다
    const numericPart = value.replace(/[^0-9.,-]/g, "");

    // 2) 쉼표 제거한 값으로 숫자 파싱
    const parsedNumber = parseFloat(numericPart.replace(/,/g, "")) || 0;

    // 3) 단위 추출 (숫자, 마이너스, 쉼표 등 제외)
    const unit = value.replace(/[0-9.,-]/g, "").trim();

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              // ✅ 사용자가 입력한 값(numericPart) + 단위(unit)을 그대로 표시
              quantity: numericPart !== "" ? `${numericPart}${unit}` : "",
              // ✅ 계산에는 쉼표 제거한 숫자(parsedNumber)만 사용
              amount: parsedNumber * item.unit_price,
            }
          : item
      )
    );
  };

  const handleUnitPriceChange = (index: number, value: string) => {
    // 1) 숫자, 소수점(.), 쉼표(,), 마이너스(-)만 남김
    const numericValue = value.replace(/[^0-9.,-]/g, "");
    // 2) 쉼표 제거 후 숫자 변환
    const parsedUnitPrice = parseFloat(numericValue.replace(/,/g, "")) || 0;

    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        // 🔹 수량 부분에서도 쉼표 제거 후 숫자로 변환
        const quantityPart = item.quantity.replace(/[^0-9.,-]/g, "");
        const parsedQty = parseFloat(quantityPart.replace(/,/g, "")) || 0;

        return {
          ...item,
          // 사용자 입력 필드엔 쉼표를 유지 (가독성)
          unit_price: parsedUnitPrice,
          // 금액은 쉼표 제거한 숫자끼리 곱해서 계산
          amount: parsedQty * parsedUnitPrice,
        };
      })
    );
  };

  const [statusChangeDoc, setStatusChangeDoc] = useState<Document | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("completed"); // 기본값: "completed"
  const [statusReason, setStatusReason] = useState<{
    completed: { reason: string; amount: number };
    canceled: { reason: string; amount: number };
  }>({
    completed: { reason: "", amount: 0 },
    canceled: { reason: "", amount: 0 },
  });

  // 상태 변경 핸들러
  // 상태 변경 핸들러
  const handleStatusChange = async () => {
    if (!statusChangeDoc || !selectedStatus) return;

    const confirmChange = window.confirm(
      "상태 변경은 되돌릴 수 없습니다. 변경할까요?"
    );

    if (!confirmChange) return;

    try {
      // 선택된 상태에 맞는 이유 설정
      const reasonText =
        statusReason[selectedStatus as "completed" | "canceled"]?.reason || ""; // 🔥 빈 문자열 방지
      const reason = {
        [selectedStatus]: {
          reason: reasonText,
        },
      };

      await updateStatus({
        id: statusChangeDoc.id,
        status: selectedStatus,
        status_reason: reason, // ✅ 수정된 형식으로 전달
      });

      // 상태 초기화
      setStatusChangeDoc(null);
      setStatusReason({
        completed: { reason: "", amount: 0 },
        canceled: { reason: "", amount: 0 },
      });

      setSnackbarMessage("문서 상태가 변경되었습니다.");
      await refreshDocuments();
    } catch (error) {
      setSnackbarMessage("상태 변경 중 오류 발생");
    }
  };

  return (
    <div className="text-sm">
      {/* <div className="flex my-3">
        <div
          className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
          onClick={() => setOpenAddModal(true)}
        >
          <span className="mr-2">+</span>
          <span>추가</span>
        </div>
      </div> */}

      <Estimate
        contacts={contacts as Contacts[]}
        saving={saving}
        paymentMethods={estimate_payment_method}
        user={user as any}
        type={type as string}
        documents={transformedDocuments}
        handleDocumentNumberClick={handleDocumentNumberClick}
        handleEditModal={handleEditModal}
        handleDeleteDocument={handleDeleteDocument}
        openAddModal={openAddModal}
        newDocument={newDocument}
        setNewDocument={setNewDocument}
        koreanAmount={koreanAmount}
        totalAmount={totalAmount}
        addItem={addItem}
        items={items}
        setItems={setItems}
        handleQuantityChange={handleQuantityChange}
        handleUnitPriceChange={handleUnitPriceChange}
        setOpenAddModal={setOpenAddModal}
        handleAddDocument={handleAddDocument}
        removeItem={removeItem}
        handleEditDocument={handleEditDocument}
        openEditModal={openEditModal}
        setOpenEditModal={setOpenEditModal}
        handleEditCloseModal={handleEditCloseModal}
        statusChangeDoc={statusChangeDoc}
        setStatusChangeDoc={setStatusChangeDoc}
        handleStatusChange={handleStatusChange}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        statusReason={statusReason}
        setStatusReason={setStatusReason}
      />

      {/* {openDeleteModal && documentToDelete && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md w-1/3 max-w-lg">
            <h3 className="text-xl font-semibold mb-2">
              {type === "estimate" && "견적서"}
              {type === "order" && "발주서"}
              {type === "requestQuote" && "의뢰서"} 삭제
            </h3>
            <p>
              정말로 "{documentToDelete.document_number}"의{" "}
              {type === "estimate" && "견적서"}
              {type === "order" && "발주서"}
              {type === "requestQuote" && "의뢰서"}를 삭제하시겠습니까?
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
      )} */}

      {openDeleteModal && documentToDelete && (
        <motion.div
          initial={{ opacity: 0, scale: 1 }} // 시작 애니메이션
          animate={{ opacity: 1, scale: 1 }} // 나타나는 애니메이션
          exit={{ opacity: 0, scale: 1 }} // 사라질 때 애니메이션
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50"
        >
          <div className="bg-white p-6 rounded-md w-1/3">
            <h3 className="text-xl font-semibold mb-4">삭제 요청</h3>
            <textarea
              className="w-full border rounded-md p-4 h-48"
              placeholder="삭제 사유를 입력해주세요."
              onChange={(e) => setDeleteReason(e.target.value)}
            />

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setOpenDeleteModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md"
              >
                취소
              </button>
              <button
                onClick={() => handleConfirmDelete()}
                className="bg-red-500 text-white px-4 py-2 rounded-md"
              >
                삭제
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {openModal && type === "estimate" && (
        <DocumentModal
          type="estimate"
          koreanAmount={numberToKorean}
          document={selectedDocument}
          onClose={handleCloseModal}
          company_fax={newDocument.fax}
          company_phone={newDocument.phone}
        />
      )}
      {openModal && type === "order" && (
        <DocumentModal
          type="order"
          koreanAmount={numberToKorean}
          document={selectedDocument}
          onClose={handleCloseModal}
          company_fax={newDocument.fax}
          company_phone={newDocument.phone}
        />
      )}
      {openModal && type === "requestQuote" && (
        <DocumentModal
          type="requestQuote"
          koreanAmount={numberToKorean}
          document={selectedDocument}
          onClose={handleCloseModal}
          company_fax={newDocument.fax}
          company_phone={newDocument.phone}
        />
      )}

      {/* 스낵바 */}
      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
};

export default DocPage;
