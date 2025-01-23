"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import DocumentModal from "@/components/documents/estimate/DocumentModal";
import { Snackbar, Alert } from "@mui/material"; // MUI Snackbar 임포트
import Estimate from "./Estimate";
import { useLoginUser } from "@/app/context/login";

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
      unit: string;
    }[];
    notes: string;
    valid_until: string;
    company_name: string;
    total_amount: number;
    delivery_term: string;
    delivery_place: string;
    payment_method: string; // 결제조건 추가
    delivery_date: string;
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

const DocPage = () => {
  const user = useLoginUser();
  const router = useRouter();
  const { type } = useParams();

  const searchParams = useSearchParams();
  const id = searchParams.get("consultId") || "";
  const companyId = searchParams.get("compId") || "";
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]); // 유저 목록 추가
  const [loading, setLoading] = useState<boolean>(true);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null
  );

  const [items, setItems] = useState([
    { name: "", spec: "", quantity: "", unit_price: 0, amount: 0 }, // unit 제거
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
    // ESC 키 핸들러
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenModal(false);
        setOpenAddModal(false); // 추가 모달 닫기
        setOpenEditModal(false); // 수정 모달 닫기
        setOpenDeleteModal(false); // 삭제 모달 닫기
      }
    };

    // 키다운 이벤트 등록
    window.addEventListener("keydown", handleKeyDown);

    // 언마운트 시 이벤트 제거
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
          .eq("type", type);

        console.log("documentdata", documentData);
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
  }, [id, type]);

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
        setSnackbarMessage("견적서가 삭제되었습니다.");
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error("삭제 오류:", error);
    }
  };

  // 견적서 추가 함수
  const handleAddDocument = async () => {
    if (type === "estimate") {
      const {
        company_name,
        contact,
        phone,
        fax,
        valid_until,
        payment_method,
        notes,
      } = newDocument;

      if (
        !company_name ||
        !contact ||
        !valid_until ||
        !payment_method ||
        !notes ||
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
          amount:
            item.unit_price *
            parseFloat(item.quantity.replace(/,/g, "").replace(/[^\d]/g, "")),
        })),
        company_name,
        total_amount: totalAmount, // totalAmount는 숫자형으로 처리
        valid_until,
        delivery_place: newDocument.delivery_place,
        delivery_term: newDocument.delivery_term,
        payment_method,
        notes,
      };

      try {
        const { data, error } = await supabase
          .from("documents")
          .insert([
            {
              content, // 숫자형으로 처리된 content
              user_id: user?.id,
              payment_method,
              contact,
              consultation_id: id,
              company_id: companyId,
              type, // 문서 타입 지정
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
          setSnackbarMessage("견적서가 추가되었습니다");
          setOpenSnackbar(true);
        }
      } catch (error) {
        console.error("추가 중 오류 발생", error);
      } finally {
        setNewDocument({
          ...newDocument,
          contact: "",
          valid_until: new Date(new Date().setDate(new Date().getDate() + 14))
            .toISOString()
            .split("T")[0],
          payment_method: "",
          notes: "",
          delivery_place: "",
          delivery_term: "",
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
    } else if (type === "order") {
      const { company_name, contact, delivery_date, payment_method, notes } =
        newDocument;

      console.log(newDocument);

      if (
        !company_name ||
        !contact ||
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
              user_id: user?.id,
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
    } else {
      const { company_name, contact, delivery_date, notes, payment_method } =
        newDocument;

      console.log(newDocument);

      if (
        !company_name ||
        !contact ||
        !delivery_date ||
        !items.length ||
        !payment_method
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
        notes,
        payment_method,
      };
      console.log(newDocument, content);

      try {
        const { data, error } = await supabase
          .from("documents")
          .insert([
            {
              content, // 숫자형으로 처리된 content
              user_id: user?.id,
              contact,
              consultation_id: id,
              company_id: companyId,
              type: "requestQuote", // 문서 타입 지정
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
          setSnackbarMessage("견적의뢰서가 추가되었습니다");
          setOpenSnackbar(true);

          setNewDocument({
            ...newDocument,
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
        }
      } catch (error) {
        console.error("추가 중 오류 발생", error);
      }
    }
  };

  const handleEditModal = (document: Document) => {
    // edit default value
    setNewDocument({
      ...newDocument,
      id: document.id,
      company_name: document.content.company_name,
      contact: document.contact,
      created_at: document.created_at.split("T")[0], // 날짜 형식 변환
      valid_until: document.content.valid_until, // 유효기간
      payment_method: document.content.payment_method,
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
      payment_method: "",
      notes: "",
      delivery_place: "",
      delivery_term: "",
      status: "pending",
    });
  };

  const handleEditDocument = async () => {
    if (type === "estimate") {
      const {
        company_name,
        contact,
        delivery_place,
        delivery_term,
        notes,
        payment_method,
        valid_until,
      } = newDocument;

      if (
        !contact ||
        !delivery_place ||
        !delivery_term ||
        !notes ||
        !payment_method ||
        !valid_until ||
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
          amount:
            item.unit_price *
            parseFloat(item.quantity.replace(/,/g, "").replace(/[^\d]/g, "")),
        })),
        company_name,
        total_amount: totalAmount,
        valid_until,
        delivery_place: newDocument.delivery_place,
        delivery_term: newDocument.delivery_term,
        payment_method,
        notes,
      };

      try {
        const { data, error } = await supabase
          .from("documents")
          .update({
            content,
            payment_method,
            contact,
            // status: newDocument.status,
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

          setSnackbarMessage("견적서가 수정되었습니다.");
          setOpenSnackbar(true);
          handleEditCloseModal();
        }
      } catch (error) {
        console.error("수정 중 오류 발생", error);
      }
    } else if (type === "order") {
      const { company_name, contact, delivery_date, notes, payment_method } =
        newDocument;

      if (
        !contact ||
        !delivery_date ||
        !notes ||
        !payment_method ||
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
            payment_method,
            contact,
            // status: newDocument.status,
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
    } else {
      const { company_name, contact, delivery_date, notes, payment_method } =
        newDocument;

      if (
        !contact ||
        !delivery_date ||
        !notes ||
        !delivery_date ||
        !items.length ||
        !payment_method
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
        notes,
        payment_method,
      };

      try {
        const { data, error } = await supabase
          .from("documents")
          .update({
            content,
            contact,
            // status: newDocument.status,
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

          setSnackbarMessage("의뢰서가 수정되었습니다.");
          setOpenSnackbar(true);
          handleEditCloseModal();
        }
      } catch (error) {
        console.error("수정 중 오류 발생", error);
      }
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

      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <>
          <Estimate
            user={user as any}
            type={type as string}
            documents={documents}
            getUserNameById={getUserNameById}
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
          />
        </>
      )}

      {openDeleteModal && documentToDelete && (
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
      )}

      {openModal && (
        <DocumentModal
          type="estimate"
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

export default DocPage;
