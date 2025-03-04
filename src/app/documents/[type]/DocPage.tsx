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

interface Document {
  id: string;
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

    const { contact, payment_method, notes } = newDocument;
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

    const { contact, payment_method, notes } = newDocument;

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
    if (num === 0) return "영"; // 0일 경우 예외 처리

    const isNegative = num < 0; // 🚀 음수 여부 확인
    num = Math.abs(num); // 🚀 절대값으로 변환 후 처리

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

    result = result.trim().replace(/일십/g, "십"); // '일십'을 '십'으로 간략화

    return isNegative ? `마이너스 ${result}` : result; // 🚀 음수일 경우 '마이너스' 추가
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

  const handleUnitPriceChange = (index: number, value: string) => {
    // 단가에서 음수 포함된 숫자만 추출
    const numericValue =
      value.replace(/,/g, "").match(/-?\d*\.?\d*/)?.[0] || "0";

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              unit_price: parseFloat(numericValue), // 🚀 음수 적용된 단가 저장
              amount:
                parseFloat(numericValue) *
                parseFloat(item.quantity.replace(/[^\d.-]/g, "")), // 🚀 음수 적용된 계산 반영
            }
          : item
      )
    );
  };

  const handleQuantityChange = (index: number, value: string) => {
    // 수량에서 숫자와 단위 분리 (음수 허용)
    const numericValue =
      value.replace(/,/g, "").match(/-?\d*\.?\d*/)?.[0] || "0"; // 🚀 음수 포함된 숫자 추출
    const unit = value.replace(/[-\d,]/g, "").trim(); // 🚀 숫자(- 포함) 제외하고 단위만 추출

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              quantity: `${numericValue}${unit}`, // 🚀 음수 포함된 수량 저장
              amount: parseFloat(numericValue) * item.unit_price, // 🚀 음수 적용된 계산 반영
            }
          : item
      )
    );
  };

  return (
    <div className="text-sm">
      <div className="mb-2">
        <Link href="/customers" className="text-blue-500 hover:font-bold">
          거래처 관리
        </Link>{" "}
        &gt; <span className="font-semibold">{newDocument.company_name}</span>{" "}
        &gt;{" "}
        <span
          // onClick={() => router.push(`/consultations/${companyId}`)}
          onClick={() => router.back()}
          className="text-blue-500 hover:font-bold cursor-pointer"
        >
          상담내역
        </span>{" "}
        &gt; {type === "estimate" && "견적서"}
        {type === "order" && "발주서"}
        {type === "requestQuote" && "의뢰서"} &gt; {id?.slice(0, 4)}
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
