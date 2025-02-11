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
  contact_name: string;
  consultation_id: string;
  type: string;
  contact: string;
  contact_level: string;
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

interface User {
  id: string;
  name: string;
}

interface Contacts {
  id: string;
  contact_name: string;
  department: string;
  mobile: string;
  email: string;
  company_id: string;
  level: string;
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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]); // 유저 목록 추가
  const [loading, setLoading] = useState<boolean>(true);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null
  );

  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState<Contacts[]>([]);

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
    fetchUser();
    fetchCompany();
    fetchContactsData();

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

  const fetchContactsData = async () => {
    if (!companyId) return;

    try {
      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select("id, contact_name, mobile, department, level, email,company_id")
        .eq("company_id", companyId);

      if (contactsError) {
        setSnackbarMessage("담당자를 불러오는 데 실패했습니다.");
        setOpenSnackbar(true);
      }

      setContacts(contactsData || []);
    } catch (error) {
      console.error("담당자 로딩 중 오류 발생:", error);
      setSnackbarMessage(
        "담당자 가져오는 중 오류가 발생했습니다.-fetchContactsData"
      );
      setOpenSnackbar(true);
    }
  };

  useEffect(() => {
    calculateTotalAmount();
  }, [items]);

  useEffect(() => {
    if (id) fetchDocuments();
  }, [id, contacts, type]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // 'consultation_id'에 해당하는 견적서 문서를 가져옵니다.
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .select("*")
        .eq("consultation_id", id)
        .eq("type", type)
        .order("created_at", { ascending: false });

      if (documentError) {
        setOpenSnackbar(true);
        setSnackbarMessage(`${type} 불러오기 실패`);
        console.error("문서 불러오기 실패:", documentError.message);
        return;
      }

      const documentIds = documentData.map((doc) => doc.id);

      const { data: contactDocuments, error: contactDocumentsError } =
        await supabase
          .from("contacts_documents")
          .select("document_id, contact_id")
          .in("document_id", documentIds);

      if (contactDocumentsError) {
        setOpenSnackbar(true);
        setSnackbarMessage(`담당자-연관문서 불러오기 실패`);
        console.error(
          "fetchDocuments-contactDocuments",
          contactDocumentsError.message
        );
        return;
      }

      // 🔹 Step 4: `contacts_documents`를 기반으로 `document_id`와 `contact` 정보를 매핑
      const contactsMap = new Map(
        contacts?.map((contact) => [
          contact.id,
          { name: contact.contact_name, level: contact.level },
        ])
      );

      const contactDocMap = new Map(
        contactDocuments.map((cd) => [
          cd.document_id,
          contactsMap.get(cd.contact_id) || { name: "없음", level: "없음" },
        ])
      );

      // 🔹 Step 5: 문서 리스트에 `contact_name`, `contact_level` 추가
      const updatedDocuments = documentData.map((doc) => ({
        ...doc,
        contact_name: contactDocMap.get(doc.id)?.name || "없음",
        contact_level: contactDocMap.get(doc.id)?.level || "없음",
      }));

      setDocuments(updatedDocuments);
    } catch (error) {
      console.error("문서 가져오기 오류", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompany = async () => {
    if (!companyId) return;

    try {
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("name, phone, fax")
        .eq("id", companyId)
        .single();

      if (companyError) {
        setOpenSnackbar(true);
        setSnackbarMessage(`fetchCompany - 회사명 불러오기 실패`);
        console.error("회사명 불러오기 실패:", companyError.message);
      }

      if (companyData)
        setNewDocument({
          ...newDocument,
          company_name: companyData.name,
          phone: companyData.phone,
          fax: companyData.fax,
        });

      return;
    } catch (error) {
      console.error("fetchUser - 유저 목록 불러오기 실패:", error);
    }
  };

  const fetchUser = async () => {
    // 유저 목록 가져오기
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, name");

      if (userError) {
        setOpenSnackbar(true);
        setSnackbarMessage(`fetchUser - 유저목록 불러오기 실패`);
        console.error("fetchDocuments-contactDocuments", userError.message);
        return;
      }

      setUsers(userData || []);
    } catch (error) {
      console.error("fetchUser - 유저 목록 불러오기 실패:", error);
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

  // 함수오류
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
      await supabase
        .from("contacts_documents")
        .delete()
        .eq("document_id", documentToDelete.id);

      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentToDelete.id);

      if (error) {
        console.error("삭제 실패:", error.message);
        return;
      }

      setDocuments((prev) =>
        prev.filter((doc) => doc.id !== documentToDelete.id)
      );

      setSnackbarMessage("문서가 삭제되었습니다.");
      setOpenSnackbar(true);
      setOpenDeleteModal(false);
    } catch (error) {
      console.error("삭제 중 오류 발생", error);
    }
  };

  // 문서 추가 함수
  const handleAddDocument = async () => {
    if (type === "estimate") {
      const {
        company_name,
        contact,
        valid_until,
        payment_method,
        notes,
        delivery_place,
      } = newDocument;

      if (!contact) {
        setSnackbarMessage("담당자를 선택해주세요");
        setOpenSnackbar(true);
        return;
      }

      if (!delivery_place) {
        setSnackbarMessage("납품장소를 입력해주세요.");
        setOpenSnackbar(true);
        return;
      }

      if (!payment_method) {
        setSnackbarMessage("결제방식을 선택헤주세요.");
        setOpenSnackbar(true);
        return;
      }

      if (!items.length) {
        setSnackbarMessage("품목을 최소 1개이상 추가해주세요.");
        setOpenSnackbar(true);
        return;
      }

      setSaving(true); // 🔹 저장 시작 → 로딩 활성화

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
        notes,
      };

      try {
        const { data, error } = await supabase
          .from("documents")
          .insert([
            {
              content,
              user_id: user?.id,
              payment_method,
              consultation_id: id,
              company_id: companyId,
              type,
            },
          ])
          .select()
          .single();

        if (error) {
          setOpenSnackbar(true);
          setSnackbarMessage("문서 추가 실패");
          console.error("문서 추가 실패:", error.message);
        }

        const document_id = data.id;

        const find_contact = contacts?.find(
          (con) => con.contact_name === contact
        );

        const { error: contacts_doc_error } = await supabase
          .from("contacts_documents")
          .insert({
            document_id,
            contact_id: find_contact?.id,
          });

        if (contacts_doc_error) {
          setSnackbarMessage("문서 - 담당자 연결 실패");
          setOpenSnackbar(true);
          console.log("contacts_doc_error", contacts_doc_error);
          return;
        }

        const updatedContactInfo = {
          contact_name: find_contact?.contact_name || "없음",
          contact_level: find_contact?.level || "없음",
        };

        // 🔹 문서 목록 업데이트
        setDocuments((prev) => [
          {
            ...data,
            ...updatedContactInfo, // 🔹 contact_name과 contact_level 추가
          },
          ...prev,
        ]);

        setOpenAddModal(false);
        setOpenSnackbar(true);
        setSnackbarMessage("문서가 생성되었습니다");

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
      } catch (error) {
        console.error("추가 중 오류 발생", error);
      } finally {
        setSaving(false);
      }
    } else if (type === "order") {
      const { company_name, contact, delivery_date, payment_method, notes } =
        newDocument;

      if (!contact) {
        setSnackbarMessage("담당자를 선택해주세요");
        setOpenSnackbar(true);
        return;
      }

      if (!delivery_date) {
        setSnackbarMessage("납기일을 입력해주세요.");
        setOpenSnackbar(true);
        return;
      }

      if (!payment_method) {
        setSnackbarMessage("결제방식을 선택해주세요.");
        setOpenSnackbar(true);
        return;
      }

      if (!items.length) {
        setSnackbarMessage("품목을 최소 1개 이상 추가해주세요.");
        setOpenSnackbar(true);
        return;
      }

      setSaving(true); // 🔹 저장 시작 → 로딩 활성화

      const content = {
        items: items.map((item, index) => ({
          number: index + 1, // 품목 번호
          name: item.name,
          spec: item.spec,
          quantity: item.quantity, // 숫자형으로 변환
          unit_price: item.unit_price, // 숫자형으로 변환
          amount:
            item.unit_price *
            parseFloat(item.quantity.replace(/,/g, "").replace(/[^\d]/g, "")), // 총 금액 계산
        })),
        company_name,
        total_amount: totalAmount, // 총 금액
        delivery_date,
        payment_method,
        notes,
      };

      try {
        // 🔹 Step 1: `documents` 테이블에 새 문서 추가
        const { data, error } = await supabase
          .from("documents")
          .insert([
            {
              content,
              user_id: user?.id,
              payment_method,
              consultation_id: id,
              company_id: companyId,
              type: "order",
            },
          ])
          .select()
          .single();

        if (error) {
          setOpenSnackbar(true);
          setSnackbarMessage("문서 추가 실패");
          console.error("문서 추가 실패:", error.message);
          return;
        }

        const document_id = data.id; // 새 문서 ID 가져오기

        // 🔹 Step 2: `contacts_documents` 테이블에 문서 - 담당자 연결
        const find_contact = contacts?.find(
          (con) => con.contact_name === contact
        );

        const { error: contacts_doc_error } = await supabase
          .from("contacts_documents")
          .insert({
            document_id,
            contact_id: find_contact?.id,
          });

        if (contacts_doc_error) {
          setSnackbarMessage("문서 - 담당자 연결 실패");
          setOpenSnackbar(true);
          console.log("contacts_doc_error", contacts_doc_error);
          return;
        }

        const updatedContactInfo = {
          contact_name: find_contact?.contact_name || "없음",
          contact_level: find_contact?.level || "없음",
        };

        // 🔹 문서 목록 업데이트
        setDocuments((prev) => [
          {
            ...data,
            ...updatedContactInfo, // 🔹 contact_name과 contact_level 추가
          },
          ...prev,
        ]);

        setOpenAddModal(false);
        setOpenSnackbar(true);
        setSnackbarMessage("발주서가 추가되었습니다");

        // 🔹 입력 필드 초기화
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
      } catch (error) {
        console.error("추가 중 오류 발생", error);
      } finally {
        setSaving(false);
      }
    } else {
      const { company_name, contact, delivery_date, notes, payment_method } =
        newDocument;

      if (!contact) {
        setSnackbarMessage("담당자를 선택해주세요");
        setOpenSnackbar(true);
        return;
      }

      if (!delivery_date) {
        setSnackbarMessage("납기일을 입력해주세요.");
        setOpenSnackbar(true);
        return;
      }

      if (!payment_method) {
        setSnackbarMessage("결제방식을 선택해주세요.");
        setOpenSnackbar(true);
        return;
      }

      if (!items.length) {
        setSnackbarMessage("품목을 최소 1개 이상 추가해주세요.");
        setOpenSnackbar(true);
        return;
      }

      setSaving(true); // 🔹 저장 시작 → 로딩 활성화

      const content = {
        items: items.map((item, index) => ({
          number: index + 1, // 품목 번호
          name: item.name,
          spec: item.spec,
          quantity: item.quantity, // 숫자형으로 변환
          unit_price: item.unit_price, // 숫자형으로 변환
          amount:
            item.unit_price *
            parseFloat(item.quantity.replace(/,/g, "").replace(/[^\d]/g, "")), // 총 금액 계산
        })),
        company_name,
        total_amount: totalAmount, // 총 금액
        delivery_date,
        payment_method,
        notes,
      };

      try {
        // 🔹 Step 1: `documents` 테이블에 새 문서 추가
        const { data, error } = await supabase
          .from("documents")
          .insert([
            {
              content,
              user_id: user?.id,
              payment_method,
              consultation_id: id,
              company_id: companyId,
              type: "requestQuote", // 문서 타입 지정
            },
          ])
          .select()
          .single();

        if (error) {
          setOpenSnackbar(true);
          setSnackbarMessage("문서 추가 실패");
          console.error("문서 추가 실패:", error.message);
          return;
        }

        const document_id = data.id; // 새 문서 ID 가져오기

        // 🔹 Step 2: `contacts_documents` 테이블에 문서 - 담당자 연결
        const find_contact = contacts?.find(
          (con) => con.contact_name === contact
        );

        const { error: contacts_doc_error } = await supabase
          .from("contacts_documents")
          .insert({
            document_id,
            contact_id: find_contact?.id,
          });

        if (contacts_doc_error) {
          setSnackbarMessage("문서 - 담당자 연결 실패");
          setOpenSnackbar(true);
          console.log("contacts_doc_error", contacts_doc_error);
          return;
        }

        const updatedContactInfo = {
          contact_name: find_contact?.contact_name || "없음",
          contact_level: find_contact?.level || "없음",
        };

        // 🔹 문서 목록 업데이트
        setDocuments((prev) => [
          {
            ...data,
            ...updatedContactInfo, // 🔹 contact_name과 contact_level 추가
          },
          ...prev,
        ]);

        setOpenAddModal(false);
        setOpenSnackbar(true);
        setSnackbarMessage("견적의뢰서가 추가되었습니다");

        // 🔹 입력 필드 초기화
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
      } catch (error) {
        console.error("추가 중 오류 발생", error);
      } finally {
        setSaving(false);
      }
    }
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

  const handleEditDocument = async () => {
    if (type === "estimate") {
      const {
        company_name,
        contact,
        delivery_place,
        notes,
        payment_method,
        valid_until,
      } = newDocument;

      if (!contact) {
        setSnackbarMessage("담당자를 선택해주세요.");
        setOpenSnackbar(true);
        return;
      }

      if (!delivery_place) {
        setSnackbarMessage("납품장소를 입력해주세요.");
        setOpenSnackbar(true);
        return;
      }

      if (!payment_method) {
        setSnackbarMessage("결제조건을 선택해주세요");
        setOpenSnackbar(true);
        return;
      }

      if (!items.length) {
        setSnackbarMessage("품목을 최소 1개이상 추가해주세요.");
        setOpenSnackbar(true);
        return;
      }

      setSaving(true); // 🔹 저장 시작 → 로딩 활성화

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
        notes,
      };

      try {
        const { data, error } = await supabase
          .from("documents")
          .update({
            content,
            payment_method,
            // status: newDocument.status,
          })
          .eq("id", newDocument.id)
          .select()
          .single();

        if (error) {
          setOpenSnackbar(true);
          setSnackbarMessage("문서 수정 실패");
          console.error("문서 수정 실패:", error.message);
        }

        const document_id = data.id; // 🔥 생성된 문서 ID

        const find_contact = contacts?.find(
          (con) => con.contact_name === contact
        );

        const { error: contacts_doc_error } = await supabase

          .from("contacts_documents")
          .update({
            contact_id: find_contact?.id,
          })
          .eq("document_id", document_id);

        if (contacts_doc_error) {
          setSnackbarMessage("문서 - 담당자 연결 수정 실패");
          setOpenSnackbar(true);
          console.log("contacts_doc_error", contacts_doc_error);
          return;
        }

        const updatedContactInfo = {
          contact_name: find_contact?.contact_name || "없음",
          contact_level: find_contact?.level || "없음",
        };

        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === document_id // 🔥 기존 문서의 ID와 수정된 문서의 ID가 같으면 업데이트
              ? { ...doc, ...data, ...updatedContactInfo }
              : doc
          )
        );

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

        setSnackbarMessage("견적서가 수정되었습니다.");
        setOpenSnackbar(true);
        setOpenEditModal(false);
      } catch (error) {
        console.error("수정 중 오류 발생", error);
      } finally {
        setSaving(false);
      }
    } else if (type === "order") {
      const { company_name, contact, delivery_date, notes, payment_method } =
        newDocument;

      if (!contact) {
        setSnackbarMessage("담당자를 선택해주세요.");
        setOpenSnackbar(true);
        return;
      }

      if (!delivery_date) {
        setSnackbarMessage("납품 날짜를 입력해주세요.");
        setOpenSnackbar(true);
        return;
      }

      if (!payment_method) {
        setSnackbarMessage("결제조건을 선택해주세요.");
        setOpenSnackbar(true);
        return;
      }

      if (!items.length) {
        setSnackbarMessage("품목을 최소 1개 이상 추가해주세요.");
        setOpenSnackbar(true);
        return;
      }

      console.log(newDocument);
      setSaving(true); // 🔹 저장 시작 → 로딩 활성화

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
          })
          .eq("id", newDocument.id)
          .select()
          .single();

        if (error) {
          setSnackbarMessage("발주서 수정 실패");
          setOpenSnackbar(true);
          console.error("문서 수정 실패:", error.message);
          return;
        }

        const document_id = data.id; // 🔥 생성된 문서 ID

        const find_contact = contacts?.find(
          (con) => con.contact_name === contact
        );

        const { error: contacts_doc_error } = await supabase
          .from("contacts_documents")
          .update({
            contact_id: find_contact?.id,
          })
          .eq("document_id", document_id);

        if (contacts_doc_error) {
          setSnackbarMessage("문서 - 담당자 연결 수정 실패");
          setOpenSnackbar(true);
          console.error("contacts_doc_error", contacts_doc_error);
          return;
        }

        const updatedContactInfo = {
          contact_name: find_contact?.contact_name || "없음",
          contact_level: find_contact?.level || "없음",
        };

        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === document_id // 🔥 기존 문서의 ID와 수정된 문서의 ID가 같으면 업데이트
              ? { ...doc, ...data, ...updatedContactInfo }
              : doc
          )
        );

        setNewDocument({
          ...newDocument,
          contact: "",
          delivery_date: new Date().toISOString().split("T")[0], // 🔹 기본값: 오늘 날짜
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

        setSnackbarMessage("발주서가 수정되었습니다.");
        setOpenSnackbar(true);
        setOpenEditModal(false);
      } catch (error) {
        console.error("수정 중 오류 발생", error);
      } finally {
        setSaving(false);
      }
    } else {
      const { company_name, contact, delivery_date, notes, payment_method } =
        newDocument;

      if (!contact) {
        setSnackbarMessage("담당자를 선택해주세요.");
        setOpenSnackbar(true);
        return;
      }

      if (!delivery_date) {
        setSnackbarMessage("납품 날짜를 입력해주세요.");
        setOpenSnackbar(true);
        return;
      }

      if (!payment_method) {
        setSnackbarMessage("결제조건을 선택해주세요.");
        setOpenSnackbar(true);
        return;
      }

      if (!items.length) {
        setSnackbarMessage("품목을 최소 1개 이상 추가해주세요.");
        setOpenSnackbar(true);
        return;
      }

      console.log(newDocument);
      setSaving(true); // 🔹 저장 시작 → 로딩 활성화

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
          })
          .eq("id", newDocument.id)
          .select()
          .single();

        if (error) {
          setSnackbarMessage("의뢰서 수정 실패");
          setOpenSnackbar(true);
          console.error("문서 수정 실패:", error.message);
          return;
        }

        const document_id = data.id; // 🔥 수정된 문서 ID

        const find_contact = contacts?.find(
          (con) => con.contact_name === contact
        );

        const { error: contacts_doc_error } = await supabase
          .from("contacts_documents")
          .update({
            contact_id: find_contact?.id,
          })
          .eq("document_id", document_id);

        if (contacts_doc_error) {
          setSnackbarMessage("문서 - 담당자 연결 수정 실패");
          setOpenSnackbar(true);
          console.error("contacts_doc_error", contacts_doc_error);
          return;
        }

        const updatedContactInfo = {
          contact_name: find_contact?.contact_name || "없음",
          contact_level: find_contact?.level || "없음",
        };

        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === document_id // 🔥 기존 문서의 ID와 수정된 문서의 ID가 같으면 업데이트
              ? { ...doc, ...data, ...updatedContactInfo }
              : doc
          )
        );

        setNewDocument({
          ...newDocument,
          contact: "",
          delivery_date: new Date().toISOString().split("T")[0], // 🔹 기본값: 오늘 날짜
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

        setSnackbarMessage("의뢰서가 수정되었습니다.");
        setOpenSnackbar(true);
        setOpenEditModal(false);
      } catch (error) {
        console.error("수정 중 오류 발생", error);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleUnitPriceChange = (index: number, value: string) => {
    // 입력값에서 쉼표 제거 및 숫자로 변환 (음수도 허용)
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
                (parseFloat(item.quantity.replace(/[^\d.-]/g, "")) || 0), // 🚀 음수 가능하도록 처리
            }
          : item
      )
    );
  };

  const handleQuantityChange = (index: number, value: string) => {
    // 수량에서 숫자와 단위 분리 (음수도 허용)
    const numericValue = parseFloat(
      value.replace(/,/g, "").replace(/[^\d.-]/g, "")
    );
    const unit = value.replace(/[\d,.-]/g, "").trim();

    // NaN 방지: 숫자로 변환이 실패하면 0을 기본값으로 설정
    const validQuantity = isNaN(numericValue) ? 0 : numericValue;

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              quantity: `${validQuantity.toLocaleString()}${unit}`, // 수량과 단위 결합
              amount: validQuantity * item.unit_price, // 🚀 음수 계산 가능하도록 처리
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
            contacts={contacts as Contacts[]}
            saving={saving}
            paymentMethods={estimate_payment_method}
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
            handleEditCloseModal={handleEditCloseModal}
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
